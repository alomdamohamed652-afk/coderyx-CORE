CREATE TABLE IF NOT EXISTS guild_settings (
  guild_id TEXT PRIMARY KEY,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS guild_features (
  guild_id TEXT NOT NULL,
  feature TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guild_id, feature)
);

CREATE TABLE IF NOT EXISTS moderation_cases (
  guild_id TEXT NOT NULL,
  case_id BIGINT NOT NULL,
  action TEXT NOT NULL,
  target_id TEXT,
  target_tag TEXT,
  moderator_id TEXT,
  moderator_tag TEXT,
  reason TEXT NOT NULL,
  duration TEXT,
  source TEXT NOT NULL DEFAULT 'command',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (guild_id, case_id)
);

CREATE INDEX IF NOT EXISTS moderation_cases_target_idx
  ON moderation_cases (guild_id, target_id, created_at DESC);

CREATE TABLE IF NOT EXISTS bot_instances (
  bot_id TEXT PRIMARY KEY,
  owner_id TEXT,
  product_id TEXT,
  name TEXT,
  guilds JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bot_products (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS licenses (
  id BIGSERIAL PRIMARY KEY,
  owner_id TEXT NOT NULL,
  bot_id TEXT,
  product_id TEXT,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);
