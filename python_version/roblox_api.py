import os
import logging
import aiohttp
import asyncio
from ro_py.client import Client

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
            cls._client = Client()
            cls._client.set_cookie(cookie)
            
            # Get current user to check if authentication worked
            try:
                current_user = await cls._client.get_authenticated_user()
                
                if current_user:
                    logger.info(f"Logged into Roblox as {current_user.name} (ID: {current_user.id})")
                    logger.info("Successfully authenticated with Roblox")
                    return True
                else:
                    logger.error("Failed to authenticate with Roblox")
                    return False
            except Exception as auth_error:
                logger.error(f"Authentication error: {auth_error}")
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
                
            # Get user details
            display_name = await user.get_display_name()
            created = await user.get_created_at()
                
            return {
                'id': user.id,
                'username': user.name,
                'displayName': display_name,
                'created': created.strftime('%Y-%m-%d') if created else 'Unknown'
            }
        except Exception as e:
            logger.error(f"Error getting user info: {e}")
            return None
    
    @classmethod
    async def get_player_avatar(cls, user_id):
        """Get player's avatar URL"""
        try:
            user = await cls._client.get_user(int(user_id))
            avatar = await user.get_avatar_image()
            return avatar.image_url
        except Exception as e:
            logger.error(f"Error getting player avatar: {e}")
            return None
    
    @classmethod
    async def check_blacklisted_groups(cls, user_id, blacklisted_groups):
        """Check if user is in any blacklisted groups"""
        try:
            user = await cls._client.get_user(int(user_id))
            # Get user's groups
            user_groups = await user.get_group_memberships()
            
            found_groups = []
            for group_id, membership in user_groups.items():
                if str(group_id) in blacklisted_groups:
                    group = membership.group
                    role = membership.role
                    found_groups.append({
                        'id': group.id,
                        'name': group.name,
                        'role': role.name
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
            
            # Get member's current role
            try:
                member = await group.get_member(int(user_id))
                old_role = member.role
            except Exception:
                return {
                    'success': False,
                    'error': 'User is not in the group'
                }
            
            # Get the role object by ID
            roles = await group.get_roles()
            target_role = None
            for role in roles:
                if role.rank == int(rank_id):
                    target_role = role
                    break
                    
            if not target_role:
                return {
                    'success': False,
                    'error': f'Role with rank ID {rank_id} not found'
                }
            
            # Set the new rank
            await group.set_member_role(int(user_id), target_role)
            
            # Get updated role
            updated_member = await group.get_member(int(user_id))
            
            return {
                'success': True,
                'username': updated_member.user.name,
                'oldRole': old_role.name,
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
            
            try:
                member = await group.get_member(int(user_id))
            except Exception:
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