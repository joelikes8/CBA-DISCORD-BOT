import os
import logging
import aiohttp
import asyncio
from roblox import client

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('roblox_api')

class RobloxAPI:
    """Roblox API handler class"""
    
    _client = None
    _group_id = None
    
    @classmethod
    async def initialize(cls):
        """Initialize Roblox client"""
        try:
            # Get Roblox cookie and group ID from environment
            cookie = os.getenv('ROBLOX_COOKIE')
            cls._group_id = os.getenv('ROBLOX_GROUP_ID')
            
            if not cookie:
                logger.error("ROBLOX_COOKIE environment variable not set")
                return False
                
            if not cls._group_id:
                logger.error("ROBLOX_GROUP_ID environment variable not set")
                return False
            
            # Create Roblox client
            cls._client = client.Client(cookie)
            await cls._client.auth_from_cookie()
            
            # Get current user to check if authentication worked
            current_user = await cls._client.get_authenticated_user()
            
            if current_user:
                logger.info(f"Logged into Roblox as {current_user.name} ({current_user.id})")
                logger.info("Successfully authenticated with Roblox")
                return True
            else:
                logger.error("Failed to authenticate with Roblox")
                return False
                
        except Exception as e:
            logger.error(f"Error initializing Roblox API: {e}")
            return False
    
    @classmethod
    async def get_user_info(cls, username):
        """Get user info by username"""
        try:
            user = await cls._client.get_user_by_username(username)
            if not user:
                return None
                
            return {
                'id': user.id,
                'username': user.name,
                'displayName': user.display_name,
                'created': user.created.strftime('%Y-%m-%d')
            }
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return None
    
    @classmethod
    async def get_player_avatar(cls, user_id):
        """Get player's avatar URL"""
        try:
            user = await cls._client.get_user(user_id)
            avatar_url = await user.get_thumbnail()
            return avatar_url
        except Exception as e:
            logger.error(f"Error getting player avatar: {e}")
            return None
    
    @classmethod
    async def check_blacklisted_groups(cls, user_id, blacklisted_groups):
        """Check if user is in any blacklisted groups"""
        try:
            user = await cls._client.get_user(user_id)
            user_groups = await user.get_group_roles()
            
            found_groups = []
            for group in user_groups:
                if str(group.group.id) in blacklisted_groups:
                    found_groups.append({
                        'id': group.group.id,
                        'name': group.group.name,
                        'role': group.name
                    })
            
            return {
                'inBlacklistedGroup': len(found_groups) > 0,
                'groups': found_groups
            }
        except Exception as e:
            logger.error(f"Error checking blacklisted groups: {e}")
            return {
                'inBlacklistedGroup': False,
                'groups': [],
                'error': str(e)
            }
    
    @classmethod
    async def rank_user(cls, user_id, rank_id):
        """Rank user in Roblox group"""
        try:
            group = await cls._client.get_group(int(cls._group_id))
            member = await group.get_member_by_id(user_id)
            
            if not member:
                return {
                    'success': False,
                    'error': 'User is not in the group'
                }
            
            # Set rank by ID
            await group.set_rank_by_id(user_id, int(rank_id))
            
            # Get updated info
            updated_member = await group.get_member_by_id(user_id)
            
            return {
                'success': True,
                'username': updated_member.user.name,
                'oldRole': member.role.name,
                'newRole': updated_member.role.name
            }
        except Exception as e:
            logger.error(f"Error ranking user: {e}")
            return {
                'success': False,
                'error': str(e)
            }
    
    @classmethod
    async def get_user_rank(cls, user_id):
        """Get user's current rank in the group"""
        try:
            group = await cls._client.get_group(int(cls._group_id))
            member = await group.get_member_by_id(user_id)
            
            if not member:
                return {
                    'success': False,
                    'error': 'User is not in the group'
                }
            
            return {
                'success': True,
                'username': member.user.name,
                'role': member.role.name,
                'roleId': member.role.rank,
                'groupId': group.id,
                'groupName': group.name
            }
        except Exception as e:
            logger.error(f"Error getting user rank: {e}")
            return {
                'success': False,
                'error': str(e)
            }