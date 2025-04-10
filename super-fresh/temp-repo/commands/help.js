const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Shows a list of available commands'),

  async execute(interaction) {
    // Create embeds for different categories
    const mainEmbed = new EmbedBuilder()
      .setTitle('📜 Bot Commands')
      .setColor('#0099ff')
      .setDescription('Here are all the available commands. Click the buttons below to view specific categories of commands.')
      .addFields(
        { name: '🔐 Verification', value: '`/verify` - Verify your Roblox account with Discord' },
        { name: '📋 Moderation', value: 'Commands for moderating the server. Click the button below.' },
        { name: '👑 Group Management', value: 'Commands for managing Roblox group roles. Click the button below.' },
        { name: '📢 Tryouts', value: 'Commands for managing tryouts. Click the button below.' },
        { name: '⚙️ Utility', value: 'Utility and miscellaneous commands. Click the button below.' }
      )
      .setFooter({ text: 'Use the buttons below to navigate' })
      .setTimestamp();

    const moderationEmbed = new EmbedBuilder()
      .setTitle('🛡️ Moderation Commands')
      .setColor('#ff3366')
      .setDescription('Commands for server moderation and management')
      .addFields(
        { name: '/warn', value: 'Warn a user about their behavior' },
        { name: '/mute', value: 'Temporarily mute a user from sending messages' },
        { name: '/unmute', value: 'Remove a timeout from a muted user' },
        { name: '/kick', value: 'Kick a user from the server' },
        { name: '/ban', value: 'Ban a user from the server' },
        { name: '/purge', value: 'Delete multiple messages at once' },
        { name: '/lockdown', value: 'Lock or unlock a channel' },
        { name: '/antiraid', value: 'Configure anti-raid protection settings' },
        { name: '/log', value: 'Log moderation actions' }
      )
      .setFooter({ text: 'Moderation commands require appropriate permissions' })
      .setTimestamp();

    const groupManagementEmbed = new EmbedBuilder()
      .setTitle('👑 Group Management Commands')
      .setColor('#33cc33')
      .setDescription('Commands for managing Roblox group ranks and roles')
      .addFields(
        { name: '/rank', value: 'Rank a user in the Roblox group' },
        { name: '/update', value: 'Update a user\'s Discord roles to match their Roblox rank' },
        { name: '/background', value: 'Check if a player is in any blacklisted groups' },
        { name: '/blacklisted', value: 'Manage blacklisted groups' }
      )
      .setFooter({ text: 'Group management commands require appropriate permissions' })
      .setTimestamp();

    const tryoutEmbed = new EmbedBuilder()
      .setTitle('📢 Tryout Commands')
      .setColor('#ffcc00')
      .setDescription('Commands for organizing and managing tryouts')
      .addFields(
        { name: '/setuptryout', value: 'Set up a channel for tryout announcements' },
        { name: '/host', value: 'Host a tryout and send an announcement' },
        { name: '/log', value: 'Log tryout results' }
      )
      .setFooter({ text: 'Tryout commands require appropriate permissions' })
      .setTimestamp();

    const utilityEmbed = new EmbedBuilder()
      .setTitle('⚙️ Utility Commands')
      .setColor('#9933ff')
      .setDescription('Utility and miscellaneous commands')
      .addFields(
        { name: '/help', value: 'Shows this help message' },
        { name: '/verify', value: 'Verify your Roblox account with Discord' }
      )
      .setFooter({ text: 'Utility commands are available to all users' })
      .setTimestamp();

    // Create buttons for navigation
    const navigationRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('help_main')
          .setLabel('Main Menu')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('help_moderation')
          .setLabel('Moderation')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId('help_group')
          .setLabel('Group Management')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('help_tryout')
          .setLabel('Tryouts')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('help_utility')
          .setLabel('Utility')
          .setStyle(ButtonStyle.Primary)
      );

    // Send the main embed with navigation buttons
    const message = await interaction.reply({
      embeds: [mainEmbed],
      components: [navigationRow],
      fetchReply: true
    });

    // Create a collector for button interactions
    const collector = message.createMessageComponentCollector({ time: 60000 });

    collector.on('collect', async i => {
      // Verify the interaction is from the same user
      if (i.user.id !== interaction.user.id) {
        return i.reply({ content: 'This menu is not for you!', ephemeral: true });
      }

      // Handle button clicks
      switch (i.customId) {
        case 'help_main':
          await i.update({ embeds: [mainEmbed], components: [navigationRow] });
          break;
        case 'help_moderation':
          await i.update({ embeds: [moderationEmbed], components: [navigationRow] });
          break;
        case 'help_group':
          await i.update({ embeds: [groupManagementEmbed], components: [navigationRow] });
          break;
        case 'help_tryout':
          await i.update({ embeds: [tryoutEmbed], components: [navigationRow] });
          break;
        case 'help_utility':
          await i.update({ embeds: [utilityEmbed], components: [navigationRow] });
          break;
      }
    });

    collector.on('end', async () => {
      // Remove buttons when the collector expires
      try {
        await interaction.editReply({
          embeds: [mainEmbed],
          components: []
        });
      } catch (error) {
        console.error('Error removing buttons from help menu:', error);
      }
    });
  },
};