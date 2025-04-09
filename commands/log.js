const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('log')
    .setDescription('Log moderation actions')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('Target user of the action')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('action')
        .setDescription('Type of action taken')
        .setRequired(true)
        .addChoices(
          { name: 'Warn', value: 'warn' },
          { name: 'Mute', value: 'mute' },
          { name: 'Kick', value: 'kick' },
          { name: 'Ban', value: 'ban' },
          { name: 'Tryout', value: 'tryout' },
          { name: 'Verification', value: 'verify' },
          { name: 'Other', value: 'other' }
        ))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for the action')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('notes')
        .setDescription('Additional notes (optional)')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user');
    const action = interaction.options.getString('action');
    const reason = interaction.options.getString('reason');
    const notes = interaction.options.getString('notes') || 'None';
    
    // Create colors for different action types
    const actionColors = {
      warn: '#ffcc00',   // Yellow
      mute: '#ff9933',   // Orange
      kick: '#ff6600',   // Dark Orange
      ban: '#ff0000',    // Red
      tryout: '#3399ff', // Blue
      verify: '#33cc33', // Green
      other: '#cc99ff'   // Purple
    };
    
    // Create icons for different action types
    const actionIcons = {
      warn: '⚠️',
      mute: '🔇',
      kick: '👢',
      ban: '🔨',
      tryout: '🎯',
      verify: '✅',
      other: '📝'
    };
    
    // Format the action name
    const actionName = action.charAt(0).toUpperCase() + action.slice(1);
    
    try {
      // Create a log embed
      const logEmbed = new EmbedBuilder()
        .setTitle(`${actionIcons[action]} ${actionName} Log`)
        .setColor(actionColors[action])
        .addFields(
          { name: 'User', value: `${targetUser} (${targetUser.tag})`, inline: true },
          { name: 'User ID', value: targetUser.id, inline: true },
          { name: 'Action', value: actionName, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Notes', value: notes, inline: false },
          { name: 'Moderator', value: interaction.user.tag, inline: true },
          { name: 'Date', value: new Date().toLocaleString(), inline: true }
        )
        .setTimestamp();
      
      // Add user avatar if available
      if (targetUser.avatar) {
        logEmbed.setThumbnail(targetUser.displayAvatarURL({ dynamic: true }));
      }
      
      // Reply with the log embed
      await interaction.editReply({ embeds: [logEmbed] });
      
      // Ideally, in a real bot, you'd also:
      // 1. Send this to a dedicated logging channel
      // 2. Store it in a database for audit history
      
    } catch (error) {
      console.error(`Error logging action:`, error);
      return interaction.editReply({ content: `❌ Failed to log action: ${error.message}` });
    }
  },
};