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
    
    // Try multiple methods to find the user
    while (!userId && retries < maxRetries) {
      // METHOD 1: Direct username lookup via noblox.js
      try {
        console.log(`[DEBUG] Attempt ${retries + 1} to get ID for username: ${cleanUsername}`);
        userId = await noblox.getIdFromUsername(cleanUsername);
        console.log(`[INFO] Found userId for ${cleanUsername}: ${userId}`);
        break;
      } catch (idError) {
        console.error(`[ERROR] Attempt ${retries + 1} failed to get ID for username ${cleanUsername}:`, idError);
        
        // METHOD 2: Direct API call to Roblox API
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
        
        // METHOD 3: User search to handle case sensitivity and spaces
        try {
          console.log(`[DEBUG] Trying user search for username: ${cleanUsername}`);
          const searchResults = await noblox.searchUsers(cleanUsername);
          if (searchResults && searchResults.length > 0) {
            console.log(`[DEBUG] Found ${searchResults.length} users in search results`);
            
            // Find exact match in search results (case insensitive)
            const exactMatch = searchResults.find(
              user => user.username.toLowerCase() === cleanUsername.toLowerCase()
            );
            
            if (exactMatch) {
              userId = exactMatch.id;
              console.log(`[INFO] Found exact user through search: ${exactMatch.username} (${userId})`);
              break;
            } else {
              // Use the first result if there's no exact match but on last retry
              if (retries === maxRetries - 1 || searchResults.length === 1) {
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
        
        // METHOD 4: Try searching with modified username formats
        try {
          // Try with capital first letter, common naming convention
          const capitalizedUsername = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
          if (capitalizedUsername !== cleanUsername) {
            console.log(`[DEBUG] Trying capitalized username: ${capitalizedUsername}`);
            const capitalizedResults = await noblox.searchUsers(capitalizedUsername);
            
            if (capitalizedResults && capitalizedResults.length > 0) {
              // Use first result if it's a good match
              userId = capitalizedResults[0].id;
              console.log(`[INFO] Found user with capitalized name: ${capitalizedResults[0].username} (${userId})`);
              break;
            }
          }
        } catch (capitalizeError) {
          console.error(`[ERROR] Capitalized search failed:`, capitalizeError);
        }
        
        retries++;
        
        if (retries < maxRetries) {
          // Wait before retrying with increased delay
          const delay = 1000 * (retries + 1);
          console.log(`[INFO] Waiting ${delay}ms before retry ${retries + 1}...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    if (!userId) {
      console.log(`[INFO] No Roblox user found with username: ${cleanUsername} after ${maxRetries} attempts and multiple methods`);
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
    console.log(`[DEBUG] Getting blurb for user ${userId}...`);
    
    // First try the Roblox API v1 endpoint
    try {
      console.log(`[DEBUG] Trying Roblox API v1 endpoint for user description...`);
      const response = await fetch(`https://users.roblox.com/v1/users/${userId}/description`);
      
      if (!response.ok) {
        console.log(`[DEBUG] API request failed with status: ${response.status}`);
        throw new Error(`API request failed with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`[DEBUG] API response for blurb:`, data);
      
      if (data && data.description !== undefined) {
        const blurb = data.description;
        console.log(`[DEBUG] Successfully got blurb (${blurb.length} chars): "${blurb.substring(0, 50)}${blurb.length > 50 ? '...' : ''}"`);
        return blurb;
      } else {
        console.log(`[DEBUG] No description found in API response`);
      }
    } catch (v1Error) {
      console.error(`[ERROR] Failed to get blurb using v1 API:`, v1Error);
    }
    
    // If v1 API fails, try backup method using noblox.js
    try {
      console.log(`[DEBUG] Trying noblox.js getPlayerInfo for blurb...`);
      const playerInfo = await noblox.getPlayerInfo(userId);
      if (playerInfo && playerInfo.blurb !== undefined) {
        console.log(`[DEBUG] Successfully got blurb from noblox.js: "${playerInfo.blurb.substring(0, 50)}${playerInfo.blurb.length > 50 ? '...' : ''}"`);
        return playerInfo.blurb;
      } else {
        console.log(`[DEBUG] No blurb found in noblox.js response`);
      }
    } catch (nobloxError) {
      console.error(`[ERROR] Failed to get blurb using noblox.js:`, nobloxError);
    }
    
    console.log(`[DEBUG] No blurb found for user ${userId}, returning empty string`);
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
    
    // Log all user groups for debugging
    userGroups.forEach(group => {
      console.log(`[DEBUG] User Group: ${group.Name} (ID: ${group.Id})`);
    });
    
    // Normalize blacklisted group IDs to ensure consistent comparisons
    const normalizedBlacklistedGroups = blacklistedGroups.map(id => String(id).trim());
    console.log(`[DEBUG] Normalized blacklisted groups:`, normalizedBlacklistedGroups);
    
    // Filter to find which groups are blacklisted with improved comparison
    const blacklisted = userGroups.filter(group => {
      // Convert group ID to string and ensure no whitespace
      const groupIdStr = String(group.Id).trim();
      
      // Check if this group ID exists in our blacklisted groups array
      const matchIndex = normalizedBlacklistedGroups.findIndex(
        blacklistedId => blacklistedId === groupIdStr
      );
      
      const isBlacklisted = matchIndex >= 0;
      
      // Detailed logging for each group check
      console.log(`[DEBUG] Checking group ${group.Name} (${groupIdStr}): ${isBlacklisted ? 'BLACKLISTED' : 'not blacklisted'}`);
      
      if (isBlacklisted) {
        console.log(`[DEBUG] Found blacklisted group: ${group.Name} (${groupIdStr}) matches blacklisted ID: ${normalizedBlacklistedGroups[matchIndex]}`);
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

/**
 * Advanced username search with fallback methods
 * This function will attempt to find a Roblox user using multiple different search methods
 * @param {string} username - Roblox username to search for
 * @returns {Promise<Object|null>} User object or null if not found
 */
async function findRobloxUser(username) {
  console.log(`[INFO] Advanced search for Roblox user: ${username}`);
  try {
    // Clean the username
    const cleanUsername = username.trim();
    
    // Try multiple search methods in sequence
    
    // 1. Direct username lookup (most accurate but case sensitive)
    try {
      console.log(`[DEBUG] Trying direct username lookup: ${cleanUsername}`);
      const userId = await noblox.getIdFromUsername(cleanUsername);
      if (userId) {
        console.log(`[INFO] Found user via direct lookup: ${cleanUsername} (${userId})`);
        return { id: userId, username: cleanUsername, method: 'direct' };
      }
    } catch (err) {
      console.log(`[DEBUG] Direct lookup failed: ${err.message}`);
    }
    
    // 2. Use the users/get-by-username API
    try {
      console.log(`[DEBUG] Trying Roblox API lookup: ${cleanUsername}`);
      const response = await fetch(`https://api.roblox.com/users/get-by-username?username=${encodeURIComponent(cleanUsername)}`);
      const data = await response.json();
      
      if (data && data.Id) {
        console.log(`[INFO] Found user via API: ${data.Username} (${data.Id})`);
        return { id: data.Id, username: data.Username, method: 'api' };
      }
    } catch (err) {
      console.log(`[DEBUG] API lookup failed: ${err.message}`);
    }
    
    // 3. Search for users and find close matches
    try {
      console.log(`[DEBUG] Trying user search: ${cleanUsername}`);
      const searchResults = await noblox.searchUsers(cleanUsername);
      
      if (searchResults && searchResults.length > 0) {
        // Look for exact match (case insensitive)
        const exactMatch = searchResults.find(
          user => user.username.toLowerCase() === cleanUsername.toLowerCase()
        );
        
        if (exactMatch) {
          console.log(`[INFO] Found exact match via search: ${exactMatch.username} (${exactMatch.id})`);
          return { id: exactMatch.id, username: exactMatch.username, method: 'search-exact' };
        }
        
        // Use first result as closest match
        console.log(`[INFO] Using closest match from search: ${searchResults[0].username} (${searchResults[0].id})`);
        return { id: searchResults[0].id, username: searchResults[0].username, method: 'search-closest' };
      }
    } catch (err) {
      console.log(`[DEBUG] Search failed: ${err.message}`);
    }
    
    // 4. Try common username variations
    const variations = [
      cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1), // First letter capitalized
      cleanUsername.toLowerCase(), // All lowercase
      cleanUsername.toUpperCase(), // All uppercase
      cleanUsername.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') // Title Case
    ];
    
    for (const variation of variations) {
      if (variation === cleanUsername) continue; // Skip if same as original
      
      try {
        console.log(`[DEBUG] Trying username variation: ${variation}`);
        const varResults = await noblox.searchUsers(variation);
        
        if (varResults && varResults.length > 0) {
          // Use the first result from variation search
          console.log(`[INFO] Found user via variation: ${varResults[0].username} (${varResults[0].id})`);
          return { id: varResults[0].id, username: varResults[0].username, method: 'variation' };
        }
      } catch (err) {
        console.log(`[DEBUG] Variation search failed: ${err.message}`);
      }
    }
    
    // 5. Try the V1 users API as last resort
    try {
      console.log(`[DEBUG] Trying V1 users API for ${cleanUsername}`);
      const response = await fetch(`https://users.roblox.com/v1/users/search?keyword=${encodeURIComponent(cleanUsername)}&limit=10`);
      const data = await response.json();
      
      if (data && data.data && data.data.length > 0) {
        const user = data.data[0]; // Use the first result
        console.log(`[INFO] Found user via V1 API: ${user.name} (${user.id})`);
        return { id: user.id, username: user.name, method: 'v1-api' };
      }
    } catch (err) {
      console.log(`[DEBUG] V1 API search failed: ${err.message}`);
    }
    
    console.log(`[INFO] Could not find any Roblox user matching: ${cleanUsername}`);
    return null;
  } catch (error) {
    console.error(`[ERROR] Advanced search failed for ${username}:`, error);
    return null;
  }
}

module.exports = {
  initializeRoblox,
  getUserInfo,
  checkBlacklistedGroups,
  rankUser,
  getUserRank,
  getPlayerAvatar,
  findRobloxUser
};
