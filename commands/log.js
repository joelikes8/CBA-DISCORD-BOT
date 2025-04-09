const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Log a tryout or training result')
    .addStringOption(option => 
      option.setName('roblox_username')
        .setDescription('Roblox username of the recruit')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('session_type')
        .setDescription('Type of session (Tryout or Training)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('result')
        .setDescription('Result of the tryout/training')
        .setRequired(true)
        .addChoices(
          { name: 'Passed', value: 'Passed' },
          { name: 'Failed', value: 'Failed' }
        ))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes about the tryout/training')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const robloxUsername = interaction.options.getString('roblox_username');
    const sessionType = interaction.options.getString('session_type');
    const result = interaction.options.getString('result');
    const notes = interaction.options.getString('notes') || 'None';
    
    // Set color based on result
    const resultColor = result === 'Passed' ? '#33cc33' : '#ff0000'; // Green for pass, Red for fail
    
    try {
      // Create a log embed with the requested format
      const logEmbed = new EmbedBuilder()
        .setTitle(`📋 Tryout Log Submitted:`)
        .setColor(resultColor)
        .setDescription(
          `👤 Recruit: ${robloxUsername}\n` +
          `🎯 Tryout/Training: ${sessionType}\n` +
          `✅ Result: ${result}\n` +
          `📝 Notes: ${notes}\n` +
          `📅 Logged by: ${interaction.user}`
        )
        .setTimestamp();
      
      // Reply with the log embed
      await interaction.editReply({ embeds: [logEmbed] });
      
      // Additional log to a dedicated channel could be added here
      
    } catch (error) {
      console.error(`Error logging tryout:`, error);
      return interaction.editReply({ content: `❌ Failed to log tryout: ${error.message}` });
    }
  },
};