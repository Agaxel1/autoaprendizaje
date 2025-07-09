import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { FuncionProvider } from './context/FuncionContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import SessionExpiryModal from './components/SessionExpiryModal';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';

// Importar todas las páginas de admin
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsuarios from './pages/admin/AdminUsuarios';
import AdminCursos from './pages/admin/AdminCursos';
import AdminDocentes from './pages/admin/AdminDocentes';
import AdminEstudiantes from './pages/admin/AdminEstudiantes';
import AdminReportes from './pages/admin/AdminReportes';
import AdminConfiguracion from './pages/admin/AdminConfiguracion';
import AdminExamenes from './pages/admin/AdminExamenes';

import './App.css';

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <FuncionProvider>
          <div className="app">
            {/* Header siempre visible */}
            <Header />

            {/* Rutas */}
            <Routes>
              {/* Ruta pública de login */}
              <Route path="/login" element={<Login />} />

              {/* Rutas protegidas normales */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <Home />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/ayuda"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <h1>🆘 Página de Ayuda</h1>
                      <p>Aquí encontrarás información de ayuda...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/niveles"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <h1>📈 Niveles</h1>
                      <p>Información sobre niveles...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/progreso"
                element={
                  <ProtectedRoute>
                    <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <h1>📊 Progreso</h1>
                      <p>Tu progreso académico...</p>
                    </div>
                  </ProtectedRoute>
                }
              />

              {/* Rutas de Administración - Solo para admins */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminDashboard />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/usuarios"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminUsuarios />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/cursos"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminCursos />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/docentes"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminDocentes />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/estudiantes"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminEstudiantes />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/reportes"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminReportes />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/configuracion"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminConfiguracion />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin/examenes"
                element={
                  <ProtectedRoute>
                    <AdminRoute>
                      <AdminExamenes />
                    </AdminRoute>
                  </ProtectedRoute>
                }
              />

              {/* Página no encontrada */}
              <Route
                path="*"
                element={
                  <ProtectedRoute>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      minHeight: '100vh',
                      flexDirection: 'column'
                    }}>
                      <h1>404 - Página no encontrada</h1>
                      <p>La página que buscas no existe.</p>
                    </div>
                  </ProtectedRoute>
                }
              />
            </Routes>

            {/* Footer siempre visible */}
            <Footer />

            {/* Modal de sesión */}
            <SessionExpiryModal />
          </div>
        </FuncionProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;