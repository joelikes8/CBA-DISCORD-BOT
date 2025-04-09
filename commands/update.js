const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { getVerifiedUser } = require('../utils/database');
const { getUserInfo, getUserRank, rankUser } = require('../utils/robloxAPI');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('update')
    .setDescription('Update Discord nickname and role to match Roblox rank')
    .addSubcommand(subcommand =>
      subcommand
        .setName('me')
        .setDescription('Update your own Discord nickname and role to match your Roblox rank'))
    .addSubcommand(subcommand =>
      subcommand
        .setName('member')
        .setDescription('Update a member\'s Discord nickname and rank in Roblox (Admins only)')
        .addUserOption(option =>
          option.setName('user')
            .setDescription('The Discord user to update')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('rank')
            .setDescription('The Roblox rank name to give the user (leave blank to only update Discord)')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('username')
        .setDescription('Update a Roblox user\'s rank directly (Admins only)')
        .addStringOption(option =>
          option.setName('username')
            .setDescription('The Roblox username to update')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('rank')
            .setDescription('The Roblox rank name to give the user')
            .setRequired(true))),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });
    
    const subcommand = interaction.options.getSubcommand();
    
    if (subcommand === 'me') {
      return this.updateSelf(interaction);
    } 
    else if (subcommand === 'member') {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
          !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply({ 
          content: '❌ You do not have permission to update other members.', 
          ephemeral: true 
        });
      }
      
      const targetUser = interaction.options.getUser('user');
      const rankName = interaction.options.getString('rank');
      return this.updateMember(interaction, targetUser, rankName);
    }
    else if (subcommand === 'username') {
      // Check if user has permission
      if (!interaction.member.permissions.has(PermissionFlagsBits.Administrator) && 
          !interaction.member.permissions.has(PermissionFlagsBits.ManageRoles)) {
        return interaction.editReply({ 
          content: '❌ You do not have permission to update Roblox ranks.', 
          ephemeral: true 
        });
      }
      
      const robloxUsername = interaction.options.getString('username');
      const rankName = interaction.options.getString('rank');
      return this.updateByUsername(interaction, robloxUsername, rankName);
    }
  },
  
  async updateSelf(interaction) {
    try {
      console.log(`[INFO] User ${interaction.user.tag} (${interaction.user.id}) is updating their rank`);
      
      // Check if the user is verified
      const verifiedData = await getVerifiedUser(interaction.user.id);
      if (!verifiedData) {
        return interaction.editReply({ 
          content: '❌ You are not verified yet! Please use the `/verify` command first.', 
          ephemeral: true 
        });
      }
      
      console.log(`[INFO] Found verified data for ${interaction.user.tag}: ${JSON.stringify(verifiedData)}`);
      
      // Get the user's Roblox information
      const userInfo = await getUserInfo(verifiedData.robloxUsername);
      if (!userInfo) {
        return interaction.editReply({ 
          content: '❌ Failed to fetch your Roblox information. Please try again later.', 
          ephemeral: true 
        });
      }
      
      // Get the user's rank in the group
      const rankInfo = await getUserRank(verifiedData.robloxUserId);
      if (rankInfo.error) {
        return interaction.editReply({ 
          content: `❌ An error occurred: ${rankInfo.error}`, 
          ephemeral: true 
        });
      }
      
      if (!rankInfo.inGroup) {
        return interaction.editReply({ 
          content: '❌ You are not in the Roblox group. Please join the group first.', 
          ephemeral: true 
        });
      }
      
      try {
        // Update the user's nickname
        const newNickname = `${userInfo.displayName || userInfo.username} [${rankInfo.rankName}]`;
        await interaction.member.setNickname(newNickname);
        console.log(`[INFO] Updated nickname for ${interaction.user.tag} to "${newNickname}"`);
        
        // You would also update roles here based on their Roblox rank
        // This depends on the specific roles set up in your Discord server
        // TODO: Add role update logic based on rankInfo.rankName
        
        const embed = new EmbedBuilder()
          .setTitle('Rank Update Successful')
          .setColor('#43b581')
          .setDescription(`Your Discord profile has been updated to match your Roblox rank.`)
          .addFields(
            { name: 'Roblox Username', value: userInfo.username, inline: true },
            { name: 'Group Rank', value: rankInfo.rankName, inline: true },
            { name: 'Updated Nickname', value: newNickname, inline: true }
          )
          .setFooter({ text: 'Use this command again if your rank changes in the future' });
        
        if (userInfo.avatarUrl) {
          embed.setThumbnail(userInfo.avatarUrl);
        }
        
        return interaction.editReply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error(`[ERROR] Failed to update user ${interaction.user.tag}:`, error);
        return interaction.editReply({ 
          content: `❌ Failed to update your nickname: ${error.message}. I may not have permission to change your nickname.`, 
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error(`[ERROR] Error in updateSelf:`, error);
      return interaction.editReply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  },
  
  async updateMember(interaction, targetUser, rankName = null) {
    try {
      console.log(`[INFO] Admin ${interaction.user.tag} is updating member ${targetUser.tag}${rankName ? ` to rank ${rankName}` : ''}`);
      
      // Check if the target user is verified
      const verifiedData = await getVerifiedUser(targetUser.id);
      if (!verifiedData) {
        return interaction.editReply({ 
          content: `❌ ${targetUser.tag} is not verified yet! They need to use the /verify command first.`, 
          ephemeral: true 
        });
      }
      
      // Get the user's Roblox information
      const userInfo = await getUserInfo(verifiedData.robloxUsername);
      if (!userInfo) {
        return interaction.editReply({ 
          content: `❌ Failed to fetch Roblox information for ${targetUser.tag}.`, 
          ephemeral: true 
        });
      }
      
      // Variables to store results
      let rankResult = null;
      let rankInfo = null;
      
      // If a rank was specified, update their Roblox rank
      if (rankName) {
        rankResult = await rankUser(verifiedData.robloxUserId, rankName);
        if (!rankResult.success) {
          return interaction.editReply({ 
            content: `❌ Failed to update Roblox rank: ${rankResult.error}`, 
            ephemeral: true 
          });
        }
        
        // Use the new rank info
        rankInfo = {
          rankName: rankResult.rankName,
          rankId: rankResult.rankId,
          inGroup: true
        };
        
        console.log(`[INFO] Successfully ranked ${userInfo.username} to ${rankResult.rankName}`);
      } else {
        // Just get their current rank
        rankInfo = await getUserRank(verifiedData.robloxUserId);
        if (rankInfo.error) {
          return interaction.editReply({ 
            content: `❌ An error occurred while getting user rank: ${rankInfo.error}`, 
            ephemeral: true 
          });
        }
        
        if (!rankInfo.inGroup) {
          return interaction.editReply({ 
            content: `❌ ${userInfo.username} is not in the Roblox group.`, 
            ephemeral: true 
          });
        }
      }
      
      // Update Discord nickname
      try {
        const member = await interaction.guild.members.fetch(targetUser.id);
        const newNickname = `${userInfo.displayName || userInfo.username} [${rankInfo.rankName}]`;
        await member.setNickname(newNickname);
        
        console.log(`[INFO] Updated nickname for ${targetUser.tag} to "${newNickname}"`);
        
        // TODO: Update Discord roles based on Roblox rank
        
        // Create response embed
        const embed = new EmbedBuilder()
          .setTitle('Member Update Successful')
          .setColor('#43b581')
          .addFields(
            { name: 'Roblox Username', value: userInfo.username, inline: true },
            { name: 'Discord User', value: targetUser.tag, inline: true },
            { name: 'Group Rank', value: rankInfo.rankName, inline: true },
            { name: 'Updated Nickname', value: newNickname, inline: true }
          );
        
        if (rankResult && rankResult.success) {
          embed.setDescription(`You have successfully updated ${targetUser.tag}'s Roblox rank and Discord nickname.`);
        } else {
          embed.setDescription(`You have successfully updated ${targetUser.tag}'s Discord nickname to match their Roblox rank.`);
        }
        
        if (userInfo.avatarUrl) {
          embed.setThumbnail(userInfo.avatarUrl);
        }
        
        return interaction.editReply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error(`[ERROR] Failed to update member ${targetUser.tag}:`, error);
        
        // If we updated their Roblox rank but failed on Discord, still show success for the Roblox part
        if (rankResult && rankResult.success) {
          const embed = new EmbedBuilder()
            .setTitle('Partial Update Success')
            .setColor('#F7C94B')
            .setDescription(`Successfully updated Roblox rank, but failed to update Discord nickname.`)
            .addFields(
              { name: 'Roblox Username', value: userInfo.username, inline: true },
              { name: 'New Group Rank', value: rankInfo.rankName, inline: true },
              { name: 'Error', value: error.message, inline: false }
            );
          
          if (userInfo.avatarUrl) {
            embed.setThumbnail(userInfo.avatarUrl);
          }
          
          return interaction.editReply({ embeds: [embed], ephemeral: true });
        }
        
        return interaction.editReply({ 
          content: `❌ Failed to update nickname for ${targetUser.tag}: ${error.message}`, 
          ephemeral: true 
        });
      }
    } catch (error) {
      console.error(`[ERROR] Error in updateMember:`, error);
      return interaction.editReply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  },
  
  async updateByUsername(interaction, robloxUsername, rankName) {
    try {
      console.log(`[INFO] Admin ${interaction.user.tag} is updating Roblox user ${robloxUsername} to rank ${rankName}`);
      
      // Get the Roblox user info
      const userInfo = await getUserInfo(robloxUsername);
      if (!userInfo) {
        return interaction.editReply({ 
          content: `❌ Could not find Roblox user "${robloxUsername}". Please check the spelling and try again.`, 
          ephemeral: true 
        });
      }
      
      // Update the user's rank
      const rankResult = await rankUser(userInfo.userId, rankName);
      if (!rankResult.success) {
        return interaction.editReply({ 
          content: `❌ Failed to update rank: ${rankResult.error}`, 
          ephemeral: true 
        });
      }
      
      console.log(`[INFO] Successfully ranked ${userInfo.username} to ${rankResult.rankName}`);
      
      // Create success embed
      const embed = new EmbedBuilder()
        .setTitle('Rank Update Successful')
        .setColor('#43b581')
        .setDescription(`Successfully updated Roblox rank for ${userInfo.username}.`)
        .addFields(
          { name: 'Roblox Username', value: userInfo.username, inline: true },
          { name: 'Roblox ID', value: userInfo.userId.toString(), inline: true },
          { name: 'New Rank', value: rankResult.rankName, inline: true }
        );
      
      if (userInfo.avatarUrl) {
        embed.setThumbnail(userInfo.avatarUrl);
      }
      
      return interaction.editReply({ embeds: [embed], ephemeral: true });
    } catch (error) {
      console.error(`[ERROR] Error in updateByUsername:`, error);
      return interaction.editReply({ 
        content: `❌ An unexpected error occurred: ${error.message}`, 
        ephemeral: true 
      });
    }
  }
};
