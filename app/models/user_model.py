from datetime import datetime, timezone

from app import db


class UserModel(db.Model):
    __tablename__ = 'user_models'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    color = db.Column(db.String(20), default="#808080")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    api_integration_id = db.Column(db.Integer, db.ForeignKey('api_integrations.id'), nullable=True)

    def __repr__(self):
        return f'<UserModel {self.name}>'

    def to_dict(self):
        integration = self.api_integration
        return {
            'id': f'custom_{self.id}',
            'name': self.name,
            'provider': integration.name if integration else 'No Integration',
            'type': 'custom',
            'description': self.description,
            'api_url': integration.api_url if integration else None,
            'api_key': integration.api_key if integration else None,
            'size': None,
            'color': self.color,
            'has_api': bool(integration and integration.is_active)
        }
