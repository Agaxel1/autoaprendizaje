import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom'; // Importamos React Router
import Home from './pages/Home';
import './App.css';

const App = () => {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} /> 
           <Route path="/admin" element={<Home />} /> 
        </Routes>
      </div>
    </Router>
  );
};

export default App;
