from app import db


class UserSettings(db.Model):
    __tablename__ = 'user_settings'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False, unique=True)
    judge_model_id = db.Column(db.Integer, db.ForeignKey('user_models.id'), nullable=True)

    judge_model = db.relationship('UserModel', foreign_keys=[judge_model_id])

    def __repr__(self):
        return f'<UserSettings {self.user_id}>'
