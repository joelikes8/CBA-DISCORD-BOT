const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVerifiedUser, removeVerificationCode } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reverify')
    .setDescription('Remove verification and allow users to verify again')
    .addSubcommand(subcommand =>
      subcommand
        .setName('me')
        .setDescription('Remove your own verification so you can verify with a different Roblox account'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('user')
        .setDescription('Remove a user\'s verification (Admin only)')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('The user whose verification to remove')
            .setRequired(true))),
  
  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'me') {
      return this.reverifySelf(interaction);
    }
    else if (subcommand === 'user') {
      // Check permissions
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
          !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply({ 
          content: '❌ You do not have permission to reverify other users.', 
          ephemeral: true 
        });
      }
      
      const targetUser = interaction.options.getUser('target');
      return this.reverifyUser(interaction, targetUser);
    }
  },
  
  async reverifySelf(interaction) {
    try {
      const userId = interaction.user.id;
      console.log(`[INFO] User ${interaction.user.tag} (${userId}) is requesting reverification`);
      
      // Check if the user is currently verified
      const verifiedData = await getVerifiedUser(userId);
      
      if (!verifiedData) {
        return interaction.editReply({
          content: '❌ You are not currently verified. Use the `/verify` command to verify your Roblox account.',
          ephemeral: true
        });
      }
      
      // Remove their verification
      const removed = await removeVerificationCode(userId);
      
      if (!removed) {
        return interaction.editReply({
          content: '❌ An error occurred while removing your verification. Please try again later.',
          ephemeral: true
        });
      }
      
      // Try to reset their nickname if possible
      try {
        await interaction.member.setNickname(null);
        console.log(`[INFO] Reset nickname for ${interaction.user.tag}`);
      } catch (error) {
        console.error(`[WARNING] Could not reset nickname for ${interaction.user.tag}:`, error);
        // Continue even if nickname reset fails
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Verification Removed')
        .setColor('#43b581')
        .setDescription('Your verification has been successfully removed.')
        .addFields(
          { name: 'Next Steps', value: 'Use the `/verify` command to verify with a different Roblox account.' }
        )
        .setFooter({ text: 'Your Discord account is no longer linked to any Roblox account' });
      
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(`[ERROR] Error in reverifySelf:`, error);
      return interaction.editReply({
        content: `❌ An unexpected error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  },
  
  async reverifyUser(interaction, targetUser) {
    try {
      console.log(`[INFO] Admin ${interaction.user.tag} is reverifying user ${targetUser.tag}`);
      
      // Check if the target user is verified
      const verifiedData = await getVerifiedUser(targetUser.id);
      
      if (!verifiedData) {
        return interaction.editReply({
          content: `❌ ${targetUser.tag} is not currently verified.`,
          ephemeral: true
        });
      }
      
      const robloxUsername = verifiedData.robloxUsername;
      
      // Remove their verification
      const removed = await removeVerificationCode(targetUser.id);
      
      if (!removed) {
        return interaction.editReply({
          content: `❌ An error occurred while removing ${targetUser.tag}'s verification.`,
          ephemeral: true
        });
      }
      
      // Try to reset their nickname if possible
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        await member.setNickname(null);
        console.log(`[INFO] Reset nickname for ${targetUser.tag}`);
      } catch (error) {
        console.error(`[WARNING] Could not reset nickname for ${targetUser.tag}:`, error);
        // Continue even if nickname reset fails
      }
      
      const embed = new EmbedBuilder()
        .setTitle('User Verification Removed')
        .setColor('#43b581')
        .setDescription(`You have successfully removed ${targetUser.tag}'s verification.`)
        .addFields(
          { name: 'Discord User', value: targetUser.tag, inline: true },
          { name: 'Previous Roblox Account', value: robloxUsername || 'Unknown', inline: true },
          { name: 'Next Steps', value: `The user will need to use the /verify command to verify again.` }
        );
      
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(`[ERROR] Error in reverifyUser:`, error);
      return interaction.editReply({
        content: `❌ An unexpected error occurred: ${error.message}`,
        ephemeral: true
      });
    }
  }
};