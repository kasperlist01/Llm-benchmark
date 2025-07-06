import csv
import json
import os
from datetime import datetime
from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename

from app import db
from app.models.api_integration import ApiIntegration
from app.models.user_dataset import UserDataset
from app.models.user_model import UserModel
from app.services.model_service import test_model_connection
from app.user.forms import ChangePasswordForm, AddModelForm, AddApiIntegrationForm, JudgeModelForm, AddDatasetForm

user_bp = Blueprint('user', __name__)


def get_upload_folder():
    upload_folder = os.path.join(os.getcwd(), 'uploads', 'datasets')
    os.makedirs(upload_folder, exist_ok=True)
    return upload_folder


def analyze_csv_file(file_path):
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            sample = file.read(1024)
            file.seek(0)
            sniffer = csv.Sniffer()
            delimiter = sniffer.sniff(sample).delimiter

            reader = csv.DictReader(file, delimiter=delimiter)

            columns = reader.fieldnames
            rows = list(reader)

            prompt_column = find_prompt_column(columns)
            reference_column = find_reference_column(columns)

            columns_info = {}
            for col in columns:
                sample_values = [row[col] for row in rows[:100] if
                                 row[col] and row[col].strip()]

                numeric_count = 0
                for val in sample_values:
                    try:
                        float(val)
                        numeric_count += 1
                    except ValueError:
                        pass

                if numeric_count / len(sample_values) > 0.8 if sample_values else False:
                    col_type = 'numeric'
                else:
                    col_type = 'text'

                columns_info[col] = {
                    'type': col_type,
                    'sample_values': sample_values[:5],
                    'is_prompt': col == prompt_column,
                    'is_reference': col == reference_column
                }

            format_validated = bool(prompt_column and reference_column)

            return {
                'row_count': len(rows),
                'column_count': len(columns),
                'columns_info': json.dumps(columns_info, ensure_ascii=False),
                'format_validated': format_validated,
                'prompt_column': prompt_column,
                'reference_column': reference_column
            }

    except Exception as e:
        raise Exception(f"Ошибка при анализе CSV файла: {str(e)}")


def find_prompt_column(fieldnames):
    if not fieldnames:
        return None

    prompt_keywords = [
        'prompt', 'prompts', 'question', 'questions', 'query', 'queries',
        'input', 'instruction', 'instructions', 'task', 'tasks',
        'запрос', 'вопрос', 'задача', 'задание', 'инструкция'
    ]

    for field in fieldnames:
        if field.lower() in prompt_keywords:
            return field

    for field in fieldnames:
        for keyword in prompt_keywords:
            if keyword in field.lower():
                return field

    return None


def find_reference_column(fieldnames):
    if not fieldnames:
        return None

    reference_keywords = [
        'reference', 'answer', 'answers', 'response', 'responses', 'output',
        'solution', 'solutions', 'result', 'results', 'expected', 'target',
        'эталон', 'ответ', 'ответы', 'решение', 'результат', 'ожидаемый'
    ]

    for field in fieldnames:
        if field.lower() in reference_keywords:
            return field

    for field in fieldnames:
        for keyword in reference_keywords:
            if keyword in field.lower():
                return field

    return None


@user_bp.route('/settings')
@login_required
def settings():
    password_form = ChangePasswordForm()
    api_form = AddApiIntegrationForm()

    user_settings = current_user.get_or_create_settings()
    current_judge_id = user_settings.judge_model_id

    judge_form = JudgeModelForm(user_id=current_user.id, current_judge_id=current_judge_id)
    if current_judge_id:
        judge_form.judge_model_id.data = current_judge_id

    api_integrations = ApiIntegration.query.filter_by(user_id=current_user.id, is_active=True).all()

    return render_template('user/settings.html',
                           title='Настройки пользователя',
                           password_form=password_form,
                           api_form=api_form,
                           judge_form=judge_form,
                           api_integrations=api_integrations)


@user_bp.route('/change-password', methods=['POST'])
@login_required
def change_password():
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


