from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, current_user

from app import db
from app.auth.forms import LoginForm, RegistrationForm
from app.models.user import User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    # Handle JSON API requests
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        remember_me = data.get('remember_me', False)

        user = User.query.filter_by(username=username).first()
        if user is None or not user.check_password(password):
            return jsonify({'error': 'Неверное имя пользователя или пароль'}), 401

        login_user(user, remember=remember_me)
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 200

    # Handle traditional form requests
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user is None or not user.check_password(form.password.data):
            flash('Неверное имя пользователя или пароль', 'danger')
            return redirect(url_for('auth.login'))

        login_user(user, remember=form.remember_me.data)
        next_page = request.args.get('next')
        if not next_page or not next_page.startswith('/'):
            next_page = url_for('main.index')
        return redirect(next_page)

    return render_template('auth/login.html', title='Вход', form=form)


@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    # Handle JSON API requests
    if request.is_json:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        # Check if user already exists
        if User.query.filter_by(username=username).first():
            return jsonify({'error': 'Пользователь с таким именем уже существует'}), 400

        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()

        # Auto-login after registration
        login_user(user)
        return jsonify({
            'id': user.id,
            'username': user.username,
            'email': user.email
        }), 201

    # Handle traditional form requests
    if current_user.is_authenticated:
        return redirect(url_for('main.index'))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = User(username=form.username.data, email=form.email.data)
        user.set_password(form.password.data)
        db.session.add(user)
        db.session.commit()
        flash('Ваша учетная запись создана! Теперь вы можете войти.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('auth/register.html', title='Регистрация', form=form)


@auth_bp.route('/logout')
def logout():
    logout_user()
    if request.is_json:
        return jsonify({'message': 'Вы успешно вышли'}), 200
    return redirect(url_for('main.index'))


@auth_bp.route('/current-user')
def current_user_endpoint():
    if current_user.is_authenticated:
        return jsonify({
            'id': current_user.id,
            'username': current_user.username,
            'email': current_user.email
        }), 200
    return jsonify({'error': 'Не авторизован'}), 401
