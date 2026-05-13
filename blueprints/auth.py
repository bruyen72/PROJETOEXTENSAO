from flask import Blueprint, render_template, request, redirect, url_for, flash
from flask_login import login_user, logout_user, login_required, current_user
from models import db, Usuario

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('os.dashboard'))

    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        senha = request.form.get('senha', '')
        remember = bool(request.form.get('remember'))

        usuario = Usuario.query.filter_by(email=email, ativo=True).first()
        if usuario and usuario.check_senha(senha):
            login_user(usuario, remember=remember)
            next_page = request.args.get('next')
            return redirect(next_page or url_for('os.dashboard'))

        flash('E-mail ou senha incorretos.', 'danger')

    return render_template('login.html')


@auth_bp.route('/logout')
@login_required
def logout():
    logout_user()
    flash('Sessão encerrada.', 'info')
    return redirect(url_for('auth.login'))


@auth_bp.route('/register', methods=['GET', 'POST'])
@login_required
def register():
    if current_user.perfil != 'admin':
        flash('Apenas administradores podem cadastrar usuários.', 'danger')
        return redirect(url_for('os.dashboard'))

    if request.method == 'POST':
        nome   = request.form.get('nome', '').strip()
        email  = request.form.get('email', '').strip()
        senha  = request.form.get('senha', '')
        perfil = request.form.get('perfil', 'tecnico')

        if Usuario.query.filter_by(email=email).first():
            flash('E-mail já cadastrado.', 'warning')
        else:
            u = Usuario(nome=nome, email=email, perfil=perfil)
            u.set_senha(senha)
            db.session.add(u)
            db.session.commit()
            flash(f'Usuário {nome} cadastrado com sucesso.', 'success')
            return redirect(url_for('os.dashboard'))

    return render_template('auth/register.html')