@user_bp.route('/api-integrations/add', methods=['POST'])
@login_required
def add_api_integration():
    form = AddApiIntegrationForm()
    if form.validate_on_submit():
        try:
            integration = ApiIntegration(
                name=form.name.data,
                api_url=form.api_url.data,
                api_key=form.api_key.data,
                description=form.description.data,
                user_id=current_user.id
            )
            db.session.add(integration)
            db.session.commit()
            flash('API интеграция успешно добавлена!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Ошибка при добавлении интеграции: {str(e)}', 'danger')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.settings'))


@user_bp.route('/api-integrations/test', methods=['POST'])
@login_required
def test_api_integration():
    data = request.json
    api_url = data.get('api_url')
    api_key = data.get('api_key')
    name = data.get('name', 'Test')

    if not api_url:
        return jsonify({'success': False, 'message': 'URL API обязателен'})

    result = test_model_connection(api_url=api_url, api_key=api_key, model_name=name)
    return jsonify(result)


@user_bp.route('/api-integrations/delete/<int:integration_id>', methods=['POST'])
@login_required
def delete_api_integration(integration_id):
    integration = ApiIntegration.query.get_or_404(integration_id)

    if integration.user_id != current_user.id:
        flash('У вас нет прав для удаления этой интеграции', 'danger')
        return redirect(url_for('user.settings'))

    try:
        models_count = UserModel.query.filter_by(api_integration_id=integration_id).count()
        if models_count > 0:
            flash(f'Нельзя удалить интеграцию, которая используется в {models_count} моделях', 'danger')
            return redirect(url_for('user.settings'))

        db.session.delete(integration)
        db.session.commit()
        flash('API интеграция успешно удалена', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Ошибка при удалении интеграции: {str(e)}', 'danger')

    return redirect(url_for('user.settings'))


@user_bp.route('/judge-model/save', methods=['POST'])
@login_required
def save_judge_model():
    form = JudgeModelForm(user_id=current_user.id)
    if form.validate_on_submit():
        try:
            user_settings = current_user.get_or_create_settings()
            user_settings.judge_model_id = form.judge_model_id.data if form.judge_model_id.data != 0 else None
            db.session.commit()
            flash('Настройки модели-судьи сохранены!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Ошибка при сохранении настроек: {str(e)}', 'danger')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.settings'))


@user_bp.route('/models')
@login_required
def models():
    form = AddModelForm(user_id=current_user.id)
    user_models = UserModel.query.filter_by(user_id=current_user.id).all()
    return render_template('user/models.html', title='Мои модели',
                           form=form, models=user_models)


@user_bp.route('/models/add', methods=['POST'])
@login_required
def add_model():
    form = AddModelForm(user_id=current_user.id)
    if form.validate_on_submit():
        try:
            model = UserModel(
                name=form.name.data,
                description=form.description.data,
                color=form.color.data or "#808080",
                user_id=current_user.id,
                api_integration_id=form.api_integration_id.data if form.api_integration_id.data != 0 else None
            )
            db.session.add(model)
            db.session.commit()
            flash('Модель успешно добавлена!', 'success')
        except Exception as e:
            db.session.rollback()
            flash(f'Ошибка при добавлении модели: {str(e)}', 'danger')

        return redirect(url_for('user.models'))

    for field, errors in form.errors.items():
        for error in errors:
            flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.models'))


@user_bp.route('/models/delete/<int:model_id>', methods=['POST'])
@login_required
def delete_model(model_id):
    model = UserModel.query.get_or_404(model_id)

    if model.user_id != current_user.id:
        flash('У вас нет прав для удаления этой модели', 'danger')
        return redirect(url_for('user.models'))

    try:
        user_settings = current_user.get_or_create_settings()
        if user_settings.judge_model_id == model_id:
            user_settings.judge_model_id = None
            db.session.add(user_settings)
            flash('Модель была удалена из настроек судьи', 'info')

        db.session.delete(model)
        db.session.commit()
        flash('Модель успешно удалена', 'success')

    except Exception as e:
        db.session.rollback()
        flash(f'Ошибка при удалении модели: {str(e)}', 'danger')

    return redirect(url_for('user.models'))


@user_bp.route('/models/test-integration', methods=['POST'])
@login_required
def test_model_integration():
    data = request.json
    integration_id = data.get('integration_id')
    model_name = data.get('model_name', 'Test Model')

    if not integration_id:
        return jsonify({'success': False, 'message': 'ID интеграции обязателен'})

    integration = ApiIntegration.query.get_or_404(integration_id)
    if integration.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'У вас нет прав на эту интеграцию'})

    result = test_model_connection(
        api_url=integration.api_url,
        api_key=integration.api_key,
        model_name=model_name
    )
    return jsonify(result)


