const { SlashCommandBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const { setTryoutChannel } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setuptryout')
    .setDescription('Set up the tryout announcement channel')
    .addChannelOption(option =>
      option.setName('channel')
        .setDescription('The channel to send tryout announcements to')
        .setRequired(true)
        .addChannelTypes(ChannelType.GuildText))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    try {
      const channel = interaction.options.getChannel('channel');
      
      if (!channel) {
        return interaction.editReply({
          content: '❌ Invalid channel. Please select a valid text channel.',
          ephemeral: true
        });
      }
      
      // Check if the bot has permission to send messages in the channel
      const permissions = channel.permissionsFor(interaction.guild.members.me);
      if (!permissions || !permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
        return interaction.editReply({ 
          content: `❌ I don't have permission to send messages or embeds in ${channel}. Please update my permissions and try again.`,
          ephemeral: true
        });
      }
      
      // Save the tryout channel
      const success = await setTryoutChannel(interaction.guild.id, channel.id);
      
      if (!success) {
        return interaction.editReply({
          content: '❌ Failed to save channel to database. Please try again.',
          ephemeral: true
        });
      }
      
      // Send a test message to the channel
      try {
        await channel.send({
          content: `✅ This channel has been set up for tryout announcements by ${interaction.user}. Tryout announcements will be posted here.`
        });
        
        return interaction.editReply({
          content: `✅ Successfully set ${channel} as the tryout announcement channel!`,
          ephemeral: true
        });
      } catch (error) {
        console.error('Error sending test message:', error);
        return interaction.editReply({
          content: `❌ Failed to send a test message to ${channel}. Please check my permissions and try again.`,
          ephemeral: true
        });
      }
    } catch (error) {
      console.error('Error in setuptryout command:', error);
      return interaction.editReply({
        content: '❌ An error occurred while setting up the tryout channel. Please try again.',
        ephemeral: true
      });
    }
  },
};
