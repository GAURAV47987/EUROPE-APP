// Europe trip planner: Groq-backed assistant.
//
// Deploy via Supabase Dashboard -> Edge Functions -> Create a new function
// named "groq-assist" -> paste this file as its index.ts -> Deploy.
// Then set a secret: Edge Functions -> Secrets -> GROQ_API_KEY
// (from https://console.groq.com/keys).
//
// Two modes, both POSTed as JSON:
//   { mode: "receipt", imageBase64, mimeType }  -> structured expense fields
//   { mode: "ask", question }                    -> a short text answer

import { createClient } from "npm:@supabase/supabase-js@2";

const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
const GROQ_VISION_MODEL = Deno.env.get("GROQ_VISION_MODEL") || "llama-3.2-90b-vision-preview";
const GROQ_TEXT_MODEL = Deno.env.get("GROQ_TEXT_MODEL") || "llama-3.3-70b-versatile";
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

const TRIP_CONTEXT =
  "Trip route: Sydney -> Athens -> Ios -> Paros -> Budapest -> Prague -> Cesky Krumlov -> Hallstatt -> Vienna -> Sydney, " +
  "23 Aug - 15 Sep 2026. Two travellers (a couple).";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const RECEIPT_PROMPT = `You are extracting a single travel expense from a photo of a receipt.

Trip currencies in use: ${CURRENCIES.join(", ")}.
Categories, pick exactly one: ${CATEGORIES.join(", ")}.
Cities on this trip, pick the closest match if shown, else null: ${CITIES.map((c) => `${c.id} (${c.name})`).join(", ")}.

Respond with ONLY a JSON object, no markdown, no explanation, in this exact shape:
{"description": string, "amount": number, "currency": one of the currencies above, "category": one of the categories above, "city": one of the city ids above or null}

Use the receipt's final total (not a subtotal or a single line item). If currency is ambiguous, infer from context (country/symbol) or default to EUR. If you cannot determine the amount at all, set amount to 0.`;

async function callGroq(model, messages, jsonMode) {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.3,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Groq error ${res.status}: ${errText.slice(0, 300)}`);
  }
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from Groq");
  return content;
}

function extractJson(raw) {
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
    if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY secret is not set");

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
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

    if (body.mode === "receipt") {
      const messages = [
        {
          role: "user",
          content: [
            { type: "text", text: RECEIPT_PROMPT },
            { type: "image_url", image_url: { url: `data:${body.mimeType || "image/jpeg"};base64,${body.imageBase64}` } },
          ],
        },
      ];
      const raw = await callGroq(GROQ_VISION_MODEL, messages, true);
      const parsed = extractJson(raw);
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
    }

    if (body.mode === "ask") {
      const question = String(body.question || "").slice(0, 500);
      if (!question.trim()) throw new Error("Empty question");
      const messages = [
        {
          role: "system",
          content:
            `You are a helpful, concise travel assistant for one specific couple's trip. ${TRIP_CONTEXT} ` +
            "Keep answers short and practical (2-5 sentences, or a short list for recommendations). " +
            "If asked about something outside this trip's scope, answer briefly anyway but you may note it's outside the itinerary.",
        },
        { role: "user", content: question },
      ];
      const answer = await callGroq(GROQ_TEXT_MODEL, messages, false);
      return new Response(JSON.stringify({ answer }), {
        headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
      });
    }

    throw new Error("Unknown mode");
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500,
      headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
    });
  }
});
