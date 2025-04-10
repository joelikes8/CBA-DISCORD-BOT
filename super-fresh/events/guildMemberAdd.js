const { Events } = require('discord.js');
const { getAntiRaidConfig, handleMemberJoin } = require('../commands/antiraid');

module.exports = {
  name: Events.GuildMemberAdd,
  async execute(member) {
    try {
      // Log the new member join
      console.log(`[INFO] New member joined: ${member.user.tag} (${member.id}) in guild ${member.guild.name}`);
      
      // Process through the anti-raid system
      await handleMemberJoin(member);
      
      // Here you could also add:
      // 1. Welcome messages
      // 2. Auto-role assignment
      // 3. DM new members with server information
      // 4. Log joins to a specific channel
      
    } catch (error) {
      console.error(`Error handling new member ${member.user.tag}:`, error);
    }
  },
};