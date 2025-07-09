import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const SessionExpiryModal = () => {
  const { 
    showExpiryWarning, 
    handleContinueSession, 
    handleSessionExpiry, 
    getWarningTime 
  } = useAuth();
  
  // Tiempo de countdown dinámico - obtiene del AuthContext con fallback
  const getCountdownTime = () => {
    try {
      if (getWarningTime && typeof getWarningTime === 'function') {
        return Math.floor(getWarningTime() / 1000); // Convertir de ms a segundos
      }
    } catch (error) {
      console.warn('Error getting warning time:', error);
    }
    // Fallback a 5 segundos si hay error
    return 5;
  };
  
  const [countdown, setCountdown] = useState(getCountdownTime());

  // Contador regresivo cuando se muestra el modal
  useEffect(() => {
    const initialCountdown = getCountdownTime();
    
    if (!showExpiryWarning) {
      setCountdown(initialCountdown);
      return;
    }

    // Resetear countdown cuando aparece el modal
    setCountdown(initialCountdown);

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          console.log('⏰ Countdown terminado - cerrando sesión');
          // Usar setTimeout para evitar actualizar estado durante render
          setTimeout(() => {
            handleSessionExpiry();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showExpiryWarning, handleSessionExpiry]);

  if (!showExpiryWarning) return null;

  const maxCountdown = getCountdownTime();

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '400px',
          width: '90%',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="text-center">
          {/* Icono de reloj */}
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
            <span style={{ fontSize: '24px' }}>⏰</span>
          </div>
          
          {/* Título */}
          <h3 
            style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '8px', color: '#d97706' }}
          >
            Sesión por Expirar
          </h3>
          
          {/* Mensaje con countdown */}
          <p 
            style={{ fontSize: '14px', color: '#666', marginBottom: '16px' }}
          >
            Tu sesión expirará en <strong style={{ color: '#d97706' }}>{countdown} segundos</strong>.
          </p>
          
          <p 
            style={{ fontSize: '14px', color: '#666', marginBottom: '24px' }}
          >
            ¿Quieres continuar trabajando?
          </p>
          
          {/* Barra de progreso visual */}
          <div 
            style={{ 
              width: '100%', 
              height: '4px', 
              backgroundColor: '#e5e7eb', 
              borderRadius: '2px',
              marginBottom: '24px',
              overflow: 'hidden'
            }}
          >
            <div 
              style={{
                height: '100%',
                backgroundColor: countdown <= Math.ceil(maxCountdown * 0.4) ? '#dc2626' : 
                               countdown <= Math.ceil(maxCountdown * 0.6) ? '#f59e0b' : '#d97706',
                width: `${(countdown / maxCountdown) * 100}%`,
                transition: 'width 1s linear, background-color 0.3s ease'
              }}
            />
          </div>
          
          {/* Botones */}
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
            <button
              onClick={handleContinueSession}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#059669',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#047857'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#059669'}
            >
              ✓ Continuar Trabajando
            </button>
            <button
              onClick={handleSessionExpiry}
              style={{
                flex: 1,
                padding: '10px 20px',
                backgroundColor: '#dc2626',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500'
              }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#b91c1c'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#dc2626'}
            >
              ✗ Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SessionExpiryModal;