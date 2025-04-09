const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUserInfo, checkBlacklistedGroups } = require('../utils/robloxAPI');

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
    
    const username = interaction.options.getString('username');
    
    // Get user info
    const userInfo = await getUserInfo(username);
    if (!userInfo) {
      return interaction.editReply('❌ Could not find a Roblox user with that username. Please check the spelling and try again.');
    }
    
    // Check if the user is in any blacklisted groups
    const blacklistCheck = await checkBlacklistedGroups(userInfo.userId);
    
    if (blacklistCheck.error) {
      return interaction.editReply(`❌ An error occurred while checking blacklisted groups: ${blacklistCheck.error}`);
    }
    
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
    
    return interaction.editReply({ embeds: [embed] });
  },
};
