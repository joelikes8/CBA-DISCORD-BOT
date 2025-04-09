const { Events, InteractionType } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    // Handle slash commands
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);

      if (!command) {
        console.error(`No command matching ${interaction.commandName} was found.`);
        return;
      }

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error(`Error executing ${interaction.commandName}`);
        console.error(error);
        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: 'There was an error executing this command!', ephemeral: true });
        } else {
          await interaction.reply({ content: 'There was an error executing this command!', ephemeral: true });
        }
      }
    }
    
    // Handle button interactions
    else if (interaction.isButton()) {
      const customId = interaction.customId;
      
      // Handle verify button clicks
      if (customId.startsWith('verify_')) {
        try {
          const verifyCommand = interaction.client.commands.get('verify');
          if (verifyCommand && typeof verifyCommand.handleVerifyButton === 'function') {
            await verifyCommand.handleVerifyButton(interaction);
          }
        } catch (error) {
          console.error('Error handling verify button interaction:', error);
          await interaction.reply({ content: 'There was an error processing your verification!', ephemeral: true });
        }
      }
    }
  },
};
