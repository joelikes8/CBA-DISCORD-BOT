// Import the PostgreSQL database functions
const postgresDB = require('./postgresDB');

// Export the PostgreSQL database functions
module.exports = {
  initializeDatabase: postgresDB.initializeDatabase,
  getVerificationCode: postgresDB.getVerificationCode,
  setVerificationCode: postgresDB.setVerificationCode,
  removeVerificationCode: postgresDB.removeVerificationCode,
  getVerifiedUser: postgresDB.getVerifiedUser,
  setVerifiedUser: postgresDB.setVerifiedUser,
  isGroupBlacklisted: postgresDB.isGroupBlacklisted,
  addBlacklistedGroup: postgresDB.addBlacklistedGroup,
  removeBlacklistedGroup: postgresDB.removeBlacklistedGroup,
  getBlacklistedGroups: postgresDB.getBlacklistedGroups,
  setTryoutChannel: postgresDB.setTryoutChannel,
  getTryoutChannel: postgresDB.getTryoutChannel,
  setPendingVerification: postgresDB.setPendingVerification,
  getPendingVerification: postgresDB.getPendingVerification,
  removePendingVerification: postgresDB.removePendingVerification,
  addTryoutLog: postgresDB.addTryoutLog,
  getTryoutLogs: postgresDB.getTryoutLogs,
  getWarnings: postgresDB.getWarnings,
  addWarning: postgresDB.addWarning,
  removeWarning: postgresDB.removeWarning
};
