/**
 * Test Pending Verification Database Tool
 * 
 * This script tests the pending verification database functions 
 * and diagnoses any issues with verification button handling.
 */

require('dotenv').config();
const { setPendingVerification, getPendingVerification, removePendingVerification } = require('./utils/database');

async function main() {
  console.log('===== VERIFICATION DATABASE TEST =====');
  console.log('Testing database functions for pending verifications');
  console.log('========================================\n');
  
  // Test user ID
  const testUserId = 'test_user_' + Date.now();
  console.log(`Using test user ID: ${testUserId}`);
  
  // Test data
  const testData = {
    robloxUsername: 'TestRobloxUser',
    robloxUserId: '12345678',
    code: 'ABC123',
    messageId: 'message_' + Date.now(),
    timestamp: Date.now()
  };
  
  try {
    // Step 1: Set pending verification
    console.log('\n1. Setting pending verification...');
    const setResult = await setPendingVerification(testUserId, testData);
    console.log(`Set result: ${setResult ? 'Success' : 'Failed'}`);
    
    // Step 2: Get pending verification
    console.log('\n2. Getting pending verification...');
    const pendingVerification = await getPendingVerification(testUserId);
    
    if (pendingVerification) {
      console.log('Retrieved pending verification:');
      console.log(JSON.stringify(pendingVerification, null, 2));
      
      // Check if all fields are present
      const requiredFields = ['roblox_username', 'roblox_user_id', 'code', 'message_id', 'timestamp'];
      const missingFields = requiredFields.filter(field => pendingVerification[field] === undefined);
      
      if (missingFields.length > 0) {
        console.log(`\n❌ PROBLEM DETECTED: Missing required fields in database: ${missingFields.join(', ')}`);
        console.log('This explains the "Verification data is incomplete" error when clicking the verify button.');
        console.log('The database schema and data format don\'t match.');
      } else {
        console.log('\n✅ All required fields present in database');
      }
      
      // Check data integrity
      if (pendingVerification.roblox_username !== testData.robloxUsername) {
        console.log(`\n❌ PROBLEM DETECTED: Username mismatch: ${pendingVerification.roblox_username} vs ${testData.robloxUsername}`);
      }
      
      if (pendingVerification.roblox_user_id !== testData.robloxUserId) {
        console.log(`\n❌ PROBLEM DETECTED: User ID mismatch: ${pendingVerification.roblox_user_id} vs ${testData.robloxUserId}`);
      }
      
      if (pendingVerification.code !== testData.code) {
        console.log(`\n❌ PROBLEM DETECTED: Code mismatch: ${pendingVerification.code} vs ${testData.code}`);
      }
    } else {
      console.log('❌ PROBLEM DETECTED: Failed to retrieve pending verification');
      console.log('This would cause the "Verification data is incomplete" error');
    }
    
    // Step 3: Remove pending verification
    console.log('\n3. Removing pending verification...');
    const removeResult = await removePendingVerification(testUserId);
    console.log(`Remove result: ${removeResult ? 'Success' : 'Failed'}`);
    
    // Step 4: Verify removal
    console.log('\n4. Verifying removal...');
    const verifyRemoval = await getPendingVerification(testUserId);
    if (verifyRemoval) {
      console.log('❌ PROBLEM DETECTED: Pending verification not removed');
    } else {
      console.log('✅ Pending verification successfully removed');
    }
    
    // Done
    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('\n❌ Error during tests:', error);
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});