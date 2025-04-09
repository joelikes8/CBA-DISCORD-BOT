const { Events, ActivityType } = require('discord.js');
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
    client.user.setActivity('/help', { type: ActivityType.Watching });
    
    // Set up an activity rotation
    setInterval(() => {
      // Rotate between different activities
      const activities = [
        { name: '/verify', type: ActivityType.Watching },
        { name: '/help', type: ActivityType.Watching },
        { name: 'British Army Group', type: ActivityType.Playing },
        { name: 'Moderation', type: ActivityType.Competing }
      ];
      
      const activity = activities[Math.floor(Math.random() * activities.length)];
      client.user.setActivity(activity.name, { type: activity.type });
    }, 300000); // Change every 5 minutes
    
    console.log(`[INFO] Bot is ready to serve on ${client.guilds.cache.size} servers`);
  },
};
