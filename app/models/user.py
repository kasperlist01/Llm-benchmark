from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app import db, login_manager


class User(UserMixin, db.Model):
    __tablename__ = 'user'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(128))

    models = db.relationship('UserModel', backref='owner', lazy='dynamic')
    api_integrations = db.relationship('ApiIntegration', backref='owner', lazy='dynamic')
    settings = db.relationship('UserSettings', backref='user', uselist=False)

    def __repr__(self):
        return f'<User {self.username}>'

    def set_password(self, password):
        self.password_hash = generate_password_hash(password, method='pbkdf2:sha256')

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def get_or_create_settings(self):
        if not self.settings:
            from app.models.user_settings import UserSettings
            settings = UserSettings(user_id=self.id)
            db.session.add(settings)
            db.session.commit()
            return settings
        return self.settings


@login_manager.user_loader
def load_user(id):
    return User.query.get(int(id))
