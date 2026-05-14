from flask import Blueprint, render_template
from flask_login import login_required

notif_views_bp = Blueprint('notif_page', __name__)


@notif_views_bp.route('/')
@login_required
def lista():
    return render_template('notificacoes/lista.html')
