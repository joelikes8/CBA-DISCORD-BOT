const { checkBlacklistedGroups } = require('./utils/robloxAPI');

async function testUserGroups() {
  // First add a group to the blacklist
  require('./utils/database').addBlacklistedGroup('12345678');
  
  // Mock user ID with groups
  const mockUserId = 123456789;
  
  // Test the blacklisted groups check
  console.log('Testing blacklisted groups check for user:', mockUserId);
  const result = await checkBlacklistedGroups(mockUserId);
  console.log('Check result:', result);
}

testUserGroups().catch(console.error);
