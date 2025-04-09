const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kicks a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to kick')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for kicking the user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Get the member object for the target user
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (!targetMember) {
      return interaction.editReply({ content: '❌ Unable to find that user in this server.' });
    }
    
    // Check if the bot can kick the user
    if (!targetMember.kickable) {
      return interaction.editReply({ content: '❌ I cannot kick this user. They may have higher permissions than me or be the server owner.' });
    }
    
    try {
      // Create the embed for the user being kicked (sent via DM)
      const userEmbed = new EmbedBuilder()
        .setTitle(`You have been kicked from ${interaction.guild.name}`)
        .setColor('#ff4040')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Kicked by', value: interaction.user.tag }
        )
        .setTimestamp();
      
      // Try to send a DM to the user
      try {
        await targetUser.send({ embeds: [userEmbed] });
      } catch (error) {
        // If DMing fails, just continue with the kick
        console.error(`Failed to send DM to ${targetUser.tag}:`, error);
      }
      
      // Kick the user
      await targetMember.kick(reason);
      
      // Create the confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setColor('#00a86b')
        .setDescription(`${targetUser.tag} has been kicked.`)
        .addFields(
          { name: 'User ID', value: targetUser.id, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Kicked by', value: interaction.user.tag, inline: true }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error kicking ${targetUser.tag}:`, error);
      return interaction.editReply({ content: `❌ Failed to kick the user: ${error.message}` });
    }
  },
};