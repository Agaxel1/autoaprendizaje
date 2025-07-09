import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoProvincial from '../multimedia/Logo_Provicional.png'
import '../CSS/Header.css';

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isAdminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const LinkLogo = LogoProvincial;
  const location = useLocation();

  // Contexto de autenticación con las nuevas funciones
  const { user, logout, currentRole, switchRole } = useAuth();

  // Refs para manejar el clic fuera del dropdown
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);
  const adminDropdownRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const toggleMenu = () => setMenuOpen(!isMenuOpen);
  const toggleAdminDropdown = () => setAdminDropdownOpen(!isAdminDropdownOpen);

  // Función para cerrar sesión
  const handleLogout = () => {
    logout();
    setDropdownOpen(false);
    setMenuOpen(false);
  };

  // Función para cambiar de rol
  const handleRoleChange = (roleId, roleName) => {
    if (switchRole) {
      const success = switchRole(roleId, roleName);
      if (success) {
        // Opcional: mostrar feedback visual
        console.log(`Rol cambiado a: ${roleName}`);
      }
    }
    setDropdownOpen(false);
  };

  // Función para cerrar el menú móvil al hacer clic en un enlace
  const handleLinkClick = () => {
    setMenuOpen(false);
    setDropdownOpen(false);
    setAdminDropdownOpen(false);
  };

  // Función para obtener el nombre del usuario
  const getUserName = () => {
    if (user?.nombres && user?.apellidos) {
      return `${user.apellidos} ${user.nombres}`;
    }
    if (user?.email) {
      return user.email;
    }
    return 'Usuario';
  };

  // Función para obtener el rol actual
  const getCurrentRoleName = () => {
    if (currentRole) {
      return currentRole;
    }
    if (user?.roles && user.roles.length > 0) {
      return user.roles[0].nombre || user.roles[0];
    }
    return '';
  };

  // Función para verificar si el usuario es administrador
  const isAdmin = () => {
    const roleName = getCurrentRoleName().toLowerCase();
    return roleName === 'administrador' || roleName === 'admin';
  };

  // Función para obtener el color del rol
  const getRoleColor = (roleName) => {
    const roleColors = {
      'administrador': '#FF9800',
      'docente': '#4CAF50',
      'estudiante': '#2196F3',
    };
    return roleColors[roleName.toLowerCase()] || '#6c757d';
  };

  // Función para verificar si debe mostrar el selector de roles
  const shouldShowRoleSelector = () => {
    if (!user?.roles || user.roles.length <= 1) return false;

    // No mostrar si solo tiene rol de estudiante
    if (user.roles.length === 1 &&
      (user.roles[0].nombre === 'estudiante' || user.roles[0] === 'estudiante')) {
      return false;
    }

    return true;
  };

  // Configuración del menú de administración
  const adminMenuItems = [
    {
      path: '/admin',
      icon: '📊',
      label: 'Dashboard'
    },
    {
      path: '/admin/usuarios',
      icon: '👥',
      label: 'Gestionar Usuarios'
    },
    {
      path: '/admin/cursos',
      icon: '📚',
      label: 'Gestionar Cursos'
    },
    {
      path: '/admin/docentes',
      icon: '👨‍🏫',
      label: 'Gestionar Docentes'
    },
    {
      path: '/admin/examenes',
      icon: '📄',
      label: 'Gestionar Examenes'
    },
    {
      path: '/admin/estudiantes',
      icon: '🎓',
      label: 'Gestionar Estudiantes'
    },
    { divider: true },
    {
      path: '/admin/reportes',
      icon: '📈',
      label: 'Reportes',
    },
    {
      path: '/admin/configuracion',
      icon: '⚙️',
      label: 'Configuración'
    }
  ];

  // Cerrar los dropdowns si se hace clic fuera de ellos
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Cerrar dropdown de usuario
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        avatarRef.current && !avatarRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }

      // Cerrar dropdown de admin
      if (
        adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)
      ) {
        setAdminDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) {
        setMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Avatar por defecto o imagen del usuario
  const getAvatarSrc = () => {
    if (user?.avatar) {
      return user.avatar;
    }
    return null; // Usaremos las iniciales como fallback
  };

  return (
    <header className="header">
      <nav className="nav">
        {/* Logo */}
        <div className="logo">
          <Link to="/" onClick={handleLinkClick}>
            <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
          </Link>
        </div>

        {/* Menú de navegación - solo visible en desktop */}
        <div className={`nav-links ${isMobile ? 'mobile' : 'desktop'} ${isMenuOpen ? 'show' : ''}`}>
          <Link to="/" onClick={handleLinkClick}>Inicio</Link>
          <Link to="/ayuda" onClick={handleLinkClick}>Ayuda</Link>

          {/* Si hay sesión, mostrar más opciones */}
          {user && (
            <>
              <Link to="/niveles" onClick={handleLinkClick}>Niveles</Link>
              <Link to="/progreso" onClick={handleLinkClick}>Progreso</Link>

              {/* Menú de Administrador - solo si es admin */}
              {isAdmin() && (
                <div className="admin-nav-dropdown" ref={adminDropdownRef}>
                  <button
                    className={`admin-nav-button ${isAdminDropdownOpen ? 'active' : ''}`}
                    onClick={toggleAdminDropdown}
                  >
                    <span className="admin-icon">⚙️</span>
                    <span className="admin-text">
                      Administración
                    </span>
                    <span className={`dropdown-arrow ${isAdminDropdownOpen ? 'open' : ''}`}>▼</span>
                  </button>

                  {isAdminDropdownOpen && (
                    <div className="admin-dropdown">
                      <div className="admin-dropdown-header">
                        <span className="admin-header-icon">🛠️</span>
                        <div className="admin-header-text">
                          <span className="admin-header-title">Panel de Administración</span>
                          <span className="admin-header-subtitle">Gestiona tu plataforma</span>
                        </div>
                      </div>

                      {adminMenuItems.map((item, index) => {
                        if (item.divider) {
                          return <div key={index} className="admin-dropdown-divider"></div>;
                        }

                        const isCurrentPath = location.pathname === item.path;

                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={handleLinkClick}
                            className={`admin-dropdown-item ${isCurrentPath ? 'active' : ''}`}
                          >
                            <span className="admin-item-icon">{item.icon}</span>
                            <div className="admin-item-content">
                              <span className="admin-item-label">{item.label}</span>
                            </div>
                            {isCurrentPath && <span className="admin-item-indicator">●</span>}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* En móvil, mostrar opción de login si no hay usuario */}
          {isMobile && !user && (
            <Link to="/login" className="login-button-mobile" onClick={handleLinkClick}>
              Iniciar sesión
            </Link>
          )}
        </div>

        {/* Contenedor derecho con hamburguesa y perfil */}
        <div className="header-right">
          {/* Hamburguesa solo en móvil */}
          {isMobile && (
            <div className={`hamburger ${isMenuOpen ? 'open' : ''}`} onClick={toggleMenu}>
              <div className="line"></div>
              <div className="line"></div>
              <div className="line"></div>
            </div>
          )}

          {/* Perfil del usuario */}
          <div className="profile">
            {user ? (
              <>
                {/* Información del usuario solo en desktop */}
                {!isMobile && (
                  <div className="user-info">
                    <div className="name">{getUserName()}</div>
                    {shouldShowRoleSelector() && (
                      <div
                        className="current-role"
                        style={{ color: getRoleColor(getCurrentRoleName()) }}
                      >
                        {getCurrentRoleName()}
                      </div>
                    )}
                  </div>
                )}

                <img
                  ref={avatarRef}
                  src={getAvatarSrc()}
                  alt="Perfil"
                  className="avatar"
                  onClick={toggleDropdown}
                />

                {isDropdownOpen && (
                  <div ref={dropdownRef} className="dropdown">
                    <div className="dropdown-header">
                      <img
                        src={getAvatarSrc()}
                        alt="Perfil"
                        className="dropdown-avatar"
                      />
                      <div className="dropdown-info">
                        <div className="dropdown-name">{getUserName()}</div>
                        <div className="dropdown-email">{user?.email}</div>

                        {/* Mostrar rol actual */}
                        <div className="current-role-display">
                          <span className="role-label">Rol activo:</span>
                          <span
                            className="current-role-badge"
                            style={{
                              backgroundColor: getRoleColor(getCurrentRoleName()),
                              color: 'white'
                            }}
                          >
                            {getCurrentRoleName()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Selector de roles - solo si tiene múltiples roles y no es solo estudiante */}
                    {shouldShowRoleSelector() && (
                      <div className="role-selector">
                        <div className="role-selector-header">
                          <span className="role-selector-icon">🔄</span>
                          Cambiar rol
                        </div>
                        <div className="role-options">
                          {user.roles.map((role, index) => {
                            const roleName = role.nombre || role;
                            const roleId = role.id || index;
                            const isCurrentRole = roleName.toLowerCase() === getCurrentRoleName().toLowerCase();

                            return (
                              <button
                                key={roleId}
                                className={`role-option ${isCurrentRole ? 'active' : ''}`}
                                onClick={() => handleRoleChange(roleId, roleName)}
                                disabled={isCurrentRole}
                                style={{
                                  borderColor: isCurrentRole ? getRoleColor(roleName) : 'transparent',
                                  backgroundColor: isCurrentRole ? `${getRoleColor(roleName)}15` : 'transparent'
                                }}
                              >
                                <span
                                  className="role-indicator"
                                  style={{ backgroundColor: getRoleColor(roleName) }}
                                ></span>
                                <span className="role-name">{roleName}</span>
                                {isCurrentRole && (
                                  <span className="role-check">✓</span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="dropdown-divider"></div>

                    <button
                      className="dropdown-button"
                      onClick={() => {
                        setDropdownOpen(false);
                        // Navegar al perfil
                      }}
                    >
                      <span className="dropdown-icon">👤</span>
                      Ver perfil
                    </button>

                    {/* Acceso rápido al dashboard de admin si es administrador */}
                    {isAdmin() && (
                      <Link
                        to="/admin"
                        className="dropdown-button admin-button"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <span className="dropdown-icon">📊</span>
                        Dashboard Admin
                      </Link>
                    )}

                    <button className="dropdown-button logout-button" onClick={handleLogout}>
                      <span className="dropdown-icon">🚪</span>
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* Botón de login solo en desktop */
              !isMobile && (
                <Link to="/login" className="login-button">
                  Iniciar sesión
                </Link>
              )
            )}
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Header;