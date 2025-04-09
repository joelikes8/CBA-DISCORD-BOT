const { Events } = require('discord.js');
const { initializeRoblox } = require('../utils/robloxAPI');

module.exports = {
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    console.log(`[INFO] Ready! Logged in as ${client.user.tag}`);
    
    // Initialize Roblox connection
    const robloxInitialized = await initializeRoblox();
    if (robloxInitialized) {
      console.log('[INFO] Successfully authenticated with Roblox');
    } else {
      console.warn('[WARNING] Failed to authenticate with Roblox. Functions that require Roblox authentication will not work.');
    }
    
    // Set the bot's activity
    client.user.setActivity('/verify', { type: 'WATCHING' });
    
    console.log(`[INFO] Bot is ready to serve on ${client.guilds.cache.size} servers`);
  },
};
