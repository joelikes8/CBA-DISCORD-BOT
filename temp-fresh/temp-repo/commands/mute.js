const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Mutes a user for a specified duration')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to mute')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('duration')
        .setDescription('Duration of the mute in minutes')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(40320)) // Max of 4 weeks (40320 minutes)
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for muting the user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user');
    const duration = interaction.options.getInteger('duration');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get the member object for the target user
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return interaction.editReply({ content: '❌ Unable to find that user in this server.' });
    }
    
    // Check if the bot can moderate the user
    if (!targetMember.moderatable) {
      return interaction.editReply({ content: '❌ I cannot mute this user. They may have higher permissions than me or be the server owner.' });
    }
    
    try {
      // Calculate timeout expiration time (in milliseconds)
      const timeoutDuration = duration * 60 * 1000; // Convert minutes to milliseconds
      
      // Create the embed for the user being muted (sent via DM)
      const userEmbed = new EmbedBuilder()
        .setTitle(`You have been muted in ${interaction.guild.name}`)
        .setColor('#ff9933')
        .addFields(
          { name: 'Duration', value: `${duration} minute(s)`, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Muted by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      
      // Try to send a DM to the user
      try {
        await targetUser.send({ embeds: [userEmbed] });
      } catch (error) {
        // If DMing fails, just continue with the mute
        console.error(`Failed to send DM to ${targetUser.tag}:`, error);
      }
      
      // Timeout the user
      await targetMember.timeout(timeoutDuration, reason);
      
      // Calculate when the timeout will end
      const now = new Date();
      const timeoutEnd = new Date(now.getTime() + timeoutDuration);
      const timeoutEndTimestamp = Math.floor(timeoutEnd.getTime() / 1000);
      
      // Create the confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('User Muted')
        .setColor('#00a86b')
        .setDescription(`${targetUser.tag} has been muted.`)
        .addFields(
          { name: 'User', value: `${targetUser}`, inline: true },
          { name: 'Duration', value: `${duration} minute(s)`, inline: true },
          { name: 'Expires', value: `<t:${timeoutEndTimestamp}:R>`, inline: true },
          { name: 'Reason', value: reason, inline: false },
          { name: 'Muted by', value: interaction.user.tag, inline: false }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error muting ${targetUser.tag}:`, error);
      return interaction.editReply({ content: `❌ Failed to mute the user: ${error.message}` });
    }
  },
};