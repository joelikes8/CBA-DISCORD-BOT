const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.APPLICATION_ID;

if (!token) {
  console.error('[ERROR] Bot token not found! Please set the DISCORD_TOKEN environment variable.');
  process.exit(1);
}

if (!clientId) {
  console.error('[ERROR] Application ID not found! Please set the APPLICATION_ID environment variable.');
  process.exit(1);
}

const commands = [];
// Grab all command files
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

// Load each command
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  
  if ('data' in command && 'execute' in command) {
    commands.push(command.data.toJSON());
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

// Create and configure REST module
const rest = new REST({ version: '10' }).setToken(token);

// Deploy the commands
(async () => {
  try {
    console.log(`[INFO] Started refreshing ${commands.length} application (/) commands.`);

    // The put method is used to fully refresh all commands with the current set
    const data = await rest.put(
      Routes.applicationCommands(clientId),
      { body: commands },
    );

    console.log(`[INFO] Successfully reloaded ${data.length} application (/) commands.`);
  } catch (error) {
    console.error('[ERROR] Failed to deploy commands:');
    console.error(error);
  }
})();
