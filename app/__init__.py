from flask import Flask
from flask_login import LoginManager
from flask_sqlalchemy import SQLAlchemy

from app.config import Config

db = SQLAlchemy()
login_manager = LoginManager()
login_manager.login_view = 'auth.login'
login_manager.login_message = 'Пожалуйста, войдите в систему для доступа к этой странице.'
login_manager.login_message_category = 'info'


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    db.init_app(app)
    login_manager.init_app(app)

    from app.routes import main_bp
    app.register_blueprint(main_bp)

    from app.auth.routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')

    from app.user.routes import user_bp
    app.register_blueprint(user_bp, url_prefix='/user')

    with app.app_context():
        from app.models import user, user_model, api_integration, user_settings, user_dataset
        db.create_all()

    return app
