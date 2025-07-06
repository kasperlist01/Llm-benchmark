import os
from datetime import datetime, timezone

from app import db


class UserDataset(db.Model):
    __tablename__ = 'user_datasets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer)
    row_count = db.Column(db.Integer)
    column_count = db.Column(db.Integer)
    columns_info = db.Column(db.Text)
    format_validated = db.Column(db.Boolean, default=False)
    prompt_column = db.Column(db.String(100))
    reference_column = db.Column(db.String(100))
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)

    def __repr__(self):
        return f'<UserDataset {self.name}>'

    def to_dict(self):
        return {
            'id': f'dataset_{self.id}',
            'name': self.name,
            'description': self.description,
            'filename': self.filename,
            'file_size': self.file_size,
            'row_count': self.row_count,
            'column_count': self.column_count,
            'columns_info': self.columns_info,
            'format_validated': self.format_validated,
            'prompt_column': self.prompt_column,
            'reference_column': self.reference_column,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'type': 'user_dataset'
        }

    def get_file_size_human(self):
        if not self.file_size:
            return "Неизвестно"

        size = self.file_size
        for unit in ['Б', 'КБ', 'МБ', 'ГБ']:
            if size < 1024:
                return f"{size:.1f} {unit}"
            size /= 1024
        return f"{size:.1f} ТБ"

    def delete_file(self):
        try:
            if os.path.exists(self.file_path):
                os.remove(self.file_path)
                return True
        except Exception as e:
            print(f"Ошибка при удалении файла {self.file_path}: {str(e)}")
        return False
