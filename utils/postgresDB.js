const { Pool } = require('pg');

// Create a new pool instance using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

/**
 * Initialize the database by creating required tables if they don't exist
 */
async function initializeDatabase() {
  try {
    // Create verification codes table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verification_codes (
        user_id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        roblox_username TEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create verified users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS verified_users (
        user_id TEXT PRIMARY KEY,
        roblox_user_id TEXT NOT NULL,
        roblox_username TEXT NOT NULL,
        verified_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create blacklisted groups table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS blacklisted_groups (
        group_id TEXT PRIMARY KEY,
        added_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create tryout channels table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tryout_channels (
        guild_id TEXT PRIMARY KEY,
        channel_id TEXT NOT NULL,
        set_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create pending verifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS pending_verifications (
        user_id TEXT PRIMARY KEY,
        roblox_username TEXT NOT NULL,
        roblox_user_id TEXT NOT NULL,
        code TEXT NOT NULL,
        message_id TEXT NOT NULL,
        timestamp BIGINT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create tryout logs table (new)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tryout_logs (
        id SERIAL PRIMARY KEY,
        roblox_username TEXT NOT NULL,
        session_type TEXT NOT NULL,
        result TEXT NOT NULL,
        notes TEXT,
        logged_by TEXT NOT NULL,
        logged_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    // Create warnings table (new)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS warnings (
        id SERIAL PRIMARY KEY,
        guild_id TEXT NOT NULL,
        user_id TEXT NOT NULL, 
        warning TEXT NOT NULL,
        warned_by TEXT NOT NULL,
        warned_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    console.log('[INFO] PostgreSQL database initialized');
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to initialize database:', error);
    return false;
  }
}

// Verification code functions
async function getVerificationCode(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM verification_codes WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[ERROR] Failed to get verification code:', error);
    return null;
  }
}

async function setVerificationCode(userId, code, robloxUsername) {
  try {
    await pool.query(
      'INSERT INTO verification_codes (user_id, code, roblox_username) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (user_id) DO UPDATE SET code = $2, roblox_username = $3, created_at = NOW()',
      [userId, code, robloxUsername]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to set verification code:', error);
    return false;
  }
}

async function removeVerificationCode(userId) {
  try {
    await pool.query(
      'DELETE FROM verification_codes WHERE user_id = $1',
      [userId]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to remove verification code:', error);
    return false;
  }
}

// Verified users functions
async function getVerifiedUser(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM verified_users WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[ERROR] Failed to get verified user:', error);
    return null;
  }
}

async function setVerifiedUser(userId, robloxInfo) {
  try {
    await pool.query(
      'INSERT INTO verified_users (user_id, roblox_user_id, roblox_username) VALUES ($1, $2, $3) ' +
      'ON CONFLICT (user_id) DO UPDATE SET roblox_user_id = $2, roblox_username = $3, verified_at = NOW()',
      [userId, robloxInfo.robloxUserId, robloxInfo.robloxUsername]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to set verified user:', error);
    return false;
  }
}

// Blacklisted groups functions
async function isGroupBlacklisted(groupId) {
  try {
    const result = await pool.query(
      'SELECT * FROM blacklisted_groups WHERE group_id = $1',
      [String(groupId)]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[ERROR] Failed to check if group is blacklisted:', error);
    return false;
  }
}

async function addBlacklistedGroup(groupId) {
  try {
    await pool.query(
      'INSERT INTO blacklisted_groups (group_id) VALUES ($1) ON CONFLICT (group_id) DO NOTHING',
      [String(groupId)]
    );
    const result = await pool.query('SELECT COUNT(*) FROM blacklisted_groups');
    return parseInt(result.rows[0].count);
  } catch (error) {
    console.error('[ERROR] Failed to add blacklisted group:', error);
    return 0;
  }
}

async function removeBlacklistedGroup(groupId) {
  try {
    const result = await pool.query(
      'DELETE FROM blacklisted_groups WHERE group_id = $1 RETURNING group_id',
      [String(groupId)]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[ERROR] Failed to remove blacklisted group:', error);
    return false;
  }
}

async function getBlacklistedGroups() {
  try {
    const result = await pool.query('SELECT group_id FROM blacklisted_groups');
    return result.rows.map(row => row.group_id);
  } catch (error) {
    console.error('[ERROR] Failed to get blacklisted groups:', error);
    return [];
  }
}

// Tryout channel functions
async function setTryoutChannel(guildId, channelId) {
  try {
    await pool.query(
      'INSERT INTO tryout_channels (guild_id, channel_id) VALUES ($1, $2) ' +
      'ON CONFLICT (guild_id) DO UPDATE SET channel_id = $2, set_at = NOW()',
      [guildId, channelId]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to set tryout channel:', error);
    return false;
  }
}

async function getTryoutChannel(guildId) {
  try {
    const result = await pool.query(
      'SELECT channel_id FROM tryout_channels WHERE guild_id = $1',
      [guildId]
    );
    return result.rows[0]?.channel_id || null;
  } catch (error) {
    console.error('[ERROR] Failed to get tryout channel:', error);
    return null;
  }
}

// Pending verifications functions
async function setPendingVerification(userId, data) {
  try {
    await pool.query(
      'INSERT INTO pending_verifications (user_id, roblox_username, roblox_user_id, code, message_id, timestamp) ' +
      'VALUES ($1, $2, $3, $4, $5, $6) ' +
      'ON CONFLICT (user_id) DO UPDATE SET roblox_username = $2, roblox_user_id = $3, code = $4, message_id = $5, timestamp = $6, created_at = NOW()',
      [userId, data.robloxUsername, data.robloxUserId, data.code, data.messageId, data.timestamp]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to set pending verification:', error);
    return false;
  }
}

async function getPendingVerification(userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM pending_verifications WHERE user_id = $1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('[ERROR] Failed to get pending verification:', error);
    return null;
  }
}

async function removePendingVerification(userId) {
  try {
    await pool.query(
      'DELETE FROM pending_verifications WHERE user_id = $1',
      [userId]
    );
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to remove pending verification:', error);
    return false;
  }
}

// New functions for tryout logs
async function addTryoutLog(robloxUsername, sessionType, result, notes, loggedBy) {
  try {
    const queryResult = await pool.query(
      'INSERT INTO tryout_logs (roblox_username, session_type, result, notes, logged_by) ' +
      'VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [robloxUsername, sessionType, result, notes, loggedBy]
    );
    return queryResult.rows[0].id;
  } catch (error) {
    console.error('[ERROR] Failed to add tryout log:', error);
    return null;
  }
}

async function getTryoutLogs(limit = 10) {
  try {
    const result = await pool.query(
      'SELECT * FROM tryout_logs ORDER BY logged_at DESC LIMIT $1',
      [limit]
    );
    return result.rows;
  } catch (error) {
    console.error('[ERROR] Failed to get tryout logs:', error);
    return [];
  }
}

// Warning system functions
async function getWarnings(guildId, userId) {
  try {
    const result = await pool.query(
      'SELECT * FROM warnings WHERE guild_id = $1 AND user_id = $2 ORDER BY warned_at DESC',
      [guildId, userId]
    );
    return result.rows;
  } catch (error) {
    console.error('[ERROR] Failed to get warnings:', error);
    return [];
  }
}

async function addWarning(guildId, userId, warning, warnedBy) {
  try {
    const result = await pool.query(
      'INSERT INTO warnings (guild_id, user_id, warning, warned_by) VALUES ($1, $2, $3, $4) RETURNING id',
      [guildId, userId, warning, warnedBy]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error('[ERROR] Failed to add warning:', error);
    return null;
  }
}

async function removeWarning(warningId) {
  try {
    const result = await pool.query(
      'DELETE FROM warnings WHERE id = $1 RETURNING id',
      [warningId]
    );
    return result.rows.length > 0;
  } catch (error) {
    console.error('[ERROR] Failed to remove warning:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase,
  getVerificationCode,
  setVerificationCode,
  removeVerificationCode,
  getVerifiedUser,
  setVerifiedUser,
  isGroupBlacklisted,
  addBlacklistedGroup,
  removeBlacklistedGroup,
  getBlacklistedGroups,
  setTryoutChannel,
  getTryoutChannel,
  setPendingVerification,
  getPendingVerification,
  removePendingVerification,
  addTryoutLog,
  getTryoutLogs,
  getWarnings,
  addWarning,
  removeWarning
};