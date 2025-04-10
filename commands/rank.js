const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserInfo, rankUser, findRobloxUser } = require('../utils/robloxAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rank')
    .setDescription('Rank a user in the Roblox group')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Roblox username of the user to rank')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('rank')
        .setDescription('The name of the rank to give')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply();
    
    const username = interaction.options.getString('username');
    const rankName = interaction.options.getString('rank');
    
    console.log(`[INFO] Rank command executed for username: ${username}, rank: ${rankName}`);
    
    try {
      // First try to find the Roblox user with our advanced search function
      const robloxUser = await findRobloxUser(username);
      
      if (!robloxUser) {
        // If advanced search fails, fall back to regular getUserInfo
        console.log(`[INFO] Advanced search failed for ${username}, falling back to getUserInfo`);
        const userInfo = await getUserInfo(username);
        
        if (!userInfo) {
          console.log(`[INFO] Could not find Roblox user with username: ${username}`);
          return interaction.editReply({ 
            content: '❌ Could not find a Roblox user with that username. Please check the spelling and try again.' 
          });
        }
        
        // Use the userInfo object if advanced search failed but getUserInfo succeeded
        console.log(`[INFO] Found user via getUserInfo: ${userInfo.username} (${userInfo.userId})`);
        
        // Attempt to rank the user
        const rankResult = await rankUser(userInfo.userId, rankName);
        
        if (!rankResult.success) {
          console.log(`[ERROR] Failed to rank user: ${rankResult.error}`);
          return interaction.editReply({ content: `❌ Failed to rank user: ${rankResult.error}` });
        }
        
        // Create a success embed
        const embed = new EmbedBuilder()
          .setTitle('User Ranked Successfully')
          .setColor('#43b581')
          .setDescription(`Successfully ranked ${userInfo.username} to ${rankResult.rankName}`)
          .addFields(
            { name: 'Username', value: userInfo.username, inline: true },
            { name: 'User ID', value: userInfo.userId.toString(), inline: true },
            { name: 'New Rank', value: rankResult.rankName, inline: true },
            { name: 'Ranked by', value: interaction.user.tag, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Roblox Group Rank Management' });
        
        return interaction.editReply({ embeds: [embed] });
        
      } else {
        // We found a user with our advanced search
        console.log(`[INFO] Found user via findRobloxUser: ${robloxUser.username} (${robloxUser.id})`);
        
        // Get full user info to get avatar and other details
        const userInfo = await getUserInfo(robloxUser.username);
        
        // Use the found user ID for ranking
        const userId = robloxUser.id;
        
        // Attempt to rank the user
        const rankResult = await rankUser(userId, rankName);
        
        if (!rankResult.success) {
          console.log(`[ERROR] Failed to rank user: ${rankResult.error}`);
          return interaction.editReply({ content: `❌ Failed to rank user: ${rankResult.error}` });
        }
        
        // Create a success embed
        const embed = new EmbedBuilder()
          .setTitle('User Ranked Successfully')
          .setColor('#43b581')
          .setDescription(`Successfully ranked ${robloxUser.username} to ${rankResult.rankName}`)
          .addFields(
            { name: 'Username', value: robloxUser.username, inline: true },
            { name: 'User ID', value: userId.toString(), inline: true },
            { name: 'New Rank', value: rankResult.rankName, inline: true },
            { name: 'Ranked by', value: interaction.user.tag, inline: false }
          )
          .setTimestamp()
          .setFooter({ text: 'Roblox Group Rank Management' });
        
        // Add avatar if available
        if (userInfo && userInfo.avatarUrl) {
          embed.setThumbnail(userInfo.avatarUrl);
        }
        
        return interaction.editReply({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`[ERROR] Error in rank command:`, error);
      return interaction.editReply({ 
        content: `❌ An error occurred while processing this command: ${error.message}` 
      });
    }
  },
};
