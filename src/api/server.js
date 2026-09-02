const http = require("http");
const { URL } = require("url");
const guildConfig = require("../utils/guildConfig");
const guildFeatures = require("../utils/guildFeatures");
const caseManager = require("../utils/caseManager");
const botRegistry = require("../utils/botRegistry");
const featureCatalog = require("../utils/featureCatalog");
const fs = require("fs");
const path = require("path");

const SUPER_ADMIN_ID = "798195732855128124";

function json(res, status, body) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(JSON.stringify(body));
}
function parseCookies(req) {
  const out = {};
  for (const part of String(req.headers.cookie || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}
function getSession(req) {
  const cookie = parseCookies(req).coderyx_session;
  if (!cookie) return null;
  try {
    const session = JSON.parse(Buffer.from(decodeURIComponent(cookie), "base64url").toString("utf8"));
    return session.user && session.expiresAt && Date.now() <= session.expiresAt ? session : null;
  } catch { return null; }
}
function apiKeyAuth(req, apiKey) {
  return !!apiKey && (req.headers.authorization || "") === "Bearer " + apiKey;
}
function oauthConfig() {
  return {
    clientId: process.env.DISCORD_CLIENT_ID || process.env.CLIENT_ID || "",
    clientSecret: process.env.DISCORD_CLIENT_SECRET || "",
    redirectUri: process.env.DISCORD_REDIRECT_URI || "https://coderyx-core-production.up.railway.app/api/auth/discord/callback"
  };
}
async function discordToken(code) {
  const cfg = oauthConfig();
  const body = new URLSearchParams({
    client_id: cfg.clientId, client_secret: cfg.clientSecret,
    grant_type: "authorization_code", code, redirect_uri: cfg.redirectUri
  });
  const response = await fetch("https://discord.com/api/oauth2/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body
  });
  if (!response.ok) throw new Error("Discord OAuth token exchange failed");
  return response.json();
}
async function discordApi(pathname, token) {
  const response = await fetch("https://discord.com/api" + pathname, { headers: { Authorization: "Bearer " + token } });
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
function canManageGuild(session, guildId) {
  if (!session?.user) return false;
  if (session.user.id === SUPER_ADMIN_ID) return true;
  const g = (session.guilds || []).find(x => x.id === guildId);
  return !!g && (g.owner === true || ((Number(g.permissions) & 0x20) === 0x20));
}
function dashboardGuilds(session, client) {
  const botIds = new Set(client.guilds.cache.keys());
  const oauth = new Map((session?.guilds || []).map(g => [g.id, g]));
  const ids = new Set();
  if (session?.user?.id === SUPER_ADMIN_ID) {
    for (const id of botIds) ids.add(id);
    for (const id of oauth.keys()) ids.add(id);
  } else {
    for (const g of session?.guilds || []) {
      if (g.owner === true || ((Number(g.permissions) & 0x20) === 0x20)) ids.add(g.id);
    }
  }
  return [...ids].map(id => {
    const og = oauth.get(id);
    const bg = client.guilds.cache.get(id);
    return {
      id,
      name: bg?.name || og?.name || "Unknown Server",
      icon: bg?.iconURL({ size: 128, extension: "png" }) || (og?.icon ? "https://cdn.discordapp.com/icons/" + id + "/" + og.icon + ".png?size=128" : null),
      botInstalled: botIds.has(id),
      owner: og?.owner === true,
      canManage: session?.user?.id === SUPER_ADMIN_ID || og?.owner === true || ((Number(og?.permissions || 0) & 0x20) === 0x20),
      memberCount: bg?.memberCount || null
    };
  }).sort((a, b) => a.name.localeCompare(b.name));
}
function createApiServer({ client, apiKey = null, port = 0 }) {
  const server = http.createServer(async (req, res) => {
    try {
      const url = new URL(req.url, "http://localhost");

      if (req.method === "GET" && (url.pathname === "/" || url.pathname.startsWith("/dashboard/"))) {
        const relative = url.pathname === "/" ? "index.html" : url.pathname.slice("/dashboard/".length);
        const file = path.join(__dirname, "..", "..", "dashboard", relative);
        const root = path.resolve(path.join(__dirname, "..", "..", "dashboard"));
        if (path.resolve(file).startsWith(root) && fs.existsSync(file) && fs.statSync(file).isFile()) {
          const ext = path.extname(file);
          const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8" };
          res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream", "Cache-Control": "no-store" });
          return res.end(fs.readFileSync(file));
        }
      }

      if (url.pathname === "/api/auth/discord" && req.method === "GET") {
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
      if (url.pathname === "/api/auth/discord/callback" && req.method === "GET") {
        const code = url.searchParams.get("code");
        if (!code) return json(res, 400, { error: "Missing OAuth code" });
        const tokens = await discordToken(code);
        const user = await discordApi("/users/@me", tokens.access_token);
        const guilds = await discordApi("/users/@me/guilds", tokens.access_token);
        const session = Buffer.from(JSON.stringify({ user, guilds, accessToken: tokens.access_token, expiresAt: Date.now() + (tokens.expires_in || 86400) * 1000 })).toString("base64url");
        res.writeHead(302, { "Set-Cookie": sessionCookie(session), Location: "/" });
        return res.end();
      }
      if (url.pathname === "/api/auth/me" && req.method === "GET") {
        const session = getSession(req);
        if (!session) return json(res, 401, { authenticated: false });
        return json(res, 200, { authenticated: true, superAdmin: session.user.id === SUPER_ADMIN_ID, user: session.user, guilds: dashboardGuilds(session, client) });
      }
      if (url.pathname === "/api/auth/logout" && req.method === "GET") {
        res.writeHead(302, { "Set-Cookie": "coderyx_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0", Location: "/" });
        return res.end();
      }
      if (url.pathname === "/health") return json(res, 200, { ok: true, service: "coderyx-core", uptime: process.uptime(), discordReady: client.isReady() });

      const session = getSession(req);
      const keyAuthorized = apiKeyAuth(req, apiKey);
      if (!keyAuthorized && !session) return json(res, 401, { error: "Unauthorized" });

      const parts = url.pathname.split("/").filter(Boolean);
      if (parts[0] !== "api" || parts[1] !== "v1") return json(res, 404, { error: "Not found" });

      if (parts[2] === "features" && req.method === "GET") return json(res, 200, featureCatalog);

      if (parts[2] === "guilds" && !parts[3] && req.method === "GET") {
        return json(res, 200, dashboardGuilds(session, client));
      }

      if (parts[2] === "guilds" && parts[3]) {
        const guildId = parts[3];
        if (!keyAuthorized && !canManageGuild(session, guildId)) return json(res, 403, { error: "You cannot manage this server" });

        const guild = client.guilds.cache.get(guildId);
        if (!guild) return json(res, 404, {
          error: "Core is not installed in this server",
          invite: `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(process.env.CLIENT_ID || "")}&permissions=8&scope=bot%20applications.commands`
        });

        if (parts[4] === "features") {
          if (req.method === "GET") return json(res, 200, guildFeatures.snapshot(guildId));
          if (req.method === "PATCH") {
            const body = await readBody(req);
            if (typeof body.feature !== "string" || typeof body.enabled !== "boolean") return json(res, 400, { error: "feature and boolean enabled are required" });
            const base = body.feature.split(".")[0];
            if (!featureCatalog[body.feature] && !featureCatalog[base] && !body.feature.startsWith("logger.") && !body.feature.startsWith("welcome.")) return json(res, 400, { error: "Unknown feature" });
            guildFeatures.setEnabled(guildId, body.feature, body.enabled);
            return json(res, 200, { ok: true, feature: body.feature, enabled: guildFeatures.isEnabled(guildId, body.feature) });
          }
        }
        if (parts[4] === "config") {
          if (req.method === "GET") return json(res, 200, guildConfig.getAll(guildId));
          if (req.method === "PATCH") return json(res, 200, guildConfig.patch(guildId, await readBody(req)));
        }
        if (parts[4] === "cases" && req.method === "GET") {
          const userId = url.searchParams.get("userId");
          const limit = Math.min(Number(url.searchParams.get("limit") || 50), 100);
          return json(res, 200, userId ? caseManager.getForUser(guildId, userId, limit) : caseManager.list(guildId, limit));
        }
        if (parts[4] === "summary" && req.method === "GET") {
          return json(res, 200, { id: guild.id, name: guild.name, icon: guild.iconURL({ size: 256, extension: "png" }), memberCount: guild.memberCount, channels: guild.channels.cache.size, roles: guild.roles.cache.size, features: guildFeatures.snapshot(guildId) });
        }
      }

      if (parts[2] === "me" && req.method === "GET") {
        const ownerId = session?.user?.id || url.searchParams.get("ownerId");
        if (!ownerId) return json(res, 400, { error: "Authenticated owner is required" });
        return json(res, 200, { ownerId, superAdmin: ownerId === SUPER_ADMIN_ID, bots: botRegistry.listByOwner(ownerId) });
      }
      if (parts[2] === "bots" && req.method === "GET") {
        const ownerId = session?.user?.id || url.searchParams.get("ownerId");
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
