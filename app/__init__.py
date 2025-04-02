# app/__init__.py
from flask import Flask
from app.config import Config

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Import routes after app creation to avoid circular imports
    from app.routes import main_bp
    app.register_blueprint(main_bp)

    return app
