// src/pages/Login.js
import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../CSS/Login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  const { login, isAuthenticated } = useAuth();
  const location = useLocation();
  
  const from = location.state?.from?.pathname || '/';

  // Si ya está autenticado, redirigir
  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar errores cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'El email no es válido';
    }
    
    if (!formData.password.trim()) {
      newErrors.password = 'La contraseña es requerida';
    } else if (formData.password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setErrors({});
    
    try {
      await login(formData.email, formData.password);
      // El contexto se encarga de la redirección
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setErrors({
        general: error.message || 'Error al iniciar sesión'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* Sección izquierda - Branding */}
      <div className="login-left">
        <div className="university-branding">
          <h2>UNIVERSIDAD TECNICA DE MANABÍ</h2>
          <p className="tagline">Formando profesionales con excelencia y compromiso</p>
        </div>
      </div>

      {/* Sección derecha - Formulario */}
      <div className="login-right">
        <div className="login-card">
          {/* Logo section */}
          <div className="login-logo">
            <div className="logo-placeholder">
              Logo
            </div>
          </div>

          <div className="login-header">
            <h1>Iniciar Sesión</h1>
            <p>Ingresa tus credenciales para acceder al sistema</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            {errors.general && (
              <div className="error-message general-error">
                {errors.general}
              </div>
            )}
            
            <div className="form-group">
              <label htmlFor="email">Correo</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={errors.email ? 'error' : ''}
                placeholder="usuario@universidad.edu"
                disabled={loading}
              />
              {errors.email && (
                <span className="error-message">{errors.email}</span>
              )}
            </div>
            
            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={errors.password ? 'error' : ''}
                placeholder="Tu contraseña"
                disabled={loading}
              />
              {errors.password && (
                <span className="error-message">{errors.password}</span>
              )}
            </div>
            
            <button 
              type="submit" 
              className="login-button"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner">
                  <span className="spinner"></span>
                  Iniciando sesión...
                </span>
              ) : (
                'Iniciar Sesión'
              )}
            </button>
          </form>
          
          <div className="login-footer">
            <p>¿Olvidaste tu contraseña? <a href="#forgot">Recuperar</a></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;