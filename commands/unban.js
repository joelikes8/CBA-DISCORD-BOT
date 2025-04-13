const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unban a user from the server')
    .addStringOption(option =>
      option.setName('userid')
        .setDescription('The ID of the user to unban')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('reason')
        .setDescription('Reason for unbanning the user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

  async execute(interaction) {
    // Defer reply since this might take a moment
    await interaction.deferReply({ ephemeral: true });
    
    // Get command options
    const userId = interaction.options.getString('userid');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if the executor has permission to ban members
    if (!interaction.member.permissions.has(PermissionFlagsBits.BanMembers)) {
      return interaction.editReply({
        content: '❌ You do not have permission to unban members.',
        ephemeral: true
      });
    }
    
    try {
      // Log the unban attempt
      console.log(`[INFO] ${interaction.user.tag} is attempting to unban user with ID: ${userId}`);
      
      // Fetch ban information to verify the user is actually banned
      const banList = await interaction.guild.bans.fetch();
      const bannedUser = banList.find(banInfo => banInfo.user.id === userId);
      
      if (!bannedUser) {
        return interaction.editReply({
          content: `❌ Could not find a banned user with ID: ${userId}. Please check the ID and try again.`,
          ephemeral: true
        });
      }
      
      // Unban the user
      await interaction.guild.members.unban(userId, `Unbanned by ${interaction.user.tag} | Reason: ${reason}`);
      
      // Create a success embed
      const successEmbed = new EmbedBuilder()
        .setTitle('User Unbanned')
        .setColor('#43b581')
        .setDescription(`Successfully unbanned <@${userId}>`)
        .addFields(
          { name: 'User ID', value: userId, inline: true },
          { name: 'Unbanned by', value: interaction.user.tag, inline: true },
          { name: 'Reason', value: reason }
        )
        .setTimestamp()
        .setFooter({ text: `Unbanned by ${interaction.user.tag}` });
      
      // Send a log message to the server logs channel if configured
      try {
        // If you have a logging channel set up, you can send the embed there as well
        // Replace 'logChannelId' with your actual log channel getter
        /*
        const logChannel = await interaction.guild.channels.fetch(logChannelId);
        if (logChannel) {
          await logChannel.send({ embeds: [successEmbed] });
        }
        */
      } catch (logError) {
        console.error('[ERROR] Failed to send unban log to log channel:', logError);
      }
      
      // Send the success message to the command user
      return interaction.editReply({
        embeds: [successEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error('[ERROR] Failed to unban user:', error);
      
      return interaction.editReply({
        content: `❌ Failed to unban user: ${error.message}`,
        ephemeral: true
      });
    }
  }
};