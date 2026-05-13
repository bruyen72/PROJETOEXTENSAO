import os
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = os.path.abspath(os.path.dirname(__file__))


class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'gerenciador-os-dev-2026-change-me')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'static', 'uploads')
    MAX_CONTENT_LENGTH = 20 * 1024 * 1024  # 20 MB


class SQLiteConfig(Config):
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(BASE_DIR, 'gerenciador_os.db')}"
    DEBUG = True


class MySQLConfig(Config):
    _user = os.environ.get('DB_USER', 'root')
    _pass = os.environ.get('DB_PASS', '')
    _host = os.environ.get('DB_HOST', 'localhost')
    _name = os.environ.get('DB_NAME', 'gerenciador_os')
    SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{_user}:{_pass}@{_host}/{_name}?charset=utf8mb4"
    DEBUG = False


# Troque para MySQLConfig quando tiver MySQL configurado
ActiveConfig = SQLiteConfig
