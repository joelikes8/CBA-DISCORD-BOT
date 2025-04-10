/**
 * Roblox Cookie Diagnostics Tool
 * 
 * This script tests whether your Roblox cookie is valid and working correctly.
 * It attempts to authenticate with Roblox and perform basic operations
 * to verify functionality.
 */

require('dotenv').config();
const noblox = require('noblox.js');
// Use global fetch instead of node-fetch in Node.js 20+
const fetch = globalThis.fetch;

async function main() {
  console.log('===== ROBLOX COOKIE VALIDATION TOOL =====');
  console.log('This tool will test your Roblox cookie and API functionality');
  console.log('===========================================\n');
  
  // Check if cookie is set
  const cookie = process.env.ROBLOX_COOKIE;
  if (!cookie) {
    console.error('❌ ERROR: ROBLOX_COOKIE environment variable is not set.');
    console.log('Please set your Roblox cookie in the environment variables.');
    process.exit(1);
  }
  
  // Check cookie format
  console.log('🔍 Checking cookie format...');
  if (!cookie.includes('.ROBLOSECURITY=')) {
    console.log('⚠️ WARNING: Your cookie does not include .ROBLOSECURITY= prefix.');
    console.log('It should be in format: .ROBLOSECURITY=_|WARNING:-DO-NOT-SHARE-THIS....');
  } else {
    console.log('✅ Cookie format appears correct.');
  }
  
  // Attempt to authenticate
  console.log('\n🔑 Attempting to authenticate with Roblox...');
  try {
    await noblox.setCookie(cookie);
    const currentUser = await noblox.getCurrentUser();
    console.log(`✅ Successfully authenticated as ${currentUser.UserName} (ID: ${currentUser.UserID})`);
    
    // Test basic API functionality
    console.log('\n🔍 Testing basic Roblox API functionality...');
    
    // Test user info lookup
    console.log('\nTesting user info lookup...');
    const userInfo = await noblox.getPlayerInfo(currentUser.UserID);
    if (userInfo) {
      console.log(`✅ User info lookup successful: ${userInfo.username} (Display: ${userInfo.displayName})`);
    } else {
      console.log('❌ Failed to get user info');
    }
    
    // Test avatar lookup
    console.log('\nTesting avatar lookup...');
    const avatar = await noblox.getPlayerThumbnail(
      currentUser.UserID,
      "420x420",
      "png",
      false,
      "headshot"
    );
    if (avatar && avatar.length > 0) {
      console.log(`✅ Avatar lookup successful: ${avatar[0].imageUrl.substring(0, 50)}...`);
    } else {
      console.log('❌ Failed to get avatar');
    }
    
    // Check for group ID
    const groupId = process.env.ROBLOX_GROUP_ID;
    if (groupId) {
      console.log(`\nTesting group membership for group ${groupId}...`);
      try {
        // Test group rank lookup
        const rank = await noblox.getRankInGroup(groupId, currentUser.UserID);
        if (rank === 0) {
          console.log(`❌ The authenticated user is not a member of group ${groupId}`);
        } else {
          const rankName = await noblox.getRankNameInGroup(groupId, currentUser.UserID);
          console.log(`✅ Group membership verified: Rank ${rank} (${rankName})`);
        }
        
        // Test group roles lookup
        const roles = await noblox.getRoles(groupId);
        if (roles && roles.length > 0) {
          console.log(`✅ Successfully retrieved ${roles.length} group roles`);
          console.log('Group roles:');
          roles.forEach(role => {
            console.log(`   - ${role.name} (Rank: ${role.rank})`);
          });
        } else {
          console.log('❌ Failed to get group roles');
        }
      } catch (groupError) {
        console.error(`❌ Error checking group membership: ${groupError.message}`);
      }
    } else {
      console.log('\n⚠️ ROBLOX_GROUP_ID not set, skipping group membership tests');
    }
    
    console.log('\n✅ All tests completed!');
    console.log('Your Roblox cookie appears to be working correctly.');
    
  } catch (error) {
    console.error(`\n❌ Authentication failed: ${error.message}`);
    console.log('\nPossible issues:');
    console.log('1. Your cookie may be expired or invalid');
    console.log('2. You may have been rate limited by Roblox');
    console.log('3. The Roblox API may be experiencing issues');
    console.log('\nTips for fixing:');
    console.log('- Get a fresh cookie from Roblox website (Developer Tools > Application > Cookies)');
    console.log('- Make sure you\'re copying the full cookie value');
    console.log('- Try again later if Roblox API might be having issues');
    
    // Try direct API to confirm general connectivity
    try {
      console.log('\nTesting basic Roblox API connectivity (without cookie)...');
      const response = await fetch('https://users.roblox.com/v1/users/1');
      const data = await response.json();
      if (data && data.name) {
        console.log(`✅ Basic API connection works: Retrieved ROBLOX user (${data.name})`);
        console.log('   This confirms the issue is with your cookie, not general connectivity.');
      } else {
        console.log('❌ Basic API connection failed');
      }
    } catch (apiError) {
      console.error(`❌ Cannot connect to Roblox API at all: ${apiError.message}`);
      console.log('   This suggests network or firewall issues.');
    }
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});