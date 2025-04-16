const { addBlacklistedGroup, getBlacklistedGroups } = require('./utils/database');

async function testBlacklist() {
  console.log('Adding test group ID 12345678');
  await addBlacklistedGroup('12345678');
  
  console.log('Current blacklisted groups:');
  const groups = await getBlacklistedGroups();
  console.log(groups);
}

testBlacklist().catch(console.error);
