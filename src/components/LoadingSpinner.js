import React from 'react';
import '../CSS/LoadingSpinner.css';

const LoadingSpinner = ({ message = 'Cargando...' }) => {
  return (
    <div className="loading-container">
      <div className="loading-content">
        <div className="spinner-large"></div>
        <p className="loading-message">{message}</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;