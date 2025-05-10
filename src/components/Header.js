import React, { useState } from 'react';
import '../CSS/Header.css';

const Header = () => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const [isMenuOpen, setMenuOpen] = useState(false); // Estado para el menú en móvil
  const LinkLogo = "https://api.vida-roleplay.es/imagenes/logo_oficial.png";

  const toggleDropdown = () => setDropdownOpen(!isDropdownOpen);

  const toggleMenu = () => setMenuOpen(!isMenuOpen); // Función para alternar el menú

  return (
    <header className="header">
      <nav className="nav">
        <div className="logo">
          <a href="/">
            <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
          </a>
        </div>

        {/* Menú en dispositivos grandes */}
        <div className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
          <a href="/">Inicio</a>
          <a href="/">Niveles</a>
          <a href="/">Progreso</a>
          <a href="/">Ayuda</a>
        </div>

        {/* Contenedor para el icono de hamburguesa y perfil */}
        <div className="hamburger-profile">

          <div className="logo-mobile">
            <a href="/">
              <img src={LinkLogo} alt="Logo Universidad" className="university-logo" />
            </a>
          </div>
          {/* Icono de hamburguesa */}
          <div className="info">
            <div className="hamburger" onClick={toggleMenu}>
              <div className="line"></div>
              <div className="line"></div>
              <div className="line"></div>
            </div>

            {/* Perfil a la derecha del botón de hamburguesa */}
            <div className="profile">
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
      </nav>
    </header>
  );
};

export default Header;
