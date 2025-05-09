# app/user/routes.py
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from app import db
from app.user.forms import ChangePasswordForm, AddModelForm
from app.models.user_model import UserModel
from app.services.model_service import test_model_connection

user_bp = Blueprint('user', __name__)


@user_bp.route('/settings')
@login_required
def settings():
    """User settings page"""
    password_form = ChangePasswordForm()
    return render_template('user/settings.html', title='Настройки пользователя',
                           password_form=password_form)


@user_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
    """Change user password"""
    form = ChangePasswordForm()
    if form.validate_on_submit():
        if current_user.check_password(form.current_password.data):
            current_user.set_password(form.new_password.data)
            db.session.commit()
            flash('Ваш пароль был обновлен!', 'success')
            return redirect(url_for('user.settings'))
        else:
            flash('Текущий пароль неверен', 'danger')

    for field, errors in form.errors.items():
        for error in errors:
            flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.settings'))


@user_bp.route('/models')
@login_required
def models():
    """Manage user's custom models"""
    form = AddModelForm()
    user_models = UserModel.query.filter_by(user_id=current_user.id).all()
    return render_template('user/models.html', title='Мои модели',
                           form=form, models=user_models)


@user_bp.route('/models/add', methods=['POST'])
@login_required
def add_model():
    """Add a new custom model"""
    form = AddModelForm()
    if form.validate_on_submit():
        # Если была нажата кнопка тестирования, сначала проверяем соединение
        if 'test' in request.form:
            if form.api_url.data:
                result = test_model_connection(api_url=form.api_url.data, model_name=form.name.data, api_key=form.api_key.data)
                if result['success']:
                    flash(result['message'], 'success')
                else:
                    flash(f"Тест соединения не удался: {result['message']}", 'danger')
                return redirect(url_for('user.models'))
            else:
                flash('URL API необходим для тестирования соединения', 'danger')
                return redirect(url_for('user.models'))

        try:
            # Создаем новую модель
            model = UserModel(
                name=form.name.data,
                provider=form.provider.data,
                description=form.description.data,
                api_url=form.api_url.data,
                api_key=form.api_key.data,
                color=form.color.data or "#808080",
                user_id=current_user.id
            )
            db.session.add(model)
            db.session.commit()
            flash('Модель успешно добавлена!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Ошибка при добавлении модели: {str(e)}', 'danger')

        return redirect(url_for('user.models'))

    # Если форма не прошла валидацию, показываем ошибки
    for field, errors in form.errors.items():
        for error in errors:
            flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.models'))


@user_bp.route('/models/delete/<int:model_id>', methods=['POST'])
@login_required
def delete_model(model_id):
    """Delete a custom model"""
    model = UserModel.query.get_or_404(model_id)

    # Проверяем, принадлежит ли модель текущему пользователю
    if model.user_id != current_user.id:
        flash('У вас нет прав для удаления этой модели', 'danger')
        return redirect(url_for('user.models'))

    try:
        db.session.delete(model)
        db.session.commit()
        flash('Модель успешно удалена', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Ошибка при удалении модели: {str(e)}', 'danger')

    return redirect(url_for('user.models'))


@user_bp.route('/models/test', methods=['POST'])
@login_required
def test_model():
    """Test connection to a model API"""
    data = request.json
    api_url = data.get('api_url')
    api_name = data.get('api_name')
    api_key = data.get('api_key')

    if not api_url:
        return jsonify({'success': False, 'message': 'URL API обязателен'})

    result = test_model_connection(api_url=api_url, model_name=api_name, api_key=api_key)
    return jsonify(result)