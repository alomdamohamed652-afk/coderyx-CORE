const http = require("http");
const { URL } = require("url");
const guildConfig = require("../utils/guildConfig");
const guildFeatures = require("../utils/guildFeatures");
const caseManager = require("../utils/caseManager");
const botRegistry = require("../utils/botRegistry");
const featureCatalog = require("../utils/featureCatalog");
const storage = require("../utils/storage");
const fs = require("fs");
const path = require("path");

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}
function auth(req, apiKey) {
  if (!apiKey) return true;
  const header = req.headers.authorization || "";
  return header === "Bearer " + apiKey;
}
function oauthConfig() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    redirectUri: process.env.DISCORD_REDIRECT_URI || "https://coderyx-core-production.up.railway.app/api/auth/discord/callback"
  };
}

function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

async function discordToken(code) {
  const cfg = oauthConfig();
  const body = new URLSearchParams({
    client_id: cfg.clientId,
    client_secret: cfg.clientSecret,
    grant_type: "authorization_code",
    code,
    redirect_uri: cfg.redirectUri
  });
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body
  });
  if (!response.ok) throw new Error("Discord OAuth token exchange failed");
  return response.json();
}

async function discordApi(pathname, token) {
  const response = await fetch("https://discord.com/api" + pathname, {
    headers: { Authorization: "Bearer " + token }
  });
  if (!response.ok) throw new Error("Discord API request failed: " + response.status);
  return response.json();
}

function sessionCookie(value) {
  return "coderyx_session=" + encodeURIComponent(value) + "; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400";
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
      // Custom-coded dashboard static assets
      if (req.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/dashboard/"))) {
        const relative = url.pathname === "/" ? "index.html" : url.pathname.slice("/dashboard/".length);
        const file = path.join(__dirname, "..", "..", "dashboard", relative);
        const dashboardRoot = path.resolve(path.join(__dirname, "..", "..", "dashboard"));
        if (path.resolve(file).startsWith(dashboardRoot) && fs.existsSync(file) && fs.statSync(file).isFile()) {
          const ext = path.extname(file);
          const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
          res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
          return res.end(fs.readFileSync(file));
        }
      }

      if (url.pathname === "/api/auth/discord") {
        const cfg = oauthConfig();
        if (!cfg.clientId || !cfg.clientSecret) return json(res, 500, { error: "Discord OAuth is not configured" });
        const authUrl = new URL("https://discord.com/oauth2/authorize");
        authUrl.searchParams.set("client_id", cfg.clientId);
        authUrl.searchParams.set("redirect_uri", cfg.redirectUri);
        authUrl.searchParams.set("response_type", "code");
        authUrl.searchParams.set("scope", "identify guilds");
        res.writeHead(302, { Location: authUrl.toString() });
        return res.end();
      }

      if (url.pathname === "/api/auth/discord/callback") {
        const code = url.searchParams.get("code");
        if (!code) return json(res, 400, { error: "Missing OAuth code" });
        const tokens = await discordToken(code);
        const user = await discordApi("/users/@me", tokens.access_token);
        const guilds = await discordApi("/users/@me/guilds", tokens.access_token);
        const session = Buffer.from(JSON.stringify({
          user, guilds, accessToken: tokens.access_token, expiresAt: Date.now() + (tokens.expires_in || 86400) * 1000
        })).toString("base64url");
        res.writeHead(302, { "Set-Cookie": sessionCookie(session), Location: "/" });
        return res.end();
      }

      if (url.pathname === "/api/auth/me" && req.method === "GET") {
        const cookie = parseCookies(req).coderyx_session;
        if (!cookie) return json(res, 401, { authenticated: false });
        try {
          const session = JSON.parse(Buffer.from(decodeURIComponent(cookie), "base64url").toString("utf8"));
          if (!session.user || Date.now() > session.expiresAt) return json(res, 401, { authenticated: false });
          const botGuildIds = new Set(client.guilds.cache.keys());
          const manageableGuilds = (session.guilds || []).filter(g =>
            g.owner === true || ((Number(g.permissions) & 0x20) === 0x20)
          ).map(g => ({ ...g, botInstalled: botGuildIds.has(g.id) }));
          return json(res, 200, { authenticated: true, user: session.user, guilds: manageableGuilds });
        } catch {
          return json(res, 401, { authenticated: false });
        }
      }

      if (url.pathname === "/api/auth/logout") {
        res.writeHead(302, { "Set-Cookie": "coderyx_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0", Location: "/" });
        return res.end();
      }

      if (url.pathname === "/health") return json(res, 200, {
        ok: true, service: "coderyx-core", uptime: process.uptime(),
        discordReady: client.isReady(), storage: await storage.health()
      });
      // Browser dashboard must never receive the Core API key. It is only used server-to-server.
      // Static dashboard routes are public for now; protected API routes still require Bearer auth.
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
