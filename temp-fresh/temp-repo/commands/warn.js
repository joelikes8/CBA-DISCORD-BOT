const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { getWarnings, addWarning, removeWarning } = require('../utils/postgresDB');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('warn')
    .setDescription('Manage user warnings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Warn a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to warn')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for the warning')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List warnings for a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to check warnings for')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('clear')
        .setDescription('Clear all warnings for a user')
        .addUserOption(option => 
          option.setName('user')
            .setDescription('The user to clear warnings for')
            .setRequired(true)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    
    if (subcommand === 'add') {
      const reason = interaction.options.getString('reason');
      
      // Add the warning to database
      const warningId = await addWarning(
        guildId, 
        targetUser.id, 
        reason, 
        interaction.user.tag
      );
      
      if (!warningId) {
        return interaction.editReply({ content: '❌ Failed to add warning to database.' });
      }
      
      // Get updated warning count
      const userWarnings = await getWarnings(guildId, targetUser.id);
      const warningCount = userWarnings.length;
      
      // Create an embed for the user being warned
      const userEmbed = new EmbedBuilder()
        .setTitle(`You have been warned in ${interaction.guild.name}`)
        .setColor('#ffcc00')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Warning count', value: warningCount.toString() },
          { name: 'Warned by', value: interaction.user.tag }
        )
        .setTimestamp();
      
      // Try to send a DM to the user
      try {
        await targetUser.send({ embeds: [userEmbed] });
      } catch (error) {
        console.error(`Failed to send warning DM to ${targetUser.tag}:`, error);
      }
      
      // Create a confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('User Warned')
        .setColor('#00a86b')
        .setDescription(`${targetUser.tag} has been warned.`)
        .addFields(
          { name: 'User', value: `${targetUser}`, inline: true },
          { name: 'Warning Count', value: warningCount.toString(), inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Warned by', value: interaction.user.tag, inline: true }
        )
        .setFooter({ text: `Warning ID: ${warningId}` })
        .setTimestamp();
      
      return interaction.editReply({ embeds: [confirmEmbed] });
    }
    
    else if (subcommand === 'list') {
      const userWarnings = await getWarnings(guildId, targetUser.id);
      
      if (userWarnings.length === 0) {
        return interaction.editReply({ content: `${targetUser.tag} has no warnings.` });
      }
      
      // Format the warnings
      const warningsList = userWarnings.map((warning, index) => {
        const date = new Date(warning.warned_at).toLocaleDateString();
        return `**Warning ${index + 1}** (ID: ${warning.id}) - ${date}\n**Reason:** ${warning.warning}\n**Moderator:** ${warning.warned_by}`;
      }).join('\n\n');
      
      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setColor('#ffcc00')
        .setDescription(warningsList)
        .setFooter({ text: `Total warnings: ${userWarnings.length}` })
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }
    
    else if (subcommand === 'clear') {
      // Get current warnings
      const userWarnings = await getWarnings(guildId, targetUser.id);
      
      if (userWarnings.length === 0) {
        return interaction.editReply({ content: `${targetUser.tag} has no warnings to clear.` });
      }
      
      // Clear all warnings
      let successCount = 0;
      for (const warning of userWarnings) {
        const success = await removeWarning(warning.id);
        if (success) successCount++;
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Warnings Cleared')
        .setColor('#00a86b')
        .setDescription(`${successCount} of ${userWarnings.length} warnings for ${targetUser.tag} have been cleared.`)
        .addFields(
          { name: 'User', value: `${targetUser}`, inline: true },
          { name: 'Cleared by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed] });
    }
  },
};