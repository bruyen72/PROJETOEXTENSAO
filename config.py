import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY    = os.environ.get('SECRET_KEY', 'gerenciador-os-dev-2026-change-me')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB


class SQLiteConfig(Config):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'gerenciador_os.db')}"
    DEBUG = True


class SupabaseConfig(Config):
    """
    Lê DATABASE_URL do ambiente (Render env var).
    Formato Supabase Transaction Pooler:
      postgresql://postgres.REF:SENHA@aws-0-REGIAO.pooler.supabase.com:6543/postgres
    """
    raw = os.environ.get('DATABASE_URL', '')
    # SQLAlchemy exige postgresql:// (não postgres://)
    SQLALCHEMY_DATABASE_URI = raw.replace('postgres://', 'postgresql://', 1) if raw else ''
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,
        'pool_recycle':  300,
        'connect_args':  {'sslmode': 'require'},
    }
    DEBUG = False


# ── Seleciona config ativa ──────────────────────────────────
# Se DATABASE_URL estiver definida → usa Supabase; senão → SQLite (dev local)
ActiveConfig = SupabaseConfig if os.environ.get('DATABASE_URL') else SQLiteConfig
