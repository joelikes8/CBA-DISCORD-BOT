const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserInfo, checkBlacklistedGroups, findRobloxUser, getPlayerAvatar } = require('../utils/robloxAPI');
const { getBlacklistedGroups } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('background')
    .setDescription('Check if a player is in any blacklisted groups')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox username to check')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();
    
    try {
      const username = interaction.options.getString('username');
      console.log(`[INFO] Background check requested for username: ${username}`);
      
      // Check if any blacklisted groups exist
      const blacklistedGroupsCount = await getBlacklistedGroups().then(groups => groups.length);
      console.log(`[INFO] Number of blacklisted groups in database: ${blacklistedGroupsCount}`);
      
      // Try to find the Roblox user using the more robust findRobloxUser function first
      const robloxUser = await findRobloxUser(username);
      if (!robloxUser) {
        return interaction.editReply('❌ Could not find a Roblox user with that username. Please check the spelling and try again.');
      }
      
      console.log(`[INFO] Found Roblox user via ${robloxUser.method}: ${robloxUser.username} (ID: ${robloxUser.id})`);
      
      // Get detailed user info using the username we found
      let userInfo = await getUserInfo(robloxUser.username);
      
      // If getUserInfo fails, create a minimal userInfo object from the robloxUser data
      if (!userInfo) {
        const avatarUrl = await getPlayerAvatar(robloxUser.id);
        userInfo = {
          userId: robloxUser.id,
          username: robloxUser.username,
          age: 0,
          avatarUrl: avatarUrl
        };
        console.log(`[INFO] Using basic user info for: ${userInfo.username} (ID: ${userInfo.userId})`);
      } else {
        console.log(`[INFO] Using detailed user info for: ${userInfo.username} (ID: ${userInfo.userId})`);
      }
      
      // Check if the user is in any blacklisted groups
      const blacklistCheck = await checkBlacklistedGroups(userInfo.userId || robloxUser.id);
      
      if (blacklistCheck.error) {
        console.error(`[ERROR] Blacklist check failed:`, blacklistCheck);
        return interaction.editReply(`❌ An error occurred while checking blacklisted groups: ${blacklistCheck.error}`);
      }
      
      console.log(`[INFO] Blacklist check completed. Result: ${blacklistCheck.inBlacklistedGroup ? 'In blacklisted groups' : 'Not in blacklisted groups'}`);
      
      // Create the response embed
      const embed = new EmbedBuilder()
        .setTitle(`Background Check: ${userInfo.username}`)
        .setColor(blacklistCheck.inBlacklistedGroup ? '#ff0000' : '#43b581')
        .addFields(
          { name: 'Username', value: userInfo.username, inline: true },
          { name: 'User ID', value: userInfo.userId.toString(), inline: true },
          { name: 'Account Age', value: `${userInfo.age} days`, inline: true },
          { name: 'Blacklisted Groups', value: blacklistCheck.inBlacklistedGroup ? 
            blacklistCheck.groups.map(group => `${group.Name} (ID: ${group.Id})`).join('\n') : 
            'None', inline: false }
        )
        .setFooter({ text: blacklistCheck.inBlacklistedGroup ? 
          '⚠️ This user is in one or more blacklisted groups' : 
          '✅ This user is not in any blacklisted groups' });
      
      // Add avatar if available
      if (userInfo.avatarUrl) {
        embed.setThumbnail(userInfo.avatarUrl);
      }
      
      return interaction.editReply({ embeds: [embed] });
    } catch (error) {
      console.error(`[ERROR] Background check error:`, error);
      return interaction.editReply(`❌ An error occurred while checking the user: ${error.message}`);
    }
  },
};
