/**
 * Pre-flight check to ensure Discord token is valid
 * This verifies the Discord token works before starting the main bot
 */

const { Client, GatewayIntentBits, Events } = require('discord.js');

console.log('[DISCORD-CHECK] Starting Discord token verification...');

// Discord token validation
async function validateDiscordToken() {
  // Check if token exists
  const token = process.env.DISCORD_TOKEN;
  if (!token) {
    console.error('[DISCORD-CHECK] ERROR: No DISCORD_TOKEN found in environment variables');
    console.error('[DISCORD-CHECK] Make sure to set DISCORD_TOKEN in your Render environment variables');
    return false;
  }

  console.log(`[DISCORD-CHECK] DISCORD_TOKEN found (${token.substring(0, 5)}...${token.substring(token.length - 5)})`);
  
  // Create minimal client for testing
  const client = new Client({ 
    intents: [GatewayIntentBits.Guilds],
    allowedMentions: { parse: [] }
  });

  // Set timeout to prevent hanging
  const timeout = setTimeout(() => {
    console.error('[DISCORD-CHECK] ERROR: Discord login timed out after 20 seconds');
    console.error('[DISCORD-CHECK] Your token might be invalid or Discord API might be having issues');
    process.exit(1);
  }, 20000);

  try {
    // Try to log in
    console.log('[DISCORD-CHECK] Attempting to log in to Discord...');
    
    // Handle ready event
    client.once(Events.ClientReady, readyClient => {
      clearTimeout(timeout);
      console.log(`[DISCORD-CHECK] SUCCESS: Logged in as ${readyClient.user.tag}`);
      console.log(`[DISCORD-CHECK] Bot is in ${readyClient.guilds.cache.size} servers`);
      
      // List servers
      if (readyClient.guilds.cache.size > 0) {
        console.log('[DISCORD-CHECK] Servers:');
        readyClient.guilds.cache.forEach(guild => {
          console.log(`[DISCORD-CHECK]   - ${guild.name} (${guild.id}) - ${guild.memberCount} members`);
        });
      }
      
      // Destroy client after verification
      client.destroy();
      return true;
    });

    // Handle login errors
    client.on('error', error => {
      clearTimeout(timeout);
      console.error('[DISCORD-CHECK] ERROR: Failed to connect to Discord');
      console.error(`[DISCORD-CHECK] ${error.message}`);
      return false;
    });

    // Login
    await client.login(token);
    
    // This will resolve immediately, before the ready event
    // We just need to make sure login() doesn't throw
    return true;
  } catch (error) {
    clearTimeout(timeout);
    console.error('[DISCORD-CHECK] ERROR: Failed to log in to Discord');
    console.error(`[DISCORD-CHECK] ${error.message}`);
    return false;
  }
}

// Run the validation when executed directly
if (require.main === module) {
  validateDiscordToken().then(success => {
    if (success) {
      console.log('[DISCORD-CHECK] Token validation completed successfully');
    } else {
      console.error('[DISCORD-CHECK] Token validation failed');
      process.exit(1);
    }
  }).catch(error => {
    console.error('[DISCORD-CHECK] An unexpected error occurred during validation:');
    console.error(error);
    process.exit(1);
  });
}

module.exports = { validateDiscordToken };