import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';  // Importamos Link desde React Router
import '../CSS/Header.css';

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 768); // Valor inicial
  const LinkLogo = "https://api.vida-roleplay.es/imagenes/logo_oficial.png";

  // Refs para manejar el clic fuera del dropdown
  const dropdownRef = useRef(null);
  const avatarRef = useRef(null);

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const toggleMenu = () => setMenuOpen(!isMenuOpen);

  // Cerrar el dropdown si se hace clic fuera de él
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Si el clic no fue dentro del dropdown ni del avatar, cerramos el dropdown
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        avatarRef.current && !avatarRef.current.contains(event.target)
      ) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    // Limpiar el evento al desmontar el componente
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth <= 768); // Cambia según el breakpoint que uses
    };

    window.addEventListener('resize', handleResize);

    handleResize(); // Llamar una vez por si el componente se monta después del resize

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="header">
      <nav className="nav">
        <div className="logo">
          <Link to="/"> {/* Usamos Link para la navegación interna */}
            <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
          </Link>
        </div>

        {/* Menú en dispositivos grandes */}
        {!isPhone && (
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/">Inicio</Link>  {/* Usamos Link para evitar recargar la página */}
            <a href="/">Niveles</a>
            <a href="/">Progreso</a>
            <a href="/">Ayuda</a>
          </div>
        )}

        {/* Contenedor para el icono de hamburguesa y perfil */}
        <div className="hamburger-profile">
          {isPhone && (
            <div className="logo-mobile">
              <Link to="/"> {/* Usamos Link también aquí */}
                <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
              </Link>
            </div>
          )}

          <div className="info">
            {isPhone && (
              <div className="hamburger" onClick={toggleMenu}>
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
              </div>
            )}

            <div className="profile">
              {!isPhone && (
                <div className="name">Axel Gabriel Menendez Villamar</div>
              )}
              <img
                ref={avatarRef}  // Agregamos ref al avatar
                src="https://api.vida-roleplay.es/imagenes/logo_oficial.png"
                alt="Perfil"
                className="avatar"
                onClick={toggleDropdown}
              />
              {isDropdownOpen && (
                <div ref={dropdownRef} className="dropdown">  {/* Ref al dropdown */}
                  <div className="dropdown-header">
                    <img
                      src="https://api.vida-roleplay.es/imagenes/logo_oficial.png"
                      alt="Perfil"
                      className="dropdown-avatar"
                    />
                    <div className="dropdown-name">Axel Gabriel Menendez Villamar</div>
                  </div>
                  <button>Ver perfil</button>
                  <button>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isPhone && (
          <div className={`nav-links mobile ${isMenuOpen ? 'show' : ''}`}>
            <Link to="/">Inicio</Link> {/* Usamos Link aquí también */}
            <a href="/">Niveles</a>
            <a href="/">Progreso</a>
            <a href="/">Ayuda</a>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
