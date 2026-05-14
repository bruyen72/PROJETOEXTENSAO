import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY    = os.environ.get('SECRET_KEY', 'gerenciador-os-2026-xK9mP3qR')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024


class SQLiteConfig(Config):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'gerenciador_os.db')}"
    DEBUG = True


class SupabaseConfig(Config):
    SQLALCHEMY_DATABASE_URI = URL.create(
        drivername = 'postgresql+psycopg2',
        username   = 'postgres.aiugalructdnxrcrqnhj',
        password   = os.environ.get('DB_PASS', ''),
        host       = 'aws-1-sa-east-1.pooler.supabase.com',
        port       = 6543,
        database   = 'postgres',
        query      = {'sslmode': 'require'},
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle':  300,
    }
    DEBUG = False


ActiveConfig = SupabaseConfig if os.environ.get('DB_PASS') else SQLiteConfig
