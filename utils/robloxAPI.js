const noblox = require('noblox.js');
const { getBlacklistedGroups } = require('./database');

let loggedIn = false;

/**
 * Initialize Roblox API with cookie authentication
 */
async function initializeRoblox() {
  const cookie = process.env.ROBLOX_COOKIE;
  const groupId = process.env.ROBLOX_GROUP_ID;
  
  if (!cookie) {
    console.error('[ERROR] Roblox cookie not found! Please set the ROBLOX_COOKIE environment variable.');
    return false;
  }
  
  if (!groupId) {
    console.error('[ERROR] Roblox group ID not found! Please set the ROBLOX_GROUP_ID environment variable.');
    return false;
  }

  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getCurrentUser();
    console.log(`[INFO] Logged into Roblox as ${currentUser.UserName} (${currentUser.UserID})`);
    loggedIn = true;
    return true;
  } catch (error) {
    console.error('[ERROR] Failed to authenticate with Roblox:', error);
    return false;
  }
}

/**
 * Get user info by username
 * @param {string} username - Roblox username
 * @returns {Promise<Object>} - User info object
 */
async function getUserInfo(username) {
  try {
    // First get the user ID from the username
    const userId = await noblox.getIdFromUsername(username);
    if (!userId) {
      return null;
    }
    
    // Get user information
    const userInfo = await noblox.getPlayerInfo(userId);
    
    // Get avatar URL
    const avatarUrl = await getPlayerAvatar(userId);
    
    return {
      userId: userId,
      username: username,
      displayName: userInfo.displayName,
      blurb: userInfo.blurb,
      joinDate: userInfo.joinDate,
      age: userInfo.age,
      avatarUrl: avatarUrl
    };
  } catch (error) {
    console.error(`[ERROR] Failed to get user info for ${username}:`, error);
    return null;
  }
}

/**
 * Get player's avatar URL
 * @param {number} userId - Roblox user ID
 * @returns {Promise<string>} - Avatar URL
 */
async function getPlayerAvatar(userId) {
  try {
    // Get the headshot thumbnail
    const avatarData = await noblox.getPlayerThumbnail(
      userId,
      "420x420", // Size
      "png", // Format
      false, // Is circular
      "headshot" // Type
    );
    
    if (avatarData && avatarData.length > 0 && avatarData[0].imageUrl) {
      return avatarData[0].imageUrl;
    }
    return null;
  } catch (error) {
    console.error(`[ERROR] Failed to get avatar for user ${userId}:`, error);
    return null;
  }
}

/**
 * Check if user is in any blacklisted groups
 * @param {number} userId - Roblox user ID
 * @returns {Promise<Object>} - Results of blacklist check
 */
async function checkBlacklistedGroups(userId) {
  try {
    const blacklistedGroups = getBlacklistedGroups();
    if (blacklistedGroups.length === 0) {
      return { inBlacklistedGroup: false, groups: [] };
    }
    
    const userGroups = await noblox.getGroups(userId);
    const blacklisted = userGroups.filter(group => 
      blacklistedGroups.includes(String(group.Id))
    );
    
    return {
      inBlacklistedGroup: blacklisted.length > 0,
      groups: blacklisted
    };
  } catch (error) {
    console.error(`[ERROR] Failed to check blacklisted groups for user ${userId}:`, error);
    return { error: 'Failed to check blacklisted groups', errorDetails: error.message };
  }
}

/**
 * Rank user in Roblox group
 * @param {number} userId - Roblox user ID
 * @param {number|string} rankNameOrId - Rank name or ID
 * @returns {Promise<Object>} - Result of ranking operation
 */
async function rankUser(userId, rankNameOrId) {
  if (!loggedIn) {
    return { success: false, error: 'Bot is not logged into Roblox' };
  }
  
  const groupId = process.env.ROBLOX_GROUP_ID;
  
  try {
    let rankId;
    // Check if the input is already a number
    if (!isNaN(rankNameOrId)) {
      rankId = parseInt(rankNameOrId, 10);
    } else {
      // Get the rank ID from the rank name
      const roles = await noblox.getRoles(groupId);
      const role = roles.find(r => r.name.toLowerCase() === rankNameOrId.toLowerCase());
      if (!role) {
        return { success: false, error: `Rank "${rankNameOrId}" not found in group` };
      }
      rankId = role.rank;
    }
    
    // Check if user is in the group
    const userRank = await noblox.getRankInGroup(groupId, userId);
    if (userRank === 0) {
      return { success: false, error: 'User is not in the group' };
    }
    
    // Set the rank
    await noblox.setRank(groupId, userId, rankId);
    
    // Get the new rank name for confirmation
    const newRank = await noblox.getRankNameInGroup(groupId, userId);
    
    return { 
      success: true, 
      message: `Successfully ranked user to ${newRank}`,
      rankName: newRank,
      rankId: rankId
    };
  } catch (error) {
    console.error(`[ERROR] Failed to rank user ${userId} to ${rankNameOrId}:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's current rank in the group
 * @param {number} userId - Roblox user ID
 * @returns {Promise<Object>} - User's rank information
 */
async function getUserRank(userId) {
  const groupId = process.env.ROBLOX_GROUP_ID;
  
  try {
    const rankId = await noblox.getRankInGroup(groupId, userId);
    if (rankId === 0) {
      return { inGroup: false };
    }
    
    const rankName = await noblox.getRankNameInGroup(groupId, userId);
    return {
      inGroup: true,
      rankId: rankId,
      rankName: rankName
    };
  } catch (error) {
    console.error(`[ERROR] Failed to get rank for user ${userId}:`, error);
    return { error: 'Failed to get user rank', errorDetails: error.message };
  }
}

module.exports = {
  initializeRoblox,
  getUserInfo,
  checkBlacklistedGroups,
  rankUser,
  getUserRank,
  getPlayerAvatar
};
