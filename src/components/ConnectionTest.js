import React, { useState } from 'react';
import LoadingSpinner from '../components/LoadingSpinner';

const ConnectionTest = () => {
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Probar primero una conexión básica
      const basicResponse = await fetch(API_BASE_URL, {
        method: 'GET',
        mode: 'cors'
      });
      
      // Probar el endpoint específico de login
      const loginTestResponse = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@test.com',
          password: 'test123'
        })
      });

      let loginErrorDetails = 'No se pudo obtener detalles';
      try {
        const loginErrorData = await loginTestResponse.json();
        loginErrorDetails = JSON.stringify(loginErrorData, null, 2);
      } catch (e) {
        try {
          loginErrorDetails = await loginTestResponse.text();
        } catch (e2) {
          loginErrorDetails = 'Error al leer respuesta';
        }
      }

      setTestResult({
        basicConnection: {
          status: basicResponse.status,
          ok: basicResponse.ok,
          statusText: basicResponse.statusText
        },
        loginEndpoint: {
          status: loginTestResponse.status,
          ok: loginTestResponse.ok,
          statusText: loginTestResponse.statusText,
          details: loginErrorDetails
        },
        apiUrl: API_BASE_URL
      });

    } catch (err) {
      console.error('💥 Error en test de conexión:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Función de reintento
  const handleRetry = () => {
    testConnection();
  };

  if (loading) {
    return <LoadingSpinner message="Probando conexión..." />;
  }

  return (
    <div style={{ 
      position: 'fixed', 
      top: 10, 
      right: 10, 
      background: 'white', 
      border: '1px solid #ccc', 
      padding: 15, 
      borderRadius: 8,
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      maxWidth: 400,
      zIndex: 9999
    }}>
      <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔧 Test de Conexión</h4>
      
      <button 
        onClick={testConnection} 
        disabled={loading}
        style={{
          background: '#4CAF50',
          color: 'white',
          border: 'none',
          padding: '8px 16px',
          borderRadius: 4,
          cursor: 'pointer',
          marginBottom: 10,
          fontSize: '12px',
          fontWeight: '600'
        }}
      >
        Probar Conexión
      </button>

      {error && (
        <div style={{
          background: '#ffebee',
          border: '1px solid #f44336',
          color: '#d32f2f',
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '16px'
        }}>
          {error}
        </div>
      )}

      {testResult && (
        <div style={{ 
          fontSize: 12, 
          fontFamily: 'monospace',
          background: testResult.error ? '#ffebee' : '#f5f5f5',
          padding: 10,
          borderRadius: 4,
          maxHeight: 300,
          overflow: 'auto',
          border: testResult.error ? '1px solid #f44336' : '1px solid #e0e0e0'
        }}>
          <pre>{JSON.stringify(testResult, null, 2)}</pre>
          
          {testResult.error && (
            <button
              onClick={handleRetry}
              style={{
                background: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '6px 12px',
                borderRadius: 4,
                cursor: 'pointer',
                fontSize: '11px',
                fontWeight: '600',
                marginTop: '8px'
              }}
            >
              Reintentar
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ConnectionTest;