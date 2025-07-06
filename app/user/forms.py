from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileRequired, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, URLField, SelectField
from wtforms.validators import DataRequired, Length, EqualTo, Optional, URL


class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Текущий пароль', validators=[DataRequired()])
    new_password = PasswordField('Новый пароль', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Подтвердите новый пароль',
                                     validators=[DataRequired(), EqualTo('new_password')])
    submit = SubmitField('Изменить пароль')


class AddApiIntegrationForm(FlaskForm):
    name = StringField('Название интеграции', validators=[DataRequired(), Length(min=2, max=100)])
    api_url = URLField('URL API', validators=[DataRequired(), URL()])
    api_key = StringField('API ключ', validators=[DataRequired(), Length(max=500)])
    description = TextAreaField('Описание', validators=[Optional(), Length(max=255)])
    submit = SubmitField('Добавить интеграцию')


class AddModelForm(FlaskForm):
    name = StringField('Название модели', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Описание', validators=[Optional(), Length(max=255)])
    api_integration_id = SelectField('API интеграция', coerce=int, validators=[Optional()])
    color = StringField('Цвет (Hex)', validators=[Optional(), Length(min=4, max=7)])
    submit = SubmitField('Добавить модель')

    def __init__(self, user_id=None, *args, **kwargs):
        super(AddModelForm, self).__init__(*args, **kwargs)
        if user_id:
            from app.models.api_integration import ApiIntegration
            integrations = ApiIntegration.query.filter_by(user_id=user_id, is_active=True).all()
            choices = [(0, 'Без API интеграции')]
            choices.extend([(integration.id, integration.name) for integration in integrations])
            self.api_integration_id.choices = choices


class AddDatasetForm(FlaskForm):
    name = StringField('Название датасета', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Описание', validators=[Optional(), Length(max=255)])
    csv_file = FileField('CSV файл', validators=[
        FileRequired(),
        FileAllowed(['csv'], 'Только CSV файлы разрешены!')
    ])
    submit = SubmitField('Загрузить датасет')


class JudgeModelForm(FlaskForm):
    judge_model_id = SelectField('Модель-судья', coerce=int, validators=[Optional()])
    submit = SubmitField('Сохранить настройки')

    def __init__(self, user_id=None, current_judge_id=None, *args, **kwargs):
        super(JudgeModelForm, self).__init__(*args, **kwargs)
        if user_id:
            from app.models.user_model import UserModel
            from app.models.api_integration import ApiIntegration
            models = UserModel.query.join(ApiIntegration).filter(
                UserModel.user_id == user_id,
                UserModel.is_active == True,
                ApiIntegration.is_active == True
            ).all()
            choices = [(0, 'Модель-судья не выбрана')]
            for model in models:
                choices.append((model.id, model.name))
            self.judge_model_id.choices = choices
