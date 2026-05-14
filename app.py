import os
from flask import Flask, render_template, jsonify, redirect, url_for
from flask_login import LoginManager, current_user
from flask_migrate import Migrate
from config import ActiveConfig
from models import db, Usuario

login_manager = LoginManager()
migrate = Migrate()


def create_app(config=None):
    app = Flask(__name__)
    app.config.from_object(config or ActiveConfig)

    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

    db.init_app(app)
    login_manager.init_app(app)
    migrate.init_app(app, db)

    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Faça login para continuar.'
    login_manager.login_message_category = 'warning'

    # ── Blueprints ────────────────────────────────────────
    from blueprints.auth              import auth_bp
    from blueprints.os_routes         import os_bp
    from blueprints.cliente_routes    import cliente_bp
    from blueprints.cliente_views     import cliente_views_bp
    from blueprints.notificacao_routes import notificacao_bp
    from blueprints.notif_views       import notif_views_bp
    from blueprints.usuario_routes    import usuario_bp
    from blueprints.relatorio_routes  import relatorio_bp
    from blueprints.sync_routes       import sync_bp

    # Páginas HTML
    app.register_blueprint(auth_bp)
    app.register_blueprint(os_bp,            url_prefix='/api/os')
    app.register_blueprint(cliente_views_bp,  url_prefix='/clientes')
    app.register_blueprint(notif_views_bp,    url_prefix='/notificacoes')
    app.register_blueprint(usuario_bp,        url_prefix='/usuarios')

    # APIs JSON
    app.register_blueprint(cliente_bp,        url_prefix='/api/clientes')
    app.register_blueprint(notificacao_bp,    url_prefix='/api/notificacoes')
    app.register_blueprint(relatorio_bp,      url_prefix='/api/relatorios')
    app.register_blueprint(sync_bp,           url_prefix='/api/sync')

    # ── Raiz ──────────────────────────────────────────────
    @app.route('/')
    def index():
        if current_user.is_authenticated:
            return redirect(url_for('os.dashboard'))
        return redirect(url_for('auth.login'))

    # ── Erros ─────────────────────────────────────────────
    @app.errorhandler(404)
    def not_found(e):
        return render_template('errors/404.html'), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify({'erro': 'Acesso negado'}), 403

    # ── Inicialização do banco ────────────────────────────
    with app.app_context():
        try:
            db.create_all()
            _criar_admin_padrao()
            print("✓ Banco de dados inicializado com sucesso.")
        except Exception as e:
            print(f"✗ ERRO ao conectar ao banco: {e}")
            print("  Verifique a variável DB_PASS no Render.")

    return app


@login_manager.user_loader
def load_user(user_id):
    return db.session.get(Usuario, int(user_id))


def _criar_admin_padrao():
    if not Usuario.query.filter_by(email='admin@gerenciadoros.local').first():
        admin = Usuario(nome='Administrador', email='admin@gerenciadoros.local', perfil='admin')
        admin.set_senha('Admin@123')
        db.session.add(admin)
        db.session.commit()


if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)
