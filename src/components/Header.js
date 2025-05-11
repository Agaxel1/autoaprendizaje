import React, { useState, useEffect } from 'react';
import '../CSS/Header.css';

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false);
  const [isPhone, setIsPhone] = useState(window.innerWidth <= 768); // Valor inicial
  const LinkLogo = "https://api.vida-roleplay.es/imagenes/logo_oficial.png";

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);
  const toggleMenu = () => setMenuOpen(!isMenuOpen);

  useEffect(() => {
    const handleResize = () => {
      setIsPhone(window.innerWidth <= 768); // Cambia según el breakpoint que uses
    };

    window.addEventListener('resize', handleResize);

    // Llamar una vez por si el componente se monta después del resize
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <header className="header">
      <nav className="nav">
        <div className="logo">
          <a href="/">
            <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
          </a>
        </div>

        {/* Menú en dispositivos grandes */}
        {!isPhone && (
          <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
            <a href="/">Inicio</a>
            <a href="/">Niveles</a>
            <a href="/">Progreso</a>
            <a href="/">Ayuda</a>
          </div>
        )}

        {/* Contenedor para el icono de hamburguesa y perfil */}
        <div className="hamburger-profile">
          {isPhone && (
            <div className="logo-mobile">
              <a href="/">
                <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
              </a>
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
                src="https://api.vida-roleplay.es/imagenes/logo_oficial.png"
                alt="Perfil"
                className="avatar"
                onClick={toggleDropdown}
              />
              {isDropdownOpen && (
                <div className="dropdown">
                  <button>Ver perfil</button>
                  <button>Cerrar sesión</button>
                </div>
              )}
            </div>
          </div>
        </div>

        {isPhone && (
          <div className={`nav-links mobile ${isMenuOpen ? 'show' : ''}`}>
            <a href="/">Inicio</a>
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
