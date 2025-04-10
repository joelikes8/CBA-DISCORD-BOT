const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('Delete multiple messages at once')
    .addIntegerOption(option =>
      option.setName('amount')
        .setDescription('Number of messages to delete (1-99)')
        .setRequired(true)
        .setMinValue(1)
        .setMaxValue(99))
    .addUserOption(option =>
      option.setName('user')
        .setDescription('Only delete messages from this user')
        .setRequired(false))
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const amount = interaction.options.getInteger('amount');
    const targetUser = interaction.options.getUser('user');
    const channel = interaction.channel;
    
    try {
      // Get messages to delete
      const messages = await channel.messages.fetch({ limit: 100 });
      
      // Filter messages if a specific user is targeted
      let filteredMessages = messages;
      if (targetUser) {
        filteredMessages = messages.filter(msg => msg.author.id === targetUser.id);
      }
      
      // Further filter to get only messages from the last 14 days (Discord API limitation)
      const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
      const recentMessages = filteredMessages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
      
      // Slice to get only the specified amount
      const messagesToDelete = [...recentMessages.values()].slice(0, amount);
      
      if (messagesToDelete.length === 0) {
        return interaction.editReply({ content: '❌ No messages found that can be deleted. Messages must be less than 14 days old.' });
      }
      
      // Delete the messages
      const deletedCount = await channel.bulkDelete(messagesToDelete, true).then(deleted => deleted.size);
      
      // Create a confirmation embed
      const embed = new EmbedBuilder()
        .setTitle('Messages Purged')
        .setColor('#00a86b')
        .setDescription(`Successfully deleted ${deletedCount} message(s).`)
        .addFields(
          { name: 'Channel', value: `${channel}`, inline: true },
          { name: 'User Filter', value: targetUser ? `${targetUser.tag}` : 'None', inline: true },
          { name: 'Purged by', value: interaction.user.tag, inline: true }
        )
        .setFooter({ text: 'Messages older than 14 days cannot be bulk deleted' })
        .setTimestamp();
      
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error('Error purging messages:', error);
      return interaction.editReply({ content: `❌ Failed to purge messages: ${error.message}`, ephemeral: true });
    }
  },
};