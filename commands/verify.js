const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getUserInfo, getPlayerAvatar } = require('../utils/robloxAPI');
const { setVerificationCode, setPendingVerification, removePendingVerification, getPendingVerification, setVerifiedUser } = require('../utils/database');
const noblox = require('noblox.js');

function generateVerificationCode() {
  // Generate a random 6-character alphanumeric code
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verify')
    .setDescription('Verify your Roblox account')
    .addStringOption(option =>
      option.setName('username')
        .setDescription('Your Roblox username')
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const username = interaction.options.getString('username');
    
    // Check if the username exists on Roblox
    const userInfo = await getUserInfo(username);
    if (!userInfo) {
      return interaction.editReply({ content: '❌ The Roblox username you provided does not exist. Please check the spelling and try again.', ephemeral: true });
    }
    
    // Generate a verification code
    const verificationCode = generateVerificationCode();
    
    // Store the verification code for this user
    setVerificationCode(interaction.user.id, verificationCode, username);
    
    // Create an embed for verification instructions
    const embed = new EmbedBuilder()
      .setTitle('Roblox Verification')
      .setColor('#2a2d31')
      .setDescription(`Please follow these steps to verify your Roblox account:`)
      .addFields(
        { name: '1️⃣ Copy your verification code', value: `\`${verificationCode}\`` },
        { name: '2️⃣ Add this code to your Roblox profile description', value: 'Go to your Roblox profile > Edit > About > Add the code to your description and save.' },
        { name: '3️⃣ Click the verify button below', value: 'Once you\'ve added the code to your profile, click the button below to complete verification.' }
      )
      .setFooter({ text: 'Verification will expire in 10 minutes' });
    
    // Create a button for completing verification
    const verifyButton = new ButtonBuilder()
      .setCustomId(`verify_${interaction.user.id}`)
      .setLabel('Verify')
      .setStyle(ButtonStyle.Success);
    
    const actionRow = new ActionRowBuilder().addComponents(verifyButton);
    
    // Send the embed with the verify button
    const response = await interaction.editReply({
      embeds: [embed],
      components: [actionRow],
      ephemeral: true
    });
    
    // Store pending verification data
    setPendingVerification(interaction.user.id, {
      robloxUsername: username,
      robloxUserId: userInfo.userId,
      code: verificationCode,
      messageId: response.id,
      timestamp: Date.now()
    });
    
    // Set a timeout to remove the pending verification after 10 minutes
    setTimeout(() => {
      const pendingVerification = getPendingVerification(interaction.user.id);
      if (pendingVerification && pendingVerification.code === verificationCode) {
        removePendingVerification(interaction.user.id);
      }
    }, 10 * 60 * 1000); // 10 minutes
  },
  
  // Method to handle the verification button click
  async handleVerifyButton(interaction) {
    await interaction.deferUpdate();
    
    const userId = interaction.user.id;
    console.log(`[INFO] Handling verify button click for user ID: ${userId}`);
    
    // Get pending verification from database
    const pendingVerification = await getPendingVerification(userId);
    console.log(`[INFO] Pending verification retrieved:`, pendingVerification);
    
    if (!pendingVerification) {
      console.log(`[INFO] No pending verification found for user ${userId}`);
      return interaction.followUp({ 
        content: '❌ Your verification session has expired or does not exist. Please start over with /verify.', 
        ephemeral: true 
      });
    }
    
    // Make sure we have a username - fields are stored in snake_case in the database
    if (!pendingVerification.roblox_username) {
      console.error(`[ERROR] Missing Roblox username in pending verification for user ${userId}`);
      return interaction.followUp({ 
        content: '❌ Verification data is incomplete. Please start over with /verify.', 
        ephemeral: true 
      });
    }
    
    console.log(`[INFO] Verifying Roblox username: ${pendingVerification.roblox_username} (ID: ${pendingVerification.roblox_user_id})`);
    
    // Get the user's current Roblox profile directly with userId if possible
    let userInfo;
    if (pendingVerification.roblox_user_id) {
      try {
        // Try to get user info by ID first
        const playerInfo = await noblox.getPlayerInfo(pendingVerification.roblox_user_id);
        if (playerInfo) {
          const avatarUrl = await getPlayerAvatar(pendingVerification.roblox_user_id);
          userInfo = {
            userId: pendingVerification.roblox_user_id,
            username: playerInfo.username,
            displayName: playerInfo.displayName, 
            blurb: playerInfo.blurb,
            joinDate: playerInfo.joinDate,
            age: playerInfo.age,
            avatarUrl: avatarUrl
          };
          console.log(`[INFO] Successfully retrieved user info by ID for ${userInfo.username}`);
        }
      } catch (idError) {
        console.error(`[ERROR] Failed to get user info by ID ${pendingVerification.roblox_user_id}:`, idError);
        // Will fall back to username lookup
      }
    }
    
    // If ID lookup failed, try username lookup
    if (!userInfo) {
      userInfo = await getUserInfo(pendingVerification.roblox_username);
    }
    
    if (!userInfo) {
      console.error(`[ERROR] Failed to find Roblox profile for ${pendingVerification.roblox_username}`);
      return interaction.followUp({ 
        content: '❌ Unable to find your Roblox profile. Please try again.', 
        ephemeral: true 
      });
    }
    
    console.log(`[INFO] User info retrieved:`, { 
      username: userInfo.username, 
      displayName: userInfo.displayName,
      userId: userInfo.userId,
      blurbLength: userInfo.blurb ? userInfo.blurb.length : 0
    });
    
    // Check if the verification code is in the profile description
    console.log(`[DEBUG] Starting verification polling for user ${pendingVerification.roblox_username} (${pendingVerification.roblox_user_id})`);
    console.log(`[DEBUG] Verification code to match: "${pendingVerification.code}"`);
    
    // First send a loading message
    await interaction.followUp({ 
      content: `⏳ Checking for verification code in your Roblox profile. We'll check every second for the next 30 seconds...`, 
      ephemeral: true 
    });
    
    // Set up polling (check every second for up to 30 seconds)
    const MAX_ATTEMPTS = 30;
    let attempts = 0;
    
    const checkProfile = async () => {
      attempts++;
      
      // Refresh the user info each time
      const refreshedUserInfo = await getUserInfo(pendingVerification.roblox_username);
      
      if (!refreshedUserInfo) {
        console.log(`[ERROR] Failed to fetch refreshed user info on attempt ${attempts}`);
        return false;
      }
      
      console.log(`[DEBUG] Attempt ${attempts}: Checking for code in blurb: "${refreshedUserInfo.blurb}"`);
      
      // More comprehensive matching
      // 1. Exact string match
      const exactMatch = refreshedUserInfo.blurb && refreshedUserInfo.blurb.includes(pendingVerification.code);
      
      // 2. Case insensitive match
      const blurbLower = refreshedUserInfo.blurb ? refreshedUserInfo.blurb.toLowerCase().trim() : '';
      const codeLower = pendingVerification.code.toLowerCase().trim();
      const caseInsensitiveMatch = blurbLower.includes(codeLower);
      
      // 3. Without spaces match
      const blurbNoSpaces = refreshedUserInfo.blurb ? refreshedUserInfo.blurb.replace(/\s+/g, '') : '';
      const codeNoSpaces = pendingVerification.code.replace(/\s+/g, '');
      const noSpacesMatch = blurbNoSpaces.includes(codeNoSpaces);
      
      // 4. Check if code might be broken up (e.g., "ABC 123" vs "ABC123")
      let brokenMatch = false;
      if (pendingVerification.code.length > 3) {
        const escapedCode = pendingVerification.code.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const flexibleRegex = new RegExp(escapedCode.split('').join('\\s*'), 'i');
        brokenMatch = flexibleRegex.test(refreshedUserInfo.blurb || '');
      }
      
      const isMatch = exactMatch || caseInsensitiveMatch || noSpacesMatch || brokenMatch;
      
      console.log(`[DEBUG] Attempt ${attempts} matches: exact=${exactMatch}, caseInsensitive=${caseInsensitiveMatch}, noSpaces=${noSpacesMatch}, broken=${brokenMatch}`);
      
      return isMatch;
    };
    
    // Try once immediately
    let verified = await checkProfile();
    
    // If not verified, start polling
    if (!verified) {
      for (let i = 0; i < MAX_ATTEMPTS; i++) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        verified = await checkProfile();
        if (verified) break;
      }
    }
    
    if (!verified) {
      console.log(`[INFO] Verification failed after ${attempts} attempts. Code not found in profile.`);
      return interaction.followUp({ 
        content: `❌ Verification code not found in your Roblox profile description after ${attempts} attempts. 

Make sure:
1. You've copied the exact code: \`${pendingVerification.code}\`
2. It's in your Roblox profile description (About Me)
3. There are no extra spaces or characters
4. You've saved your profile after adding the code
5. Try refreshing your Roblox profile page

You can try the command again if you need more time.`, 
        ephemeral: true 
      });
    }
    
    // If we got here, verification successful
    console.log(`[INFO] Verification successful after ${attempts} attempts!`);
    
    console.log(`[INFO] Verification code found in blurb, proceeding with verification for user ${userId}`);
    
    // Verification successful, store the verified user
    await setVerifiedUser(userId, {
      robloxUserId: userInfo.userId,
      robloxUsername: userInfo.username
    });
    
    // Clean up
    await removePendingVerification(userId);
    
    // Update the user's nickname on the Discord server
    try {
      const member = interaction.member;
      await member.setNickname(userInfo.displayName || userInfo.username);
      console.log(`[INFO] Updated nickname for user ${userId} to ${userInfo.displayName || userInfo.username}`);
    } catch (error) {
      console.error(`[ERROR] Failed to update nickname for ${interaction.user.tag}:`, error);
      // Continue with verification even if nickname update fails
    }
    
    // Create a success embed
    const successEmbed = new EmbedBuilder()
      .setTitle('Verification Successful')
      .setColor('#43b581')
      .setDescription(`You have successfully verified as ${userInfo.username} on Roblox!`)
      .setFooter({ text: 'You can now use all bot features' });
    
    // Add user avatar if available
    if (userInfo.avatarUrl) {
      successEmbed.setThumbnail(userInfo.avatarUrl);
    }
    
    // Disable the verify button
    const disabledButton = new ButtonBuilder()
      .setCustomId(`verify_disabled`)
      .setLabel('Verified')
      .setStyle(ButtonStyle.Success)
      .setDisabled(true);
    
    const updatedRow = new ActionRowBuilder().addComponents(disabledButton);
    
    // Edit the original message
    await interaction.editReply({
      embeds: [successEmbed],
      components: [updatedRow]
    });
    
    console.log(`[INFO] Verification completed successfully for user ${userId} as ${userInfo.username}`);
  }
};
