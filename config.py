import os
from dotenv import load_dotenv
from sqlalchemy.engine import URL

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY    = os.environ.get('SECRET_KEY', 'gerenciador-os-dev-2026-change-me')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024


class SQLiteConfig(Config):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'gerenciador_os.db')}"
    DEBUG = True


class SupabaseConfig(Config):
    # Monta a URL usando SQLAlchemy — trata qualquer caractere especial na senha
    SQLALCHEMY_DATABASE_URI = URL.create(
        drivername = 'postgresql+psycopg2',
        username   = os.environ.get('DB_USER', 'postgres'),
        password   = os.environ.get('DB_PASS', ''),
        host       = os.environ.get('DB_HOST', ''),
        port       = int(os.environ.get('DB_PORT', '5432')),
        database   = os.environ.get('DB_NAME', 'postgres'),
    )
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle':  300,
        'connect_args':  {'sslmode': 'require'},
    }
    DEBUG = False


# Se DB_HOST estiver definido → Supabase; senão → SQLite local
ActiveConfig = SupabaseConfig if os.environ.get('DB_HOST') else SQLiteConfig
