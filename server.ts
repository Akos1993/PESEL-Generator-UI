import express from "express";
import path from "path";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Support large base64-encoded ID photo uploads
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

// ─── Health check ────────────────────────────────────────────────────────────
app.get("/api/health", async (_req, res) => {
  try {
    const supabase = getSupabase(); // throws if key missing
    const { error } = await supabase.from(TABLE).select("id").limit(1);
    if (error) throw error;
    res.json({
      status: "connected",
      message: `Successfully connected to Supabase (${SUPABASE_URL}).`,
    });
  } catch (err: any) {
    const unconfigured =
      err.message.includes("Missing Supabase") ||
      err.message.includes("Invalid API key");
    res.json({
      status: unconfigured ? "unconfigured" : "disconnected",
      message: err.message,
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
  } catch (err: any) {
    console.warn("Supabase fetch warning:", err.message);
    // Return empty array so the client falls back to localStorage gracefully
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
  } catch (err: any) {
    console.error("Supabase upsert error:", err.message);
    res.status(500).json({ error: err.message });
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
  } catch (err: any) {
    console.error("Supabase delete error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─── DELETE all people (admin "Clear DB") ────────────────────────────────────
// Uses .not("id", "is", null) to match every row without a literal filter value.
// Note: this requires either RLS to be disabled on the table, or a service_role key.
app.delete("/api/people", async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .not("id", "is", null); // matches all rows

    if (error) throw error;
    res.json({ success: true, message: "All records deleted from Supabase." });
  } catch (err: any) {
    console.error("Supabase clear-db error:", err.message);
    res.status(500).json({ error: err.message });
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Supabase proxy server listening on http://0.0.0.0:${PORT}`);
  });
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

    // ─── Auto‑archive to history ────────────────────────────────────────────
    try {
      if (data.verificationStatus === "approved") {
        console.log(`Archiving ${data.id} to history…`);

        const { error: insertErr } = await supabase
          .from("history")
          .insert({
            pesel: data.pesel,
            created_at: new Date().toISOString()
          });

        if (insertErr) throw insertErr;

        const { error: deleteErr } = await supabase
          .from("people")
          .delete()
          .eq("id", data.id);

        if (deleteErr) throw deleteErr;

        console.log(`Archived ${data.id} successfully.`);
      }
    } catch (archiveErr: any) {
      console.error("Archive error:", archiveErr.message);
    }

    res.json(data);
  } catch (err: any) {
    console.error("Supabase upsert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
app.post("/api/people", async (req, res) => {
  try {
    const person = req.body;
    if (!person?.id) {
      return res.status(400).json({ error: "Missing person data or id field." });
    }

    const supabase = getSupabase();

    // ─── Check if this person already exists ────────────────────────────────
    const { data: existing } = await supabase
      .from("people")
      .select("*")
      .eq("id", person.id)
      .single();

    // ─── If new entry → force verificationStatus = "pending" ───────────────
    const payload = {
      ...person,
      verificationStatus: existing
        ? person.verificationStatus ?? existing.verificationStatus
        : "pending",
      createdAt: existing ? existing.createdAt : Date.now()
    };

    // ─── Upsert the person ─────────────────────────────────────────────────
    const { data, error } = await supabase
      .from("people")
      .upsert(payload, { onConflict: "id" })
      .select()
      .single();

    if (error) throw error;

    // ─── Auto‑archive to history when approved ─────────────────────────────
    try {
      if (data.verificationStatus === "approved") {
        console.log(`Archiving ${data.id} to history…`);

        const { error: insertErr } = await supabase
          .from("history")
          .insert({
            pesel: data.pesel,
            created_at: new Date().toISOString()
          });

        if (insertErr) throw insertErr;

        const { error: deleteErr } = await supabase
          .from("people")
          .delete()
          .eq("id", data.id);

        if (deleteErr) throw deleteErr;

        console.log(`Archived ${data.id} successfully.`);
      }
    } catch (archiveErr: any) {
      console.error("Archive error:", archiveErr.message);
    }

    res.json(data);
  } catch (err: any) {
    console.error("Supabase upsert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

}

serveApp();
