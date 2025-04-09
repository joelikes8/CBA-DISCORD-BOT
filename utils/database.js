// In-memory database for configuration and storage
const database = {
  verificationCodes: new Map(), // Maps Discord user IDs to verification codes
  verifiedUsers: new Map(), // Maps Discord user IDs to Roblox user IDs
  blacklistedGroups: new Set(), // Set of blacklisted group IDs
  tryoutChannel: new Map(), // Maps guild ID to tryout announcement channel ID
  pendingVerifications: new Map(), // Maps Discord user IDs to pending verification objects
};

function initializeDatabase() {
  console.log('[INFO] In-memory database initialized');
  return database;
}

function getVerificationCode(userId) {
  return database.verificationCodes.get(userId);
}

function setVerificationCode(userId, code, robloxUsername) {
  database.verificationCodes.set(userId, { code, robloxUsername });
}

function removeVerificationCode(userId) {
  database.verificationCodes.delete(userId);
}

function getVerifiedUser(userId) {
  return database.verifiedUsers.get(userId);
}

function setVerifiedUser(userId, robloxInfo) {
  database.verifiedUsers.set(userId, robloxInfo);
}

function isGroupBlacklisted(groupId) {
  return database.blacklistedGroups.has(String(groupId));
}

function addBlacklistedGroup(groupId) {
  database.blacklistedGroups.add(String(groupId));
  return database.blacklistedGroups.size;
}

function removeBlacklistedGroup(groupId) {
  return database.blacklistedGroups.delete(String(groupId));
}

function getBlacklistedGroups() {
  return Array.from(database.blacklistedGroups);
}

function setTryoutChannel(guildId, channelId) {
  database.tryoutChannel.set(guildId, channelId);
}

function getTryoutChannel(guildId) {
  return database.tryoutChannel.get(guildId);
}

function setPendingVerification(userId, data) {
  database.pendingVerifications.set(userId, data);
}

function getPendingVerification(userId) {
  return database.pendingVerifications.get(userId);
}

function removePendingVerification(userId) {
  database.pendingVerifications.delete(userId);
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
};
