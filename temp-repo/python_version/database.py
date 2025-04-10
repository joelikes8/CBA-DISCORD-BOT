import os
import logging
import psycopg2
from psycopg2 import pool

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger('database')

class Database:
    """Database connection class for PostgreSQL"""
    
    _connection_pool = None
    
    @classmethod
    def initialize(cls):
        """Initialize the database connection pool"""
        try:
            database_url = os.getenv('DATABASE_URL')
            if not database_url:
                logger.error("DATABASE_URL environment variable not set")
                return False
                
            cls._connection_pool = pool.SimpleConnectionPool(
                1, 10, database_url
            )
            
            logger.info("PostgreSQL connection pool created")
            
            # Initialize database tables
            cls._initialize_tables()
            
            return True
        except Exception as e:
            logger.error(f"Error initializing database: {e}")
            return False
    
    @classmethod
    def _initialize_tables(cls):
        """Create necessary tables if they don't exist"""
        with cls.get_connection() as conn:
            with conn.cursor() as cursor:
                # Create verified users table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS verified_users (
                        discord_id VARCHAR(255) PRIMARY KEY,
                        roblox_id VARCHAR(255) NOT NULL,
                        roblox_username VARCHAR(255) NOT NULL,
                        verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create verification codes table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS verification_codes (
                        discord_id VARCHAR(255) PRIMARY KEY,
                        code VARCHAR(255) NOT NULL,
                        roblox_username VARCHAR(255),
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create blacklisted groups table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS blacklisted_groups (
                        group_id VARCHAR(255) PRIMARY KEY,
                        added_by VARCHAR(255),
                        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create warnings table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS warnings (
                        id SERIAL PRIMARY KEY,
                        guild_id VARCHAR(255) NOT NULL,
                        user_id VARCHAR(255) NOT NULL,
                        warning_text TEXT NOT NULL,
                        warned_by VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                # Create tryout channels table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tryout_channels (
                        guild_id VARCHAR(255) PRIMARY KEY,
                        channel_id VARCHAR(255) NOT NULL
                    )
                """)
                
                # Create tryout logs table
                cursor.execute("""
                    CREATE TABLE IF NOT EXISTS tryout_logs (
                        id SERIAL PRIMARY KEY,
                        roblox_username VARCHAR(255) NOT NULL,
                        session_type VARCHAR(255) NOT NULL,
                        result VARCHAR(255) NOT NULL,
                        notes TEXT,
                        logged_by VARCHAR(255) NOT NULL,
                        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                    )
                """)
                
                conn.commit()
                logger.info("Database tables initialized")
    
    @classmethod
    def get_connection(cls):
        """Get a connection from the pool"""
        return cls._connection_pool.getconn()
    
    @classmethod
    def return_connection(cls, connection):
        """Return a connection to the pool"""
        cls._connection_pool.putconn(connection)
    
    @classmethod
    def close_all(cls):
        """Close all connections in the pool"""
        cls._connection_pool.closeall()
        logger.info("All database connections closed")

# Example usage functions that would be implemented in full version
async def get_verified_user(discord_id):
    """Get a verified user by Discord ID"""
    pass

async def set_verified_user(discord_id, roblox_info):
    """Set a user as verified"""
    pass

async def get_verification_code(discord_id):
    """Get verification code for a user"""
    pass

async def set_verification_code(discord_id, code, roblox_username):
    """Set verification code for a user"""
    pass