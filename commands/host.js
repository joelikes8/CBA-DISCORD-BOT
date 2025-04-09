const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getTryoutChannel } = require('../utils/database');
const { getVerifiedUser } = require('../utils/database');
const { getPlayerAvatar } = require('../utils/robloxAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('host')
    .setDescription('Host a tryout session')
    .addStringOption(option =>
      option.setName('location')
        .setDescription('The location for the tryout (e.g., parade deck)')
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName('pad')
        .setDescription('The pad number')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(100))
    .addIntegerOption(option =>
      option.setName('locked')
        .setDescription('How long the tryout will be locked for (in minutes)')
        .setRequired(true)
        .setMinValue(0)
        .setMaxValue(20))
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const location = interaction.options.getString('location');
    const padNumber = interaction.options.getInteger('pad');
    const lockedMinutes = interaction.options.getInteger('locked');
    
    // Check if tryout channel has been set up
    const tryoutChannelId = getTryoutChannel(interaction.guild.id);
    if (!tryoutChannelId) {
      return interaction.editReply({ content: '❌ Tryout announcement channel has not been set up yet. Please use `/setuptryout` first.', ephemeral: true });
    }
    
    // Get the tryout channel
    const tryoutChannel = await interaction.guild.channels.fetch(tryoutChannelId).catch(() => null);
    if (!tryoutChannel) {
      return interaction.editReply({ content: '❌ The configured tryout channel no longer exists. Please use `/setuptryout` to set a new one.', ephemeral: true });
    }
    
    // Calculate the unlock time
    const now = new Date();
    const unlockTime = new Date(now.getTime() + lockedMinutes * 60000);
    const unlockTimeString = `<t:${Math.floor(unlockTime.getTime() / 1000)}:F>`;
    const relativeTimeString = `<t:${Math.floor(unlockTime.getTime() / 1000)}:R>`;
    
    // Try to get the host's Roblox avatar
    let avatarUrl = null;
    
    try {
      // Check if the user is verified with Roblox
      const verifiedUser = await getVerifiedUser(interaction.user.id);
      
      if (verifiedUser) {
        // Get the user's Roblox avatar URL
        avatarUrl = await getPlayerAvatar(verifiedUser.roblox_user_id);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to get host avatar:`, error);
      // Continue without avatar if there's an error
    }
    
    // Create the announcement embed
    const embed = new EmbedBuilder()
      .setTitle('🎖️ Tryout Session Announced')
      .setColor('#2a2d31')
      .setDescription(`A new tryout session has been scheduled!`)
      .addFields(
        { name: 'Location', value: location, inline: true },
        { name: 'Pad Number', value: padNumber.toString(), inline: true },
        { name: 'Hosted By', value: `${interaction.user}`, inline: true },
        { name: 'Status', value: lockedMinutes > 0 ? `🔒 Locked until ${unlockTimeString}` : '🔓 Open immediately', inline: false },
        { name: 'Instructions', value: 'Please join the Roblox game and wait at the specified location for further instructions.', inline: false }
      )
      .setTimestamp()
      .setFooter({ text: lockedMinutes > 0 ? `Unlocks ${relativeTimeString}` : 'Tryout open now' });
    
    // Add the host's Roblox avatar if available
    if (avatarUrl) {
      embed.setThumbnail(avatarUrl);
    }
    
    // Send the announcement to the tryout channel
    await tryoutChannel.send({ embeds: [embed] });
    
    // Confirm to the command user
    return interaction.editReply({ content: `✅ Tryout announcement has been sent to ${tryoutChannel}!`, ephemeral: true });
  },
};
