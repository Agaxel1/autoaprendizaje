import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, currentRole, isAuthenticated } = useAuth();

  // Verificar si está autenticado
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // Función para verificar si el usuario es administrador
  const isAdmin = () => {
    if (!currentRole) return false;
    const roleName = currentRole.toLowerCase();
    return roleName === 'administrador' || roleName === 'admin';
  };

  // Si no es admin, mostrar página de acceso denegado
  if (!isAdmin()) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        flexDirection: 'column',
        textAlign: 'center',
        padding: '20px'
      }}>
        <div style={{
          background: 'linear-gradient(135deg, #f8d7da, #f5c6cb)',
          border: '1px solid #f1aeb5',
          borderRadius: '12px',
          padding: '40px',
          maxWidth: '500px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>🚫</div>
          <h1 style={{ 
            color: '#721c24', 
            fontSize: '2rem', 
            marginBottom: '16px',
            fontWeight: '700'
          }}>
            Acceso Denegado
          </h1>
          <p style={{ 
            color: '#721c24', 
            fontSize: '1.1rem', 
            marginBottom: '24px',
            lineHeight: '1.6'
          }}>
            Esta sección está reservada únicamente para administradores. 
            Tu rol actual es: <strong>{currentRole}</strong>
          </p>
          <div style={{ 
            background: 'rgba(114, 28, 36, 0.1)', 
            padding: '12px', 
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <p style={{ 
              color: '#721c24', 
              margin: 0, 
              fontSize: '0.9rem' 
            }}>
              💡 Si necesitas acceso de administrador, contacta con tu supervisor o cambia tu rol desde el menú de usuario.
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'linear-gradient(135deg, #4CAF50, #388E3C)',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '25px',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
            }}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
            }}
          >
            ← Volver
          </button>
        </div>
      </div>
    );
  }

  // Si es admin, renderizar el componente hijo
  return children;
};

export default AdminRoute;