const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// In-memory storage for warnings (in a real bot, you'd want to use a database)
// Maps guild IDs to maps of user IDs to arrays of warnings
const warnings = new Map();

function getWarnings(guildId, userId) {
  if (!warnings.has(guildId)) {
    warnings.set(guildId, new Map());
  }
  const guildWarnings = warnings.get(guildId);
  if (!guildWarnings.has(userId)) {
    guildWarnings.set(userId, []);
  }
  return guildWarnings.get(userId);
}

function addWarning(guildId, userId, warning) {
  const userWarnings = getWarnings(guildId, userId);
  userWarnings.push(warning);
  return userWarnings.length;
}

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
    const subcommand = interaction.options.getSubcommand();
    const targetUser = interaction.options.getUser('user');
    const guildId = interaction.guild.id;
    
    if (subcommand === 'add') {
      const reason = interaction.options.getString('reason');
      
      // Add the warning
      const warning = {
        reason,
        moderator: interaction.user.id,
        timestamp: new Date().toISOString()
      };
      
      const warningCount = addWarning(guildId, targetUser.id, warning);
      
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
        .setTimestamp();
      
      return interaction.reply({ embeds: [confirmEmbed] });
    }
    
    else if (subcommand === 'list') {
      const userWarnings = getWarnings(guildId, targetUser.id);
      
      if (userWarnings.length === 0) {
        return interaction.reply({ content: `${targetUser.tag} has no warnings.` });
      }
      
      // Format the warnings
      const warningsList = userWarnings.map((warning, index) => {
        const moderator = interaction.client.users.cache.get(warning.moderator)?.tag || 'Unknown moderator';
        const date = new Date(warning.timestamp).toLocaleDateString();
        return `**Warning ${index + 1}** (${date})\n**Reason:** ${warning.reason}\n**Moderator:** ${moderator}`;
      }).join('\n\n');
      
      const embed = new EmbedBuilder()
        .setTitle(`Warnings for ${targetUser.tag}`)
        .setColor('#ffcc00')
        .setDescription(warningsList)
        .setFooter({ text: `Total warnings: ${userWarnings.length}` })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'clear') {
      if (!warnings.has(guildId) || !warnings.get(guildId).has(targetUser.id) || 
          warnings.get(guildId).get(targetUser.id).length === 0) {
        return interaction.reply({ content: `${targetUser.tag} has no warnings to clear.` });
      }
      
      // Get the number of warnings before clearing
      const warningCount = warnings.get(guildId).get(targetUser.id).length;
      
      // Clear the warnings
      warnings.get(guildId).set(targetUser.id, []);
      
      const embed = new EmbedBuilder()
        .setTitle('Warnings Cleared')
        .setColor('#00a86b')
        .setDescription(`All warnings (${warningCount}) for ${targetUser.tag} have been cleared.`)
        .addFields(
          { name: 'User', value: `${targetUser}`, inline: true },
          { name: 'Cleared by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  },
};