# app/user/forms.py
from flask_wtf import FlaskForm
from wtforms import StringField, PasswordField, SubmitField, TextAreaField, URLField
from wtforms.validators import DataRequired, Length, EqualTo, ValidationError, Optional, URL
from app.models.user import User


class ChangePasswordForm(FlaskForm):
    current_password = PasswordField('Current Password', validators=[DataRequired()])
    new_password = PasswordField('New Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm New Password',
                                    validators=[DataRequired(), EqualTo('new_password')])
    submit = SubmitField('Change Password')


class AddModelForm(FlaskForm):
    name = StringField('Model Name', validators=[DataRequired(), Length(min=2, max=100)])
    provider = StringField('Provider', validators=[DataRequired(), Length(min=2, max=100)])
    description = TextAreaField('Description', validators=[Optional(), Length(max=255)])
    api_url = URLField('API URL', validators=[Optional(), URL()])
    api_key = StringField('API Key', validators=[Optional(), Length(max=255)])
    color = StringField('Color (Hex)', validators=[Optional(), Length(min=4, max=7)])
    submit = SubmitField('Add Model')
    test = SubmitField('Test Connection')