@user_bp.route('/models/test', methods=['POST'])
@login_required
def test_model():
    data = request.json
    model_id = data.get('model_id')

    if not model_id:
        return jsonify({'success': False, 'message': 'ID модели обязателен'})

    model = UserModel.query.get_or_404(model_id)
    if model.user_id != current_user.id:
        return jsonify({'success': False, 'message': 'У вас нет прав на эту модель'})

    if not model.api_integration:
        return jsonify({'success': False, 'message': 'У модели нет настроенной API интеграции'})

    integration = model.api_integration
    result = test_model_connection(
        api_url=integration.api_url,
        api_key=integration.api_key,
        model_name=model.name
    )
    return jsonify(result)


@user_bp.route('/datasets')
@login_required
def datasets():
    form = AddDatasetForm()
    user_datasets = UserDataset.query.filter_by(user_id=current_user.id, is_active=True).all()
    return render_template('user/datasets.html', title='Мои датасеты',
                           form=form, datasets=user_datasets)


@user_bp.route('/datasets/add', methods=['POST'])
@login_required
def add_dataset():
    form = AddDatasetForm()
    if form.validate_on_submit():
        try:
            file = form.csv_file.data
            filename = secure_filename(file.filename)

            timestamp = str(int(datetime.utcnow().timestamp()))
            unique_filename = f"{current_user.id}_{timestamp}_{filename}"

            upload_folder = get_upload_folder()
            file_path = os.path.join(upload_folder, unique_filename)

            file.save(file_path)

            file_info = analyze_csv_file(file_path)
            file_size = os.path.getsize(file_path)

            dataset = UserDataset(
                name=form.name.data,
                description=form.description.data,
                filename=filename,
                file_path=file_path,
                file_size=file_size,
                row_count=file_info['row_count'],
                column_count=file_info['column_count'],
                columns_info=file_info['columns_info'],
                user_id=current_user.id
            )

            db.session.add(dataset)
            db.session.commit()

            flash('Датасет успешно загружен!', 'success')

        except Exception as e:
            db.session.rollback()
            if 'file_path' in locals() and os.path.exists(file_path):
                os.remove(file_path)
            flash(f'Ошибка при загрузке датасета: {str(e)}', 'danger')
    else:
        for field, errors in form.errors.items():
            for error in errors:
                flash(f"{getattr(form, field).label.text}: {error}", 'danger')

    return redirect(url_for('user.datasets'))


@user_bp.route('/datasets/delete/<int:dataset_id>', methods=['POST'])
@login_required
def delete_dataset(dataset_id):
    dataset = UserDataset.query.get_or_404(dataset_id)

    if dataset.user_id != current_user.id:
        flash('У вас нет прав для удаления этого датасета', 'danger')
        return redirect(url_for('user.datasets'))

    try:
        dataset.delete_file()

        db.session.delete(dataset)
        db.session.commit()
        flash('Датасет успешно удален', 'success')
    except Exception as e:
        db.session.rollback()
        flash(f'Ошибка при удалении датасета: {str(e)}', 'danger')

    return redirect(url_for('user.datasets'))


@user_bp.route('/datasets/preview/<int:dataset_id>')
@login_required
def preview_dataset(dataset_id):
    dataset = UserDataset.query.get_or_404(dataset_id)

    if dataset.user_id != current_user.id:
        return jsonify({'error': 'У вас нет прав для просмотра этого датасета'}), 403

    try:
        preview_data = []
        with open(dataset.file_path, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for i, row in enumerate(reader):
                if i >= 10:
                    break
                preview_data.append(row)

        columns_info = json.loads(dataset.columns_info) if dataset.columns_info else {}

        return jsonify({
            'success': True,
            'preview_data': preview_data,
            'columns_info': columns_info,
            'total_rows': dataset.row_count
        })

    except Exception as e:
        return jsonify({'error': f'Ошибка при загрузке предпросмотра: {str(e)}'}), 500
