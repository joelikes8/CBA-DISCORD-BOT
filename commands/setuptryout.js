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
    const channel = interaction.options.getChannel('channel');
    
    // Check if the bot has permission to send messages in the channel
    const permissions = channel.permissionsFor(interaction.guild.members.me);
    if (!permissions.has('SendMessages') || !permissions.has('EmbedLinks')) {
      return interaction.reply({ 
        content: `❌ I don't have permission to send messages or embeds in ${channel}. Please update my permissions and try again.`,
        ephemeral: true
      });
    }
    
    // Save the tryout channel
    setTryoutChannel(interaction.guild.id, channel.id);
    
    // Send a test message to the channel
    await channel.send({
      content: `✅ This channel has been set up for tryout announcements by ${interaction.user}. Tryout announcements will be posted here.`
    }).catch(() => {
      return interaction.reply({
        content: `❌ Failed to send a test message to ${channel}. Please check my permissions and try again.`,
        ephemeral: true
      });
    });
    
    return interaction.reply({
      content: `✅ Successfully set ${channel} as the tryout announcement channel!`,
      ephemeral: true
    });
  },
};
