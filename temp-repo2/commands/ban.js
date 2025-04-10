const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Bans a user from the server')
    .addUserOption(option => 
      option.setName('user')
        .setDescription('The user to ban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for banning the user')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('days')
        .setDescription('Number of days of messages to delete (0-7)')
        .setRequired(false)
        .setMinValue(0)
        .setMaxValue(7))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    await interaction.deferReply();
    
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteMessageDays = interaction.options.getInteger('days') || 1;
    
    // Get the member object for the target user
    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    
    if (targetMember && !targetMember.bannable) {
      return interaction.editReply({ content: '❌ I cannot ban this user. They may have higher permissions than me or be the server owner.' });
    }
    
    try {
      // Create the embed for the user being banned (sent via DM)
      const userEmbed = new EmbedBuilder()
        .setTitle(`You have been banned from ${interaction.guild.name}`)
        .setColor('#ff0000')
        .addFields(
          { name: 'Reason', value: reason },
          { name: 'Banned by', value: interaction.user.tag }
        )
        .setTimestamp();
      
      // Try to send a DM to the user
      if (targetMember) {
        try {
          await targetUser.send({ embeds: [userEmbed] });
        } catch (error) {
          // If DMing fails, just continue with the ban
          console.error(`Failed to send DM to ${targetUser.tag}:`, error);
        }
      }
      
      // Ban the user
      await interaction.guild.members.ban(targetUser, { 
        deleteMessageDays: deleteMessageDays,
        reason: `${reason} (Banned by ${interaction.user.tag})`
      });
      
      // Create the confirmation embed
      const confirmEmbed = new EmbedBuilder()
        .setTitle('User Banned')
        .setColor('#00a86b')
        .setDescription(`${targetUser.tag} has been banned.`)
        .addFields(
          { name: 'User ID', value: targetUser.id, inline: true },
          { name: 'Reason', value: reason, inline: true },
          { name: 'Banned by', value: interaction.user.tag, inline: true },
          { name: 'Message deletion', value: `${deleteMessageDays} day(s)`, inline: true }
        )
        .setTimestamp();
      
      return interaction.editReply({ embeds: [confirmEmbed] });
    } catch (error) {
      console.error(`Error banning ${targetUser.tag}:`, error);
      return interaction.editReply({ content: `❌ Failed to ban the user: ${error.message}` });
    }
  },
};