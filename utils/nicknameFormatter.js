/**
 * Utility functions for formatting and setting nicknames
 */
const { getUserRank } = require('./robloxAPI');

/**
 * Maps Roblox rank names to standardized NATO rank codes
 * This helps identify a rank level across different armies
 */
const rankStandardizationMap = {
  // Enlisted ranks
  'Recruit': 'OR-1',
  'Private Basic': 'OR-2',
  'Private': 'OR-2',
  'Private Trained': 'OR-3',
  'Corporal': 'OR-4',
  'Lance Corporal': 'OR-3',
  'Master Corporal': 'OR-5',
  'Sergeant': 'OR-6',
  'Staff Sergeant': 'OR-7',
  'Warrant Officer': 'OR-7',
  'Master Warrant Officer': 'OR-8',
  'Chief Warrant Officer': 'OR-9',
  
  // Officer ranks
  'Second Lieutenant': 'OF-1',
  'Lieutenant': 'OF-1',
  'Captain': 'OF-2',
  'Major': 'OF-3',
  'Lieutenant Colonel': 'OF-4',
  'Colonel': 'OF-5',
  'Brigadier General': 'OF-6',
  'Major General': 'OF-7',
  'Lieutenant General': 'OF-8',
  'General': 'OF-9',
  
  // Default rank code if not found
  'default': 'M' // Member
};

/**
 * Get the standardized rank code for a Roblox rank name
 * @param {string} rankName - The Roblox rank name
 * @returns {string} - Standardized rank code
 */
function getStandardizedRankCode(rankName) {
  if (!rankName) return rankStandardizationMap.default;
  
  // Try direct match
  if (rankStandardizationMap[rankName]) {
    return rankStandardizationMap[rankName];
  }
  
  // Try partial match (for ranks with additional text)
  for (const [key, value] of Object.entries(rankStandardizationMap)) {
    // Skip the default entry
    if (key === 'default') continue;
    
    // Check if the rankName contains the key
    if (rankName.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }
  
  // If we find a rank number pattern like [OR-4] or [OF-2]
  const rankPattern = /\[(OR|OF)-(\d+)\]/i;
  const match = rankName.match(rankPattern);
  if (match) {
    return `${match[1]}-${match[2]}`;
  }
  
  return rankStandardizationMap.default;
}

/**
 * Format nickname with rank code and username
 * @param {string} rankName - The Roblox rank name
 * @param {string} username - The Roblox username
 * @returns {string} - Formatted nickname
 */
function formatNickname(rankName, username) {
  const rankCode = getStandardizedRankCode(rankName);
  return `[${rankCode}] ${username}`;
}

/**
 * Set a user's nickname based on their Roblox information
 * @param {Object} member - Discord GuildMember object
 * @param {number} robloxUserId - Roblox user ID
 * @param {string} robloxUsername - Roblox username
 * @returns {Promise<Object>} - Result of the operation
 */
async function setFormattedNickname(member, robloxUserId, robloxUsername) {
  try {
    console.log(`[INFO] Setting formatted nickname for ${member.user.tag} (Roblox: ${robloxUsername})`);
    
    // Get the user's rank in the Roblox group
    const rankInfo = await getUserRank(robloxUserId);
    
    let nickname;
    if (rankInfo && rankInfo.inGroup && rankInfo.rankName) {
      // User is in the group, format with rank code
      console.log(`[INFO] User ${robloxUsername} has rank: ${rankInfo.rankName} (${rankInfo.rankId})`);
      nickname = formatNickname(rankInfo.rankName, robloxUsername);
    } else {
      // User is not in the group, just use their username with default rank code
      console.log(`[INFO] User ${robloxUsername} is not in the group or has no rank`);
      nickname = formatNickname(null, robloxUsername);
    }
    
    // Discord has a 32 character limit for nicknames
    if (nickname.length > 32) {
      // Truncate the username portion to fit within the limit
      const usernameMaxLength = 32 - (nickname.length - robloxUsername.length);
      const truncatedUsername = robloxUsername.substring(0, usernameMaxLength - 3) + '...';
      nickname = formatNickname(rankInfo?.rankName, truncatedUsername);
    }
    
    // Set the nickname
    await member.setNickname(nickname);
    console.log(`[INFO] Successfully set nickname for ${member.user.tag} to "${nickname}"`);
    
    return {
      success: true,
      nickname
    };
  } catch (error) {
    console.error(`[ERROR] Failed to set formatted nickname for ${member.user.tag}:`, error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  formatNickname,
  getStandardizedRankCode,
  setFormattedNickname
};