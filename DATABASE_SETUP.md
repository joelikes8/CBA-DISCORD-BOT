# Database Setup Guide

This document explains the database setup for the CBA Discord Bot.

## Database Structure

The bot requires a PostgreSQL database with the following tables:

### blacklisted_groups
```sql
CREATE TABLE IF NOT EXISTS blacklisted_groups (
  group_id TEXT PRIMARY KEY,
  added_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### verification_codes
```sql
CREATE TABLE IF NOT EXISTS verification_codes (
  user_id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  roblox_username TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### verified_users
```sql
CREATE TABLE IF NOT EXISTS verified_users (
  user_id TEXT PRIMARY KEY,
  roblox_user_id TEXT NOT NULL,
  roblox_username TEXT NOT NULL,
  verified_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### tryout_channels
```sql
CREATE TABLE IF NOT EXISTS tryout_channels (
  guild_id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  set_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### pending_verifications
```sql
CREATE TABLE IF NOT EXISTS pending_verifications (
  user_id TEXT PRIMARY KEY,
  roblox_username TEXT NOT NULL,
  roblox_user_id TEXT NOT NULL,
  code TEXT NOT NULL,
  message_id TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### tryout_logs
```sql
CREATE TABLE IF NOT EXISTS tryout_logs (
  id SERIAL PRIMARY KEY,
  roblox_username TEXT NOT NULL,
  session_type TEXT NOT NULL,
  result TEXT NOT NULL,
  notes TEXT,
  logged_by TEXT NOT NULL,
  logged_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

### warnings
```sql
CREATE TABLE IF NOT EXISTS warnings (
  id SERIAL PRIMARY KEY,
  guild_id TEXT NOT NULL,
  user_id TEXT NOT NULL, 
  warning TEXT NOT NULL,
  warned_by TEXT NOT NULL,
  warned_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

## Environment Variables

The bot requires the following environment variables for database connectivity:

- `DATABASE_URL`: The PostgreSQL connection string
- `PGHOST`: PostgreSQL host
- `PGPORT`: PostgreSQL port
- `PGUSER`: PostgreSQL username
- `PGPASSWORD`: PostgreSQL password
- `PGDATABASE`: PostgreSQL database name

## Testing Database Connectivity

You can test the database connectivity using the following commands:

```bash
node test-pending-verification.js
node test-blacklist.js
```

If these scripts run without errors, your database is configured correctly.

## Troubleshooting

If you encounter database errors:

1. Check that your DATABASE_URL is correct
2. Verify that the database user has proper permissions
3. Ensure that your database server is accessible from your hosting environment
4. Check the PostgreSQL logs for any authentication or connection issues