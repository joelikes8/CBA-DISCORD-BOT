const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getVerifiedUser } = require('../utils/database');
const { getUserInfo, getUserRank } = require('../utils/robloxAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update your Discord nickname and roles to match your Roblox rank'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    // Check if the user is verified
    const verifiedData = getVerifiedUser(interaction.user.id);
    if (!verifiedData) {
      return interaction.editReply({ content: '❌ You are not verified yet! Please use the `/verify` command first.', ephemeral: true });
    }
    
    // Get the user's Roblox information
    const userInfo = await getUserInfo(verifiedData.robloxUsername);
    if (!userInfo) {
      return interaction.editReply({ content: '❌ Failed to fetch your Roblox information. Please try again later.', ephemeral: true });
    }
    
    // Get the user's rank in the group
    const rankInfo = await getUserRank(verifiedData.robloxUserId);
    if (rankInfo.error) {
      return interaction.editReply({ content: `❌ An error occurred: ${rankInfo.error}`, ephemeral: true });
    }
    
    if (!rankInfo.inGroup) {
      return interaction.editReply({ content: '❌ You are not in the Roblox group. Please join the group first.', ephemeral: true });
    }
    
    try {
      // Update the user's nickname
      const newNickname = `${userInfo.displayName || userInfo.username} [${rankInfo.rankName}]`;
      await interaction.member.setNickname(newNickname);
      
      // You would also update roles here based on their Roblox rank
      // This depends on the specific roles set up in your Discord server
      // TODO: Add role update logic based on rankInfo.rankName
      
      const embed = new EmbedBuilder()
        .setTitle('Rank Update Successful')
        .setColor('#43b581')
        .setDescription(`Your Discord profile has been updated to match your Roblox rank.`)
        .addFields(
          { name: 'Roblox Username', value: userInfo.username, inline: true },
          { name: 'Group Rank', value: rankInfo.rankName, inline: true },
          { name: 'Updated Nickname', value: newNickname, inline: true }
        )
        .setFooter({ text: 'Use this command again if your rank changes in the future' });
      
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(`[ERROR] Failed to update user ${interaction.user.tag}:`, error);
      return interaction.editReply({ 
        content: `❌ Failed to update your nickname: ${error.message}. I may not have permission to change your nickname.`, 
        ephemeral: true 
      });
    }
  },
};
