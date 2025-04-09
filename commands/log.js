const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVerifiedUser } = require('../utils/database');
const { getUserInfo } = require('../utils/robloxAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Submit a tryout log')
    .addStringOption(option =>
      option.setName('recruit')
        .setDescription('Roblox username of the recruit')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('tryout_type')
        .setDescription('Type of tryout conducted')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('result')
        .setDescription('Result of the tryout')
        .setRequired(true)
        .addChoices(
          { name: 'Passed', value: 'Passed' },
          { name: 'Failed', value: 'Failed' }
        ))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes about the tryout')
        .setRequired(true))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    // Get the input values
    const recruitUsername = interaction.options.getString('recruit');
    const tryoutType = interaction.options.getString('tryout_type');
    const result = interaction.options.getString('result');
    const notes = interaction.options.getString('notes');
    
    // Verify the recruit exists on Roblox
    const recruitInfo = await getUserInfo(recruitUsername);
    if (!recruitInfo) {
      return interaction.editReply({ content: '❌ Could not find a Roblox user with that username. Please check the spelling and try again.' });
    }
    
    // Get the current time in a readable format
    const now = new Date();
    const timestamp = `<t:${Math.floor(now.getTime() / 1000)}:F>`;
    
    // Create an embed for the tryout log
    const logEmbed = new EmbedBuilder()
      .setTitle('📋 Tryout Log Submitted')
      .setColor(result === 'Passed' ? '#43b581' : '#f04747')
      .setDescription(`A tryout log has been submitted for ${recruitUsername}`)
      .addFields(
        { name: '👤 Recruit', value: recruitUsername, inline: true },
        { name: '🎯 Tryout', value: tryoutType, inline: true },
        { name: '✅ Result', value: result, inline: true },
        { name: '📝 Notes', value: notes, inline: false },
        { name: '📅 Logged by', value: `${interaction.user} at ${timestamp}`, inline: false }
      )
      .setTimestamp()
      .setFooter({ text: `Recruit ID: ${recruitInfo.userId}` });
    
    // Send the log
    return interaction.editReply({ embeds: [logEmbed] });
  },
};
