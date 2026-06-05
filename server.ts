import express from "express";
import path from "path";
import { CosmosClient } from "@azure/cosmos";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

// Set limits high to support base64 encoded image uploads
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

let container: any = null;

async function getCosmosContainer() {
  if (container) return container;

  const endpoint = process.env.AZURE_COSMOS_ENDPOINT;
  const key = process.env.AZURE_COSMOS_KEY;
  const connectionString = process.env.AZURE_COSMOS_CONNECTION_STRING;

  if (!connectionString && (!endpoint || !key)) {
    throw new Error(
      "Missing Azure Cosmos DB Configuration. Set AZURE_COSMOS_CONNECTION_STRING or both AZURE_COSMOS_ENDPOINT and AZURE_COSMOS_KEY in your settings."
    );
  }

  let client: CosmosClient;
  if (connectionString) {
    client = new CosmosClient(connectionString);
  } else {
    client = new CosmosClient({ endpoint: endpoint!, key: key! });
  }

  const databaseId = process.env.AZURE_COSMOS_DATABASE || "PeselMasterDb";
  const containerId = process.env.AZURE_COSMOS_CONTAINER || "Identities";

  const { database } = await client.databases.createIfNotExists({ id: databaseId });
  const { container: newContainer } = await database.containers.createIfNotExists({
    id: containerId,
    partitionKey: { paths: ["/id"] }
  });

  container = newContainer;
  return container;
}

// Check database configuration and health
app.get("/api/health", async (req, res) => {
  try {
    const c = await getCosmosContainer();
    res.json({ 
      status: "connected", 
      message: "Successfully connected to Azure Cosmos DB database." 
    });
  } catch (err: any) {
    res.json({ 
      status: "disconnected", 
      message: err.message 
    });
  }
});

// Fetch all database identities
app.get("/api/people", async (req, res) => {
  try {
    const c = await getCosmosContainer();
    const { resources } = await c.items.readAll().fetchAll();
    
    // Cosmos DB responds with specific metadata properties (e.g. _rid, _self, _etag, _attachments, _ts)
    // We filter them or keep them, standard sorting of records by creation is done below
    const sorted = (resources || []).sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
    res.json(sorted);
  } catch (err: any) {
    console.warn("Cosmos DB Fetch Warning:", err.message);
    res.status(200).json([]); // Fallback to empty array to ensure client doesn't break
  }
});

// Create/Upsert database identity
app.post("/api/people", async (req, res) => {
  try {
    const person = req.body;
    if (!person || !person.id) {
      return res.status(400).json({ error: "Missing model information or primary key" });
    }
    const c = await getCosmosContainer();
    const { resource } = await c.items.upsert(person);
    res.json(resource);
  } catch (err: any) {
    console.error("Cosmos DB Upsert error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete individual identity
app.delete("/api/people/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const c = await getCosmosContainer();
    await c.item(id, id).delete();
    res.json({ success: true, message: `Successfully deleted identity ${id}` });
  } catch (err: any) {
    console.error("Cosmos DB Delete Item error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Build Vite middleware and listen
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
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Express Azure DB proxy server listenting on http://0.0.0.0:${PORT}`);
  });
}

serveApp();
