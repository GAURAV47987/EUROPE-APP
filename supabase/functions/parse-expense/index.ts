// Europe trip planner: Smart Add expense parser.
//
// Deploy via Supabase Dashboard -> Edge Functions -> Create a new function
// named "parse-expense" -> paste this file as its index.ts -> Deploy.
// Then set a secret: Edge Functions -> Secrets -> GEMINI_API_KEY
// (get a free key at https://aistudio.google.com/apikey).
//
// Accepts either free-form text ("40 euros lunch in Athens") or a photo of
// a receipt, and asks Gemini to return the expense as structured JSON
// matching this app's budget entry shape.

import { createClient } from "npm:@supabase/supabase-js@2";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

const CATEGORIES = ["Flights", "Accommodation", "Food", "Activities", "Transport", "Shopping", "Other"];
const CURRENCIES = ["AUD", "EUR", "HUF", "CZK", "USD"];
const CITIES = [
  { id: "athens", name: "Athens" },
  { id: "ios", name: "Ios" },
  { id: "paros", name: "Paros" },
  { id: "budapest", name: "Budapest" },
  { id: "prague", name: "Prague" },
  { id: "krumlov", name: "Cesky Krumlov" },
  { id: "hallstatt", name: "Hallstatt" },
  { id: "vienna", name: "Vienna" },
];

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PROMPT = `You are extracting a single travel expense from either a short spoken/typed note or a photo of a receipt.

Trip currencies in use: ${CURRENCIES.join(", ")}.
Categories, pick exactly one: ${CATEGORIES.join(", ")}.
Cities on this trip, pick the closest match if mentioned or shown, else null: ${CITIES.map((c) => `${c.id} (${c.name})`).join(", ")}.

Respond with ONLY a JSON object, no markdown, no explanation, in this exact shape:
{"description": string, "amount": number, "currency": one of the currencies above, "category": one of the categories above, "city": one of the city ids above or null}

If a receipt shows a total and a subtotal, use the final total. If currency is ambiguous, infer from context (country/symbol) or default to EUR. If you cannot determine the amount at all, set amount to 0.`;

function buildContents(mode: string, text?: string, imageBase64?: string, mimeType?: string) {
  const parts: Record<string, unknown>[] = [{ text: PROMPT }];
  if (mode === "image" && imageBase64) {
    parts.push({ inline_data: { mime_type: mimeType || "image/jpeg", data: imageBase64 } });
    parts.push({ text: "Read the receipt photo above and extract the expense." });
  } else {
    parts.push({ text: `Note: "${text || ""}"` });
  }
  return [{ role: "user", parts }];
}

function extractJson(raw: string) {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON in model response");
  return JSON.parse(cleaned.slice(start, end + 1));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: CORS_HEADERS });
  }

  try {
    if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY secret is not set");

    // Require a real (anonymous-or-otherwise) Supabase session, same as the
    // rest of the app's data access, so this isn't a fully open endpoint.
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const mode = body.mode === "image" ? "image" : "text";
    const contents = buildContents(mode, body.text, body.imageBase64, body.mimeType);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents, generationConfig: { temperature: 0, response_mime_type: "application/json" } }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini error ${geminiRes.status}: ${errText.slice(0, 300)}`);
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) throw new Error("Empty response from Gemini");

    const parsed = extractJson(rawText);

    const result = {
      description: typeof parsed.description === "string" ? parsed.description.slice(0, 120) : "",
      amount: Number.isFinite(Number(parsed.amount)) ? Number(parsed.amount) : 0,
      currency: CURRENCIES.includes(parsed.currency) ? parsed.currency : "EUR",
      category: CATEGORIES.includes(parsed.category) ? parsed.category : "Other",
      city: CITIES.some((c) => c.id === parsed.city) ? parsed.city : "",
    };

    return new Response(JSON.stringify(result), {
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
