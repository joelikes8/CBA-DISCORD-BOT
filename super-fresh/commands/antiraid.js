const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

// Store anti-raid configuration per guild
const antiRaidConfig = new Map();

// Configure default settings
function getGuildConfig(guildId) {
  if (!antiRaidConfig.has(guildId)) {
    antiRaidConfig.set(guildId, {
      enabled: false,
      joinThreshold: 5,
      joinTimeWindow: 10, // seconds
      action: 'lockdown', // 'lockdown', 'kick', or 'ban'
      whitelistedRoles: [],
      recentJoins: [] // Store recent member joins to detect raids
    });
  }
  return antiRaidConfig.get(guildId);
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('antiraid')
    .setDescription('Configure anti-raid protection settings')
    .addSubcommand(subcommand =>
      subcommand
        .setName('enable')
        .setDescription('Enable anti-raid protection')
        .addIntegerOption(option =>
          option.setName('threshold')
            .setDescription('Number of joins to trigger the system (default: 5)')
            .setRequired(false)
            .setMinValue(2)
            .setMaxValue(20))
        .addIntegerOption(option =>
          option.setName('timewindow')
            .setDescription('Time window in seconds to count joins (default: 10)')
            .setRequired(false)
            .setMinValue(5)
            .setMaxValue(30))
        .addStringOption(option =>
          option.setName('action')
            .setDescription('Action to take when raid is detected')
            .setRequired(false)
            .addChoices(
              { name: 'Server Lockdown', value: 'lockdown' },
              { name: 'Kick New Members', value: 'kick' },
              { name: 'Ban New Members', value: 'ban' }
            )))
    .addSubcommand(subcommand =>
      subcommand
        .setName('disable')
        .setDescription('Disable anti-raid protection'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('status')
        .setDescription('Check current anti-raid settings'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;
    const config = getGuildConfig(guildId);
    
    if (subcommand === 'enable') {
      // Update config with new settings if provided
      config.enabled = true;
      
      const threshold = interaction.options.getInteger('threshold');
      if (threshold) config.joinThreshold = threshold;
      
      const timeWindow = interaction.options.getInteger('timewindow');
      if (timeWindow) config.joinTimeWindow = timeWindow;
      
      const action = interaction.options.getString('action');
      if (action) config.action = action;
      
      // Create embed to show enabled settings
      const embed = new EmbedBuilder()
        .setTitle('🛡️ Anti-Raid Protection Enabled')
        .setColor('#00a86b')
        .addFields(
          { name: 'Join Threshold', value: `${config.joinThreshold} members`, inline: true },
          { name: 'Time Window', value: `${config.joinTimeWindow} seconds`, inline: true },
          { name: 'Action', value: formatAction(config.action), inline: true }
        )
        .setDescription('The server is now protected against member raid attacks. If a sudden influx of new members is detected, the configured action will be taken automatically.')
        .setFooter({ text: 'Use "/antiraid status" to check current settings' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'disable') {
      config.enabled = false;
      return interaction.reply({ content: '✅ Anti-raid protection has been disabled.' });
    }
    
    else if (subcommand === 'status') {
      const embed = new EmbedBuilder()
        .setTitle('Anti-Raid Protection Status')
        .setColor(config.enabled ? '#00a86b' : '#ff0000')
        .addFields(
          { name: 'Status', value: config.enabled ? '✅ Enabled' : '❌ Disabled', inline: false },
          { name: 'Join Threshold', value: `${config.joinThreshold} members`, inline: true },
          { name: 'Time Window', value: `${config.joinTimeWindow} seconds`, inline: true },
          { name: 'Action', value: formatAction(config.action), inline: true }
        )
        .setFooter({ text: 'Anti-raid system monitors sudden influxes of new members' })
        .setTimestamp();
      
      return interaction.reply({ embeds: [embed] });
    }
  },
  
  // Export the anti-raid config for use in events
  getAntiRaidConfig: getGuildConfig,
  
  // Event handler for new member joins (to be called from guildMemberAdd event)
  async handleMemberJoin(member) {
    const guildId = member.guild.id;
    const config = getGuildConfig(guildId);
    
    // If anti-raid is not enabled, do nothing
    if (!config.enabled) return;
    
    const now = Date.now();
    
    // Add this join to recent joins
    config.recentJoins.push({
      userId: member.id,
      joinTime: now
    });
    
    // Clear out old joins outside the time window
    const timeWindowMs = config.joinTimeWindow * 1000;
    config.recentJoins = config.recentJoins.filter(join => now - join.joinTime < timeWindowMs);
    
    // Check if we've hit the threshold
    if (config.recentJoins.length >= config.joinThreshold) {
      console.log(`[ANTI-RAID] Raid detected in guild ${member.guild.name} (${member.guild.id})! ${config.recentJoins.length} joins in ${config.joinTimeWindow} seconds.`);
      
      // Execute the configured action
      await executeAntiRaidAction(member.guild, config);
      
      // Clear recent joins after taking action to avoid repeated actions
      config.recentJoins = [];
    }
  }
};

// Helper function to format action for display
function formatAction(action) {
  switch (action) {
    case 'lockdown': return '🔒 Server Lockdown';
    case 'kick': return '👢 Kick New Members';
    case 'ban': return '🔨 Ban New Members';
    default: return action;
  }
}

// Execute the appropriate anti-raid action
async function executeAntiRaidAction(guild, config) {
  try {
    // Create a log message in system channel if available
    const systemChannel = guild.systemChannel;
    const alertEmbed = new EmbedBuilder()
      .setTitle('🚨 RAID ALERT 🚨')
      .setColor('#ff0000')
      .setDescription(`A raid has been detected! ${config.recentJoins.length} members joined in ${config.joinTimeWindow} seconds.`)
      .addFields(
        { name: 'Action Taken', value: formatAction(config.action), inline: true },
        { name: 'Timestamp', value: new Date().toLocaleString(), inline: true }
      )
      .setTimestamp();
    
    if (systemChannel) {
      await systemChannel.send({ embeds: [alertEmbed] });
    }
    
    // Execute the configured action
    switch (config.action) {
      case 'lockdown':
        // Lock down all text channels
        const channels = await guild.channels.fetch();
        for (const channel of channels.values()) {
          if (channel.isTextBased() && !channel.isVoiceBased()) {
            try {
              await channel.permissionOverwrites.edit(guild.roles.everyone, {
                SendMessages: false
              }, { reason: 'Anti-raid: Server lockdown due to raid detection' });
              
              // Send a notice in each channel
              await channel.send({ content: '🚨 **This channel has been locked due to raid detection.** 🚨\nServer administrators will unlock the channel when it\'s safe.' });
            } catch (error) {
              console.error(`Failed to lock down channel ${channel.name}:`, error);
            }
          }
        }
        break;
        
      case 'kick':
        // Kick all recent joins
        for (const join of config.recentJoins) {
          try {
            const member = await guild.members.fetch(join.userId).catch(() => null);
            if (member) {
              await member.kick('Anti-raid: Automatic kick due to raid detection');
            }
          } catch (error) {
            console.error(`Failed to kick user ${join.userId}:`, error);
          }
        }
        break;
        
      case 'ban':
        // Ban all recent joins
        for (const join of config.recentJoins) {
          try {
            await guild.members.ban(join.userId, { 
              reason: 'Anti-raid: Automatic ban due to raid detection',
              deleteMessageDays: 1
            });
          } catch (error) {
            console.error(`Failed to ban user ${join.userId}:`, error);
          }
        }
        break;
    }
  } catch (error) {
    console.error('Error executing anti-raid action:', error);
  }
}