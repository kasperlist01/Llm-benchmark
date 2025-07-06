from datetime import datetime, timezone

from app import db


class ApiIntegration(db.Model):
    __tablename__ = 'api_integrations'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    api_url = db.Column(db.String(500), nullable=False)
    api_key = db.Column(db.String(500), nullable=False)
    description = db.Column(db.Text)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    models = db.relationship('UserModel', backref='api_integration', lazy='dynamic')

    def __repr__(self):
        return f'<ApiIntegration {self.name}>'

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'api_url': self.api_url,
            'api_key': self.api_key,
            'description': self.description,
            'is_active': self.is_active,
            'models_count': self.models.count()
        }
