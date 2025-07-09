// pages/admin/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useFuncion } from '../../context/FuncionContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDashboard = () => {
  const { user } = useAuth();
  const {
    fetchDashboardStats,
    fetchCourses
  } = useFuncion();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    totalTeachers: 0,
    totalCourses: 0,
    activeCourses: 0,
    newRegistrations: 0,
    systemStatus: '99.9%'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar estadísticas del dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si existe una función específica para estadísticas del dashboard
        if (fetchDashboardStats) {
          const dashboardData = await fetchDashboardStats();
          setStats(prev => ({
            ...prev,
            ...dashboardData
          }));
        } else {
          // Fallback: hacer peticiones individuales para obtener datos
          const [coursesData] = await Promise.all([
            fetchCourses({ page: 1, limit: 1000 }) // Obtener todos los cursos para contar
          ]);

          // Calcular estadísticas básicas
          const activeCourses = coursesData.filter(course =>
            (course.curso || course).activo
          ).length;

          setStats(prev => ({
            ...prev,
            totalCourses: coursesData.length,
            activeCourses: activeCourses
          }));
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [fetchDashboardStats, fetchCourses]);

  const handleRetry = () => {
    window.location.reload();
  };

  if (loading) {
    return <LoadingSpinner message="Cargando dashboard..." />;
  }

  if (error) {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '2px solid #f44336'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#f44336', marginBottom: '16px' }}>Error al cargar el dashboard</h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={handleRetry}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  const adminCards = [
    {
      icon: '👥',
      title: 'Gestionar Usuarios',
      description: 'Administra cuentas de usuarios, permisos y roles del sistema',
      link: '/admin/usuarios',
      color: '#2196F3',
      stats: `${stats.totalUsers.toLocaleString()} usuarios`
    },
    {
      icon: '📚',
      title: 'Gestionar Cursos',
      description: 'Crea, edita y organiza cursos y contenido educativo',
      link: '/admin/cursos',
      color: '#4CAF50',
      stats: `${stats.activeCourses} cursos activos`
    },
    {
      icon: '👨‍🏫',
      title: 'Gestionar Docentes',
      description: 'Administra profesores y asignaciones de cursos',
      link: '/admin/docentes',
      color: '#FF9800',
      stats: `${stats.totalTeachers.toLocaleString()} docentes`
    },
    {
      icon: '🎓',
      title: 'Gestionar Estudiantes',
      description: 'Supervisa inscripciones y progreso estudiantil',
      link: '/admin/estudiantes',
      color: '#9C27B0',
      stats: `${stats.totalStudents.toLocaleString()} estudiantes`
    },
    {
      icon: '📊',
      title: 'Reportes',
      description: 'Analiza estadísticas y genera informes detallados',
      link: '/admin/reportes',
      color: '#f44336',
      stats: '15 reportes'
    },
    {
      icon: '⚙️',
      title: 'Configuración',
      description: 'Ajusta configuraciones globales del sistema',
      link: '/admin/configuracion',
      color: '#607D8B',
      stats: 'Sistema estable'
    }
  ];

  const quickStats = [
    {
      label: 'Usuarios Totales',
      value: stats.totalUsers.toLocaleString(),
      icon: '👥',
      color: '#2196F3',
      trend: stats.newRegistrations > 0 ? `+${stats.newRegistrations}` : null
    },
    {
      label: 'Cursos Activos',
      value: stats.activeCourses.toString(),
      icon: '📚',
      color: '#4CAF50',
      trend: `${stats.totalCourses} total`
    },
    {
      label: 'Nuevos Registros',
      value: `+${stats.newRegistrations}`,
      icon: '📈',
      color: '#FF9800',
      trend: 'Esta semana'
    },
    {
      label: 'Sistema',
      value: stats.systemStatus,
      icon: '⚡',
      color: '#8BC34A',
      trend: 'Uptime'
    }
  ];

  if (stats.error) {
    return (
      <div style={{
        padding: '40px 20px',
        maxWidth: '1400px',
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '2px solid #f44336'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⚠️</div>
          <h2 style={{ color: '#f44336', marginBottom: '16px' }}>Error al cargar el dashboard</h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>{stats.error}</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#f44336',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '600'
            }}
          >
            Recargar página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      padding: '40px 20px',
      maxWidth: '1400px',
      margin: '0 auto',
      background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
      minHeight: '100vh'
    }}>
      {/* Header */}
      <div style={{
        textAlign: 'center',
        marginBottom: '40px',
        padding: '30px',
        background: 'white',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(76, 175, 80, 0.2)'
      }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🛠️</div>
        <h1 style={{
          fontSize: '2.5rem',
          color: '#2E7D32',
          marginBottom: '16px',
          fontWeight: '800',
          background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Panel de Administración
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#6c757d',
          maxWidth: '600px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          Bienvenido/a <strong>{user?.nombres || user?.email}</strong>.
          Gestiona todos los aspectos de la plataforma desde aquí.
        </p>
      </div>

      {/* Quick Stats */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        {quickStats.map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '24px',
            borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(0, 0, 0, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            transition: 'all 0.3s ease'
          }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 8px 30px rgba(0, 0, 0, 0.15)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
            }}
          >
            <div style={{
              fontSize: '2.5rem',
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              background: `linear-gradient(135deg, ${stat.color}20, ${stat.color}10)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `2px solid ${stat.color}30`
            }}>
              {stat.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: '2rem',
                fontWeight: '800',
                color: stat.color,
                lineHeight: '1'
              }}>
                {stat.value}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#6c757d',
                fontWeight: '600',
                marginTop: '4px'
              }}>
                {stat.label}
              </div>
              {stat.trend && (
                <div style={{
                  fontSize: '0.75rem',
                  color: '#28a745',
                  fontWeight: '500',
                  marginTop: '2px'
                }}>
                  {stat.trend}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Admin Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
        gap: '24px',
        marginBottom: '40px'
      }}>
        {adminCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            style={{
              textDecoration: 'none',
              color: 'inherit'
            }}
          >
            <div style={{
              background: 'white',
              padding: '32px',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              border: '1px solid rgba(0, 0, 0, 0.05)',
              transition: 'all 0.4s cubic-bezier(0.4, 0.0, 0.2, 1)',
              cursor: 'pointer',
              height: '100%',
              position: 'relative',
              overflow: 'hidden'
            }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-12px) scale(1.02)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.2)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0) scale(1)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              {/* Decorative top border */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: `linear-gradient(135deg, ${card.color}, ${card.color}80)`
              }}></div>

              {/* Icon */}
              <div style={{
                fontSize: '4rem',
                marginBottom: '20px',
                textAlign: 'center',
                filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
              }}>
                {card.icon}
              </div>

              {/* Title */}
              <h3 style={{
                fontSize: '1.4rem',
                fontWeight: '700',
                color: '#2c3e50',
                marginBottom: '12px',
                textAlign: 'center',
                lineHeight: '1.3'
              }}>
                {card.title}
              </h3>

              {/* Description */}
              <p style={{
                color: '#6c757d',
                lineHeight: '1.6',
                textAlign: 'center',
                marginBottom: '16px',
                fontSize: '0.95rem'
              }}>
                {card.description}
              </p>

              {/* Stats */}
              <div style={{
                textAlign: 'center',
                padding: '12px',
                background: `linear-gradient(135deg, ${card.color}10, ${card.color}05)`,
                borderRadius: '12px',
                border: `1px solid ${card.color}20`,
                position: 'relative'
              }}>
                <span style={{
                  color: card.color,
                  fontWeight: '700',
                  fontSize: '0.9rem'
                }}>
                  {card.stats}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* System Status */}
      <div style={{
        background: 'white',
        padding: '32px',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        border: '1px solid rgba(76, 175, 80, 0.2)',
        textAlign: 'center'
      }}>
        <h3 style={{
          color: '#2E7D32',
          marginBottom: '16px',
          fontSize: '1.3rem',
          fontWeight: '700'
        }}>
          🔐 Panel de Control Administrativo
        </h3>
        <p style={{
          color: '#6c757d',
          margin: 0,
          lineHeight: '1.6'
        }}>
          Solo los administradores pueden acceder a estas funciones.
          Todas las acciones quedan registradas en el sistema para auditoría y seguridad.
        </p>
        <div style={{
          marginTop: '20px',
          padding: '16px',
          background: 'linear-gradient(135deg, #4CAF5010, #2E7D3210)',
          borderRadius: '12px',
          border: '1px solid #4CAF5020'
        }}>
          <span style={{
            color: '#2E7D32',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}>
            🟢 Sistema operativo • Última actualización: {new Date().toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;