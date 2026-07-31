import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://sixoixcbkkkudutlhxux.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNpeG9peGNia2trdWR1dGxoeHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUzOTMxMDIsImV4cCI6MjEwMDk2OTEwMn0.sk7b_ud-rTHEYa-spSvi4xmsmqXQ67ifrhTRXJBPXMw";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TRIP_ID_KEY = "europe-trip-cloud-id";

export function getStoredTripId() {
  try {
    return window.localStorage.getItem(TRIP_ID_KEY);
  } catch (e) {
    return null;
  }
}

function storeTripId(id) {
  try {
    window.localStorage.setItem(TRIP_ID_KEY, id);
  } catch (e) {}
}

export function clearStoredTripId() {
  try {
    window.localStorage.removeItem(TRIP_ID_KEY);
  } catch (e) {}
}

async function ensureSignedIn() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) return session;
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}

export async function createSharedTrip(budget, checklist) {
  await ensureSignedIn();
  const { data, error } = await supabase.rpc("create_trip", {
    p_budget: budget,
    p_checklist: checklist,
  });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  storeTripId(row.id);
  return row; // { id, code }
}

export async function joinSharedTrip(code) {
  await ensureSignedIn();
  const { data, error } = await supabase.rpc("join_trip", { p_code: code.trim().toUpperCase() });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  storeTripId(row.id);
  return row; // { id, budget, checklist }
}

export async function fetchSharedTrip(id) {
  await ensureSignedIn();
  const { data, error } = await supabase.from("trips").select("budget, checklist, code").eq("id", id).single();
  if (error) throw error;
  return data;
}

export async function updateSharedTrip(id, { budget, checklist }) {
  await ensureSignedIn();
  const payload = { updated_at: new Date().toISOString() };
  if (budget !== undefined) payload.budget = budget;
  if (checklist !== undefined) payload.checklist = checklist;
  const { error } = await supabase.from("trips").update(payload).eq("id", id);
  if (error) throw error;
}

const DOCS_BUCKET = "trip-documents";

export async function listDocuments(tripId) {
  await ensureSignedIn();
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).list(tripId, {
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) throw error;
  return (data || []).filter((f) => f.name !== ".emptyFolderPlaceholder");
}

export async function uploadDocument(tripId, file) {
  await ensureSignedIn();
  const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
  const path = `${tripId}/${Date.now()}_${safeName}`;
  const { error } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export async function deleteDocument(tripId, filename) {
  await ensureSignedIn();
  const { error } = await supabase.storage.from(DOCS_BUCKET).remove([`${tripId}/${filename}`]);
  if (error) throw error;
}

export async function getDocumentUrl(tripId, filename) {
  await ensureSignedIn();
  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(`${tripId}/${filename}`, 60 * 60);
  if (error) throw error;
  return data.signedUrl;
}

