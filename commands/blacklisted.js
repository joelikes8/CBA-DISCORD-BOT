const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addBlacklistedGroup, removeBlacklistedGroup, getBlacklistedGroups } = require('../utils/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklisted')
    .setDescription('Manage blacklisted Roblox groups')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a group to the blacklist')
        .addStringOption(option =>
          option
            .setName('group_id')
            .setDescription('The Roblox group ID to blacklist')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a group from the blacklist')
        .addStringOption(option =>
          option
            .setName('group_id')
            .setDescription('The Roblox group ID to remove from blacklist')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('list')
        .setDescription('List all blacklisted groups'))
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'add') {
      const groupId = interaction.options.getString('group_id');
      
      // Validate that the input is a number
      if (isNaN(groupId)) {
        return interaction.reply({ content: '❌ Group ID must be a number.', ephemeral: true });
      }
      
      // Clean up the group ID (remove whitespace, make sure it's a string)
      const cleanGroupId = String(groupId).trim();
      console.log(`[INFO] Adding blacklisted group with ID: ${cleanGroupId}`);
      
      // Add the group to the blacklist
      const count = await addBlacklistedGroup(cleanGroupId);
      
      const embed = new EmbedBuilder()
        .setTitle('Group Blacklisted')
        .setColor('#43b581')
        .setDescription(`Successfully added group ID \`${groupId}\` to the blacklist.`)
        .addFields({ name: 'Total Blacklisted Groups', value: count.toString() })
        .setFooter({ text: 'Use /blacklisted list to see all blacklisted groups' });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'remove') {
      const groupId = interaction.options.getString('group_id');
      
      // Clean up the group ID (remove whitespace, make sure it's a string)
      const cleanGroupId = String(groupId).trim();
      console.log(`[INFO] Removing blacklisted group with ID: ${cleanGroupId}`);
      
      // Remove the group from the blacklist
      const success = await removeBlacklistedGroup(cleanGroupId);
      
      if (!success) {
        return interaction.reply({ content: `❌ Group ID \`${groupId}\` was not in the blacklist.`, ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Group Removed from Blacklist')
        .setColor('#43b581')
        .setDescription(`Successfully removed group ID \`${groupId}\` from the blacklist.`)
        .setFooter({ text: 'Use /blacklisted list to see all blacklisted groups' });
      
      return interaction.reply({ embeds: [embed] });
    }
    
    else if (subcommand === 'list') {
      const blacklistedGroups = await getBlacklistedGroups();
      console.log(`[INFO] Retrieved ${blacklistedGroups.length} blacklisted groups:`, blacklistedGroups);
      
      if (blacklistedGroups.length === 0) {
        return interaction.reply({ content: 'There are no blacklisted groups yet.', ephemeral: true });
      }
      
      const embed = new EmbedBuilder()
        .setTitle('Blacklisted Groups')
        .setColor('#2a2d31')
        .setDescription('Here are all currently blacklisted Roblox groups:')
        .addFields({
          name: 'Group IDs',
          value: blacklistedGroups.join('\n') || 'None'
        })
        .setFooter({ text: `Total: ${blacklistedGroups.length} groups` });
      
      return interaction.reply({ embeds: [embed] });
    }
  },
};
