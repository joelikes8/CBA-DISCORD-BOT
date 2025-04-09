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
    
    // Make sure we have a username
    if (!pendingVerification.robloxUsername) {
      console.error(`[ERROR] Missing Roblox username in pending verification for user ${userId}`);
      return interaction.followUp({ 
        content: '❌ Verification data is incomplete. Please start over with /verify.', 
        ephemeral: true 
      });
    }
    
    console.log(`[INFO] Verifying Roblox username: ${pendingVerification.robloxUsername} (ID: ${pendingVerification.robloxUserId})`);
    
    // Get the user's current Roblox profile directly with userId if possible
    let userInfo;
    if (pendingVerification.robloxUserId) {
      try {
        // Try to get user info by ID first
        const playerInfo = await noblox.getPlayerInfo(pendingVerification.robloxUserId);
        if (playerInfo) {
          const avatarUrl = await getPlayerAvatar(pendingVerification.robloxUserId);
          userInfo = {
            userId: pendingVerification.robloxUserId,
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
        console.error(`[ERROR] Failed to get user info by ID ${pendingVerification.robloxUserId}:`, idError);
        // Will fall back to username lookup
      }
    }
    
    // If ID lookup failed, try username lookup
    if (!userInfo) {
      userInfo = await getUserInfo(pendingVerification.robloxUsername);
    }
    
    if (!userInfo) {
      console.error(`[ERROR] Failed to find Roblox profile for ${pendingVerification.robloxUsername}`);
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
    if (!userInfo.blurb || !userInfo.blurb.includes(pendingVerification.code)) {
      console.log(`[INFO] Verification code ${pendingVerification.code} not found in blurb: ${userInfo.blurb?.substring(0, 50)}...`);
      return interaction.followUp({ 
        content: `❌ Verification code not found in your Roblox profile description. Please make sure you've added code \`${pendingVerification.code}\` to your description and try again.`, 
        ephemeral: true 
      });
    }
    
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
