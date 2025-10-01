import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <Link to="/" className="navbar-brand">
          <div className="logo-icon">
            <i className="fas fa-robot"></i>
          </div>
          <span className="brand-text">Тестирование LLM</span>
        </Link>

        <div className="menu-toggle" id="menuToggle" onClick={toggleMenu}>
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>

      <div className={`nav-links ${menuOpen ? 'active' : ''}`} id="navLinks">
        {isAuthenticated ? (
          <>
            <Link to="/" className={isActive('/') ? 'active' : ''}>
              <i className="fas fa-chart-line"></i> Панель управления
            </Link>
            <Link to="/models" className={isActive('/models') ? 'active' : ''}>
              <i className="fas fa-cubes"></i> Мои модели
            </Link>
            <Link to="/datasets" className={isActive('/datasets') ? 'active' : ''}>
              <i className="fas fa-table"></i> Мои датасеты
            </Link>
            <Link to="/settings" className={isActive('/settings') ? 'active' : ''}>
              <i className="fas fa-cog"></i> Настройки
            </Link>
          </>
        ) : (
          <>
            <Link to="/login" className={isActive('/login') ? 'active' : ''}>
              <i className="fas fa-sign-in-alt"></i> Вход
            </Link>
            <Link to="/register" className={isActive('/register') ? 'active' : ''}>
              <i className="fas fa-user-plus"></i> Регистрация
            </Link>
          </>
        )}
      </div>

      {isAuthenticated && user && (
        <div className="user-section">
          <div className="user-welcome">
            <div className="user-avatar">{user.username[0]}</div>
            <span>{user.username}</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            <i className="fas fa-sign-out-alt"></i> Выход
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
