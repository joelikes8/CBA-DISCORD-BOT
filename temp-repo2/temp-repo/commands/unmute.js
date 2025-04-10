const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unmute')
    .setDescription('Removes a timeout from a muted user')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to unmute')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unmuting the user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get the member object for the target user
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return interaction.editReply({ content: '❌ Unable to find that user in this server.' });
    }
    
    // Check if the user is actually timed out
    if (!targetMember.communicationDisabledUntil) {
      return interaction.editReply({ content: '❌ This user is not currently muted.' });
    }
    
    try {
      // Remove the timeout
      await targetMember.timeout(null, reason);
      
      // Create the embed for the user being unmuted (sent via DM)
      const userEmbed = new EmbedBuilder()
        .setTitle(`You have been unmuted in ${interaction.guild.name}`)
        .setColor('#33cc33')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Unmuted by', value: interaction.user.tag }
        )
        .setTimestamp();
      
      // Try to send a DM to the user
      try {
        await targetUser.send({ embeds: [userEmbed] });
      } catch (error) {
        // If DMing fails, just continue
        console.error(`Failed to send DM to ${targetUser.tag}:`, error);
      }
      
      // Create the confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('User Unmuted')
        .setColor('#00a86b')
        .setDescription(`${targetUser.tag} has been unmuted.`)
        .addFields(
          { name: 'User', value: `${targetUser}`, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Unmuted by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error unmuting ${targetUser.tag}:`, error);
      return interaction.editReply({ content: `❌ Failed to unmute the user: ${error.message}` });
    }
  },
};