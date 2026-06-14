import express from "express";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// ─── Supabase config ────────────────────────────────────────────────────────
const SUPABASE_URL = "https://jxdtfbcyqdcdpgrpzgfh.supabase.co";
const TABLE = "people";

/**
 * Returns an authenticated Supabase client.
 * Throws a clear error when the key env-var is missing so the health
 * endpoint can surface a useful message to the admin panel.
 *
 * Set ONE of the following env-vars before starting the server:
 *   SUPABASE_KEY            – recommended; accepts both anon and service_role keys
 *   SUPABASE_SERVICE_ROLE_KEY – alias accepted for convenience
 *   SUPABASE_ANON_KEY         – alias accepted for convenience
 */
function getSupabase(): SupabaseClient {
  const key =
    process.env.SUPABASE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "Missing Supabase key. Set SUPABASE_KEY (service_role or anon key) in your environment variables."
    );
  }

  return createClient(SUPABASE_URL, key);
}

const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : 'Unknown error';

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase.from(TABLE).select("id").limit(1);
    if (error) throw error;
    res.json({
      status: "connected",
      message: `Successfully connected to Supabase (${SUPABASE_URL}).`,
    });
  } catch (err) {
    const msg = getErrorMessage(err);
    const unconfigured =
      msg.includes("Missing Supabase") ||
      msg.includes("Invalid API key");
    res.json({
      status: unconfigured ? "unconfigured" : "disconnected",
      message: msg,
    });
  }
});

// ─── GET all people ──────────────────────────────────────────────────────────
app.get("/api/people", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .order("createdAt", { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.warn("Supabase fetch warning:", getErrorMessage(err));
    res.status(200).json([]);
  }
});

// ─── CREATE / UPSERT a person ────────────────────────────────────────────────
app.post("/api/people", async (req, res) => {
  try {
    const person = req.body;
    if (!person?.id) {
      return res.status(400).json({ error: "Missing person data or id field." });
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(person, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error("Supabase upsert error:", getErrorMessage(err));
    res.status(500).json({ error: getErrorMessage(err) });
  }
});

// ─── DELETE one person ────────────────────────────────────────────────────────
app.delete("/api/people/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const supabase = getSupabase();
    const { error } = await supabase.from(TABLE).delete().eq("id", id);

    if (error) throw error;
    res.json({ success: true, message: `Deleted identity ${id}.` });
  } catch (err) {
    console.error("Supabase delete error:", getErrorMessage(err));
    res.status(500).json({ error: getErrorMessage(err) });
  }
});

// ─── DELETE all people (admin "Clear DB") ────────────────────────────────────
app.delete("/api/people", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .not("id", "is", null);

    if (error) throw error;
    res.json({ success: true, message: "All records deleted from Supabase." });
  } catch (err) {
    console.error("Supabase clear-db error:", getErrorMessage(err));
    res.status(500).json({ error: getErrorMessage(err) });
  }
});

// ─── Vite dev / production static serving ────────────────────────────────────
async function serveApp() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Vite outputs to "build/" (configured in vite.config.ts to match Azure SWA)
    const buildPath = path.join(process.cwd(), "build");
    app.use(express.static(buildPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(buildPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Supabase proxy server listening on http://0.0.0.0:${PORT}`);
  });
}

serveApp();