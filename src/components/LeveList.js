import React from 'react';
import '../CSS/LevelList.css';

const LevelList = () => {
  const levels = ['Nivel 1', 'Nivel 2', 'Nivel 3'];

  return (
    <div className="level-list">
      <h2>Selecciona un nivel</h2>
      <ul>
        {levels.map((level, index) => (
          <li key={index} className="level-item">{level}</li>
        ))}
      </ul>
    </div>
  );
};

export default LevelList;
