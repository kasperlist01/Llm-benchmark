# app/models/user_model.py
from app import db
from datetime import datetime


class UserModel(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    provider = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    api_url = db.Column(db.String(255))
    api_key = db.Column(db.String(255))
    color = db.Column(db.String(20), default="#808080")
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<UserModel {self.name}>'

    def to_dict(self):
        return {
            'id': f'custom_{self.id}',
            'name': self.name,
            'provider': self.provider,
            'type': 'custom',
            'description': self.description,
            'api_url': self.api_url,
            'api_key': self.api_key,  # Обычно API ключи не следует включать в словарь, но здесь он нужен для тестирования соединения
            'size': None,
            'color': self.color
        }