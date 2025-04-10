const noblox = require('noblox.js');
const { getBlacklistedGroups } = require('./database');

let loggedIn = false;

/**
 * Initialize Roblox API with cookie authentication
 */
async function initializeRoblox() {
  // Check if we're already logged in
  if (loggedIn) {
    try {
      // Verify our current session is still valid
      const currentUser = await noblox.getCurrentUser();
      if (currentUser && currentUser.UserName) {
        console.log(`[INFO] Already logged into Roblox as ${currentUser.UserName} (${currentUser.UserID})`);
        return true;
      }
    } catch (error) {
      console.log('[INFO] Current session invalid, re-authenticating...');
      loggedIn = false;
    }
  }

  const cookie = process.env.ROBLOX_COOKIE;
  const groupId = process.env.ROBLOX_GROUP_ID;
  
  // Validate environment variables
  if (!cookie) {
    console.error('[ERROR] Roblox cookie not found! Please set the ROBLOX_COOKIE environment variable.');
    return false;
  }
  
  if (!groupId) {
    console.error('[ERROR] Roblox group ID not found! Please set the ROBLOX_GROUP_ID environment variable.');
    return false;
  }

  const maxRetries = 3;
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      console.log(`[INFO] Authenticating with Roblox (attempt ${retries + 1})...`);
      
      // Skip clearSession due to jar errors on Render
      console.log('[INFO] Skipping clearSession due to Render compatibility');
      
      // Set the new cookie
      await noblox.setCookie(cookie);
      
      // Verify we're logged in
      const currentUser = await noblox.getCurrentUser();
      if (currentUser && currentUser.UserName) {
        console.log(`[INFO] Logged into Roblox as ${currentUser.UserName} (${currentUser.UserID})`);
        loggedIn = true;
        return true;
      } else {
        throw new Error("Failed to get current user after setting cookie");
      }
    } catch (error) {
      console.error(`[ERROR] Attempt ${retries + 1} failed to authenticate with Roblox:`, error);
      
      retries++;
      
      if (retries < maxRetries) {
        console.log(`[INFO] Waiting before retry ${retries + 1}...`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  
  // If we get here, all retries have failed
  console.error(`[ERROR] Failed to authenticate with Roblox after ${maxRetries} attempts`);
  
  // Try basic API calls to check if Roblox API is working at all
  try {
    console.log('[INFO] Testing basic Roblox API connectivity...');
    const testUserId = 1; // ROBLOX user
    const testUser = await fetch(`https://users.roblox.com/v1/users/${testUserId}`);
    const testUserData = await testUser.json();
    
    if (testUserData && testUserData.name) {
      console.log(`[INFO] Basic Roblox API is working: ${testUserData.name}`);
      console.error('[ERROR] This suggests the problem is with the ROBLOX_COOKIE, not the API connection');
    } else {
      console.error('[ERROR] Basic Roblox API test failed, API might be down or unreachable');
    }
  } catch (testError) {
    console.error('[ERROR] Complete Roblox API connectivity failure:', testError);
  }
  
  return false;
}

/**
 * Get user info by username
 * @param {string} username - Roblox username
 * @returns {Promise<Object>} - User info object
 */
async function getUserInfo(username) {
  try {
    console.log(`[INFO] Looking up Roblox user: ${username}`);
    
    // Make sure we're logged in first
    if (!loggedIn) {
      console.log('[INFO] Not logged in to Roblox, attempting to authenticate first...');
      await initializeRoblox();
    }
    
    // Trim the username and handle special characters
    const cleanUsername = username.trim();
    console.log(`[DEBUG] Cleaned username: "${cleanUsername}"`);
    
    // First get the user ID from the username with error handling and retries
    let userId = null;
    let retries = 0;
    const maxRetries = 3;
    
    while (!userId && retries < maxRetries) {
      try {
        console.log(`[DEBUG] Attempt ${retries + 1} to get ID for username: ${cleanUsername}`);
        userId = await noblox.getIdFromUsername(cleanUsername);
        console.log(`[INFO] Found userId for ${cleanUsername}: ${userId}`);
        break;
      } catch (idError) {
        console.error(`[ERROR] Attempt ${retries + 1} failed to get ID for username ${cleanUsername}:`, idError);
        
        // Try direct fetch from Roblox API as backup
        try {
          console.log(`[DEBUG] Trying direct API fetch for username: ${cleanUsername}`);
          // Make direct API call to Roblox API (bypassing noblox.js if it's having issues)
          const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`);
          const data = await response.json();
          
          if (data && data.Id) {
            userId = data.Id;
            console.log(`[INFO] Found userId through direct API: ${userId}`);
            break;
          } else if (data && data.errorMessage) {
            console.error(`[ERROR] Roblox API error: ${data.errorMessage}`);
          }
        } catch (directApiError) {
          console.error(`[ERROR] Direct API request failed:`, directApiError);
        }
        
        // Try to search users to handle case sensitivity and spaces
        try {
          console.log(`[DEBUG] Trying user search for username: ${cleanUsername}`);
          const searchResults = await noblox.searchUsers(cleanUsername);
          if (searchResults && searchResults.length > 0) {
            // Find exact match in search results
            const exactMatch = searchResults.find(
              user => user.username.toLowerCase() === cleanUsername.toLowerCase()
            );
            
            if (exactMatch) {
              userId = exactMatch.id;
              console.log(`[INFO] Found user through search: ${exactMatch.username} (${userId})`);
              break;
            } else {
              console.log(`[DEBUG] Found ${searchResults.length} users but no exact match for ${cleanUsername}`);
              // If no exact match but we have results, use the first one as a close match
              if (retries === maxRetries - 1) {
                userId = searchResults[0].id;
                console.log(`[INFO] Using closest match from search: ${searchResults[0].username} (${userId})`);
                break;
              }
            }
          } else {
            console.log(`[DEBUG] No search results found for ${cleanUsername}`);
          }
        } catch (searchError) {
          console.error(`[ERROR] Search failed for username ${cleanUsername}:`, searchError);
        }
        
        retries++;
        
        if (retries < maxRetries) {
          // Wait before retrying
          console.log(`[INFO] Waiting before retry ${retries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!userId) {
      console.log(`[INFO] No Roblox user found with username: ${cleanUsername} after ${maxRetries} attempts`);
      return null;
    }
    
    // Get user information with retries
    let userInfo = null;
    retries = 0;
    
    while (!userInfo && retries < maxRetries) {
      try {
        console.log(`[DEBUG] Attempt ${retries + 1} to get player info for userId: ${userId}`);
        userInfo = await noblox.getPlayerInfo(userId);
        console.log(`[INFO] Got player info for ${userId}: ${userInfo ? userInfo.username : 'null'}`);
        break;
      } catch (infoError) {
        console.error(`[ERROR] Attempt ${retries + 1} failed to get player info for userId ${userId}:`, infoError);
        
        // Try direct API call as backup
        try {
          console.log(`[DEBUG] Trying direct API fetch for user info: ${userId}`);
          const response = await fetch(`https://users.roblox.com/v1/users/${userId}`);
          const data = await response.json();
          
          if (data && data.name) {
            userInfo = {
              username: data.name,
              displayName: data.displayName,
              blurb: await getUserBlurb(userId),
              joinDate: new Date(data.created),
              age: 0, // Age in days not available in this API
              isBanned: data.isBanned || false
            };
            console.log(`[INFO] Got user info through direct API: ${userInfo.username}`);
            break;
          }
        } catch (directApiError) {
          console.error(`[ERROR] Direct API request for user info failed:`, directApiError);
        }
        
        retries++;
        
        if (retries < maxRetries) {
          console.log(`[INFO] Waiting before retry ${retries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    if (!userInfo) {
      console.error(`[ERROR] Failed to get player info for userId ${userId} after ${maxRetries} attempts`);
      return null;
    }
    
    // Get avatar URL
    const avatarUrl = await getPlayerAvatar(userId);
    
    // Return user info with correct username (from Roblox, not input)
    const correctUsername = userInfo.username || cleanUsername;
    
    return {
      userId: userId,
      username: correctUsername,
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
 * Get user's blurb (about) through direct API if needed
 * @param {number} userId - Roblox user ID
 * @returns {Promise<string>} - User's blurb
 */
async function getUserBlurb(userId) {
  try {
    // Try to get blurb through direct API
    const response = await fetch(`https://users.roblox.com/v1/users/${userId}/description`);
    const data = await response.json();
    
    if (data && data.description !== undefined) {
      return data.description;
    }
    return '';
  } catch (error) {
    console.error(`[ERROR] Failed to get blurb for user ${userId}:`, error);
    return '';
  }
}

/**
 * Get player's avatar URL
 * @param {number} userId - Roblox user ID
 * @returns {Promise<string>} - Avatar URL
 */
async function getPlayerAvatar(userId) {
  const maxRetries = 2;
  let retries = 0;
  
  while (retries <= maxRetries) {
    try {
      console.log(`[DEBUG] Attempt ${retries + 1} to get avatar for userId: ${userId}`);
      
      // Get the headshot thumbnail through noblox.js
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
      
      throw new Error("No avatar data returned");
    } catch (error) {
      console.error(`[ERROR] Attempt ${retries + 1} failed to get avatar for user ${userId}:`, error);
      
      // Try direct API as backup
      try {
        console.log(`[DEBUG] Trying direct API for avatar: ${userId}`);
        // Direct avatar API
        const avatarUrl = `https://www.roblox.com/headshot-thumbnail/image?userId=${userId}&width=420&height=420&format=png`;
        
        // Validate the URL by making a HEAD request
        const response = await fetch(avatarUrl, { method: 'HEAD' });
        if (response.ok) {
          console.log(`[INFO] Found avatar through direct URL: ${avatarUrl}`);
          return avatarUrl;
        }
      } catch (directError) {
        console.error(`[ERROR] Direct avatar URL failed:`, directError);
      }
      
      retries++;
      
      if (retries <= maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }
  
  // Fall back to default avatar if all attempts fail
  console.log(`[INFO] Using default avatar for user ${userId}`);
  return "https://tr.rbxcdn.com/53eb9b17fe1432a809c73a13889b5006/420/420/Image/Png"; // Default Roblox avatar
}

/**
 * Check if user is in any blacklisted groups
 * @param {number} userId - Roblox user ID
 * @returns {Promise<Object>} - Results of blacklist check
 */
async function checkBlacklistedGroups(userId) {
  try {
    // Make sure userId is a number
    userId = Number(userId);
    
    // Get blacklisted groups from database
    const blacklistedGroups = await require('./database').getBlacklistedGroups();
    console.log(`[DEBUG] Checking user ${userId} against ${blacklistedGroups.length} blacklisted groups:`, blacklistedGroups);
    
    if (!blacklistedGroups || blacklistedGroups.length === 0) {
      return { inBlacklistedGroup: false, groups: [] };
    }
    
    // Get user's groups
    const userGroups = await noblox.getGroups(userId);
    console.log(`[DEBUG] User ${userId} is in ${userGroups.length} groups`);
    
    // Filter to find which groups are blacklisted
    const blacklisted = userGroups.filter(group => {
      const groupIdStr = String(group.Id);
      const isBlacklisted = blacklistedGroups.includes(groupIdStr);
      if (isBlacklisted) {
        console.log(`[DEBUG] Found blacklisted group: ${group.Name} (${groupIdStr})`);
      }
      return isBlacklisted;
    });
    
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
