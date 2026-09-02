const http = require("http");
const { URL } = require("url");
const guildConfig = require("../utils/guildConfig");
const guildFeatures = require("../utils/guildFeatures");
const caseManager = require("../utils/caseManager");
const botRegistry = require("../utils/botRegistry");
const featureCatalog = require("../utils/featureCatalog");
const storage = require("../utils/storage");

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function auth(req, apiKey) {
  if (!apiKey) return true;
  const header = req.headers.authorization || "";
  return header === "Bearer " + apiKey;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => {
      data += chunk;
      if (data.length > 1024 * 1024) req.destroy();
    });
    req.on("end", () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch { reject(new Error("Invalid JSON")); }
    });
    req.on("error", reject);
  });
}

function createApiServer({ client, apiKey = null, port = 0 }) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");
      if (url.pathname === "/health") return json(res, 200, {
        ok: true, service: "coderyx-core", uptime: process.uptime(),
        discordReady: client.isReady(), storage: await storage.health()
      });
      if (!auth(req, apiKey)) return json(res, 401, { error: "Unauthorized" });

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "api" || parts[1] !== "v1") return json(res, 404, { error: "Not found" });

      if (parts[2] === "features" && req.method === "GET") {
        return json(res, 200, featureCatalog);
      }

      if (parts[2] === "guilds" && parts[3]) {
        const guildId = parts[3];
        const guild = client.guilds.cache.get(guildId);
        if (!guild) return json(res, 404, { error: "Guild not found or bot is not in guild" });

        if (parts[4] === "features") {
          if (req.method === "GET") return json(res, 200, guildFeatures.snapshot(guildId));
          if (req.method === "PATCH") {
            const body = await readBody(req);
            if (typeof body.feature !== "string" || typeof body.enabled !== "boolean")
              return json(res, 400, { error: "feature and boolean enabled are required" });
            if (!featureCatalog[body.feature]) return json(res, 400, { error: "Unknown feature" });
            guildFeatures.setEnabled(guildId, body.feature, body.enabled);
            return json(res, 200, { ok: true, feature: body.feature, enabled: guildFeatures.isEnabled(guildId, body.feature) });
          }
        }

        if (parts[4] === "config") {
          if (req.method === "GET") return json(res, 200, guildConfig.getAll(guildId));
          if (req.method === "PATCH") {
            const body = await readBody(req);
            const updated = guildConfig.patch(guildId, body);
            return json(res, 200, updated);
          }
        }

        if (parts[4] === "cases") {
          if (req.method !== "GET") return json(res, 405, { error: "Method not allowed" });
          const userId = url.searchParams.get("userId");
          const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
          return json(res, 200, userId ? caseManager.getForUser(guildId, userId, limit) : caseManager.list(guildId, limit));
        }
      }

      if (parts[2] === "me" && req.method === "GET") {
        const ownerId = url.searchParams.get("ownerId");
        if (!ownerId) return json(res, 400, { error: "Authenticated owner is required" });
        const bots = botRegistry.listByOwner(ownerId);
        const guilds = bots.flatMap(b => b.guilds.map(id => ({ id, name: client.guilds.cache.get(id)?.name || null, botId: b.botId })));
        return json(res, 200, { ownerId, bots, guilds });
      }

      if (parts[2] === "bots" && req.method === "GET") {
        const ownerId = url.searchParams.get("ownerId");
        return json(res, 200, ownerId ? botRegistry.listByOwner(ownerId) : { error: "ownerId is required" });
      }

      return json(res, 404, { error: "Route not found" });
    } catch (error) {
      return json(res, 500, { error: error.message });
    }
  });
  server.listen(port);
  return server;
}
module.exports = { createApiServer };
