const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockdown')
    .setDescription('Lock or unlock a channel')
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Lock down a channel (prevent everyone from sending messages)')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to lock (defaults to current channel)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for the lockdown')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Remove a channel lockdown')
        .addChannelOption(option =>
          option.setName('channel')
            .setDescription('The channel to unlock (defaults to current channel)')
            .setRequired(false))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for removing the lockdown')
            .setRequired(false)))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

  async execute(interaction) {
    await interaction.deferReply();
    
    const subcommand = interaction.options.getSubcommand();
    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
    const reason = interaction.options.getString('reason') || 'No reason provided';
    
    // Check if the channel is a text channel where messages can be sent
    if (!targetChannel.isTextBased() || targetChannel.isVoiceBased()) {
      return interaction.editReply({ content: '❌ This command only works on text channels.' });
    }
    
    try {
      const guild = interaction.guild;
      const everyoneRole = guild.roles.everyone;
      
      if (subcommand === 'enable') {
        // Lock the channel by removing Send Messages permission from @everyone
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: false
        }, { reason: `Channel lockdown: ${reason} (by ${interaction.user.tag})` });
        
        const embed = new EmbedBuilder()
          .setTitle('🔒 Channel Locked')
          .setColor('#ff0000')
          .setDescription(`This channel has been locked.`)
          .addFields(
            { name: 'Channel', value: `${targetChannel}`, inline: true },
            { name: 'Locked by', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();
        
        // Send the embed to the locked channel
        await targetChannel.send({ embeds: [embed] });
        
        // Send confirmation to the user
        return interaction.editReply({ content: `🔒 Successfully locked ${targetChannel}.` });
      }
      
      else if (subcommand === 'disable') {
        // Reset permissions to default or unlock the channel
        await targetChannel.permissionOverwrites.edit(everyoneRole, {
          SendMessages: null // Reset to default (inherits from category or server defaults)
        }, { reason: `Channel lockdown removed: ${reason} (by ${interaction.user.tag})` });
        
        const embed = new EmbedBuilder()
          .setTitle('🔓 Channel Unlocked')
          .setColor('#00a86b')
          .setDescription(`This channel has been unlocked.`)
          .addFields(
            { name: 'Channel', value: `${targetChannel}`, inline: true },
            { name: 'Unlocked by', value: interaction.user.tag, inline: true },
            { name: 'Reason', value: reason, inline: false }
          )
          .setTimestamp();
        
        // Send the embed to the unlocked channel
        await targetChannel.send({ embeds: [embed] });
        
        // Send confirmation to the user
        return interaction.editReply({ content: `🔓 Successfully unlocked ${targetChannel}.` });
      }
    } catch (error) {
      console.error(`Error with lockdown command:`, error);
      return interaction.editReply({ content: `❌ Failed to ${subcommand} the lockdown: ${error.message}` });
    }
  },
};