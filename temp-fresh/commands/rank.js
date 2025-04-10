const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getUserInfo, rankUser } = require('../utils/robloxAPI');

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
    
    // Check if the username exists
    const userInfo = await getUserInfo(username);
    if (!userInfo) {
      return interaction.editReply({ content: '❌ Could not find a Roblox user with that username. Please check the spelling and try again.' });
    }
    
    // Attempt to rank the user
    const rankResult = await rankUser(userInfo.userId, rankName);
    
    if (!rankResult.success) {
      return interaction.editReply({ content: `❌ Failed to rank user: ${rankResult.error}` });
    }
    
    // Create a success embed
    const embed = new EmbedBuilder()
      .setTitle('User Ranked Successfully')
      .setColor('#43b581')
      .setDescription(`Successfully ranked ${username} to ${rankResult.rankName}`)
      .addFields(
        { name: 'Username', value: username, inline: true },
        { name: 'User ID', value: userInfo.userId.toString(), inline: true },
        { name: 'New Rank', value: rankResult.rankName, inline: true },
        { name: 'Ranked by', value: interaction.user.tag, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: 'Roblox Group Rank Management' });
    
    return interaction.editReply({ embeds: [embed] });
  },
};
