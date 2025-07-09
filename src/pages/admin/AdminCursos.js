// pages/admin/AdminCursos.jsx - Versión con búsqueda completamente frontend
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFuncion } from '../../context/FuncionContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminCursos = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('todos');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estados para los datos
  const [allCourses, setAllCourses] = useState([]); // Todos los cursos del backend
  const [courseStats, setCourseStats] = useState({
    total: 0,
    active: 0,
    totalStudents: 0,
    averageStudents: 0
  });

  // Configuración de paginación
  const ITEMS_PER_PAGE = 20;

  // Estados para el formulario
  const [formData, setFormData] = useState({
    codigo_curso: '',
    nombre: '',
    descripcion: '',
    porcentaje_minimo_examen: 70,
    activo: true
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Estados para estudiantes del curso
  const [courseStudents, setCourseStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);

  const {
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
    getCourseStudents
  } = useFuncion();

  // Cargar todos los cursos una sola vez
  const loadAllCourses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Obtener todos los cursos sin filtros de búsqueda
      const data = await fetchCourses({ page: 1, limit: 1000 }); // Un límite alto para obtener todos

      // AJUSTE: Tu backend devuelve directamente un array
      const coursesArray = Array.isArray(data) ? data : (data.courses || []);

      setAllCourses(coursesArray);

      // Calcular estadísticas basadas en todos los cursos
      const activeCount = coursesArray.filter(c => c.activo).length;
      const totalStudents = coursesArray.reduce((sum, c) => {
        const students = parseInt(c.total_estudiantes) || 0;
        return sum + students;
      }, 0);

      setCourseStats({
        total: coursesArray.length,
        active: activeCount,
        totalStudents,
        averageStudents: coursesArray.length > 0 ? Math.round(totalStudents / coursesArray.length) : 0
      });

    } catch (err) {
      console.error('Error cargando cursos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetchCourses]);

  // Función para filtrar cursos localmente
  const getFilteredCourses = useCallback(() => {
    let filtered = [...allCourses];

    // Filtrar por término de búsqueda
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(course => {
        return (
          course.nombre.toLowerCase().includes(searchLower) ||
          course.codigo_curso.toLowerCase().includes(searchLower) ||
          (course.descripcion && course.descripcion.toLowerCase().includes(searchLower)) ||
          (course.docentes_principales && course.docentes_principales.toLowerCase().includes(searchLower))
        );
      });
    }

    // Filtrar por estado
    if (filterStatus !== 'todos') {
      if (filterStatus === 'activo') {
        filtered = filtered.filter(course => course.activo);
      } else if (filterStatus === 'inactivo') {
        filtered = filtered.filter(course => !course.activo);
      }
    }

    return filtered;
  }, [allCourses, searchTerm, filterStatus]);

  // Función para obtener cursos paginados
  const getPaginatedCourses = useCallback(() => {
    const filtered = getFilteredCourses();
    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

    // Ajustar página actual si está fuera de rango
    const validPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
    if (validPage !== currentPage) {
      setCurrentPage(validPage);
    }

    const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const paginatedCourses = filtered.slice(startIndex, endIndex);

    return {
      courses: paginatedCourses,
      pagination: {
        page: validPage,
        limit: ITEMS_PER_PAGE,
        total: filtered.length,
        totalPages: totalPages,
        hasNext: validPage < totalPages,
        hasPrev: validPage > 1
      }
    };
  }, [getFilteredCourses, currentPage]);

  // Efectos
  useEffect(() => {
    loadAllCourses();
  }, [loadAllCourses]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterStatus, currentPage]);

  // Obtener datos paginados actuales
  const { courses: displayCourses, pagination } = getPaginatedCourses();

  // Manejar formulario
  const handleFormChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpiar error del campo
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.codigo_curso) {
      errors.codigo_curso = 'Código del curso es requerido';
    }

    if (!formData.nombre) {
      errors.nombre = 'Nombre del curso es requerido';
    }

    if (!formData.descripcion) {
      errors.descripcion = 'Descripción es requerida';
    }

    if (
      formData.porcentaje_minimo_examen < 0 ||
      formData.porcentaje_minimo_examen > 100
    ) {
      errors.porcentaje_minimo_examen = 'El porcentaje debe estar entre 0 y 100';
    }

    if (typeof formData.activo !== 'boolean') {
      errors.activo = 'El estado activo/inactivo es inválido';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setSubmitting(true);

    try {
      if (selectedCourse) {
        // Editar curso
        await updateCourse(selectedCourse.id, formData);
      } else {
        // Crear curso
        await createCourse(formData);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      resetForm();

      // Recargar todos los cursos
      await loadAllCourses();

    } catch (err) {
      console.error('Error guardando curso:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      codigo_curso: '',
      nombre: '',
      descripcion: '',
      porcentaje_minimo_examen: 70
    });
    setFormErrors({});
    setSelectedCourse(null);
  };

  const handleEdit = (course) => {
    setSelectedCourse(course);
    setFormData({
      codigo_curso: course.codigo_curso,
      nombre: course.nombre,
      descripcion: course.descripcion || '',
      porcentaje_minimo_examen: course.porcentaje_minimo_examen || 70,
      activo: course.activo || false
    });
    setShowEditModal(true);
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este curso?')) {
      return;
    }

    try {
      await deleteCourse(courseId);
      await loadAllCourses(); // Recargar todos los cursos
    } catch (err) {
      console.error('Error eliminando curso:', err);
      setError(err.message);
    }
  };

  const handleViewStudents = async (course) => {
    setSelectedCourse(course);
    setStudentsLoading(true);
    try {
      const studentsData = await getCourseStudents(course.id, { page: 1, limit: 50 });
      setCourseStudents(studentsData || []);
      setShowStudentsModal(true);
    } catch (err) {
      console.error('Error cargando estudiantes:', err);
      setError(err.message);
    } finally {
      setStudentsLoading(false);
    }
  };

  const getStatusColor = (estado) => {
    return estado ? '#4CAF50' : '#f44336';
  };

  const getStatusText = (estado) => {
    return estado ? 'Activo' : 'Inactivo';
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  // Limpiar búsqueda
  const clearSearch = () => {
    setSearchTerm('');
    setFilterStatus('todos');
  };

  if (error && !allCourses.length) {
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
          <h2 style={{ color: '#f44336', marginBottom: '16px' }}>Error al cargar cursos</h2>
          <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
          <button
            onClick={() => loadAllCourses()}
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
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', minHeight: '100vh', background: '#f8f9fa' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <Link to="/admin" style={{
          textDecoration: 'none',
          color: '#6c757d',
          fontSize: '14px',
          fontWeight: '500',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '16px'
        }}>
          ← Volver al Dashboard
        </Link>

        <div style={{
          background: 'white',
          padding: '32px',
          borderRadius: '20px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          border: '1px solid rgba(0, 0, 0, 0.05)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
            <div style={{ fontSize: '3rem' }}>📚</div>
            <div>
              <h1 style={{
                fontSize: '2.2rem',
                color: '#2E7D32',
                marginBottom: '8px',
                fontWeight: '800'
              }}>
                Gestionar Cursos
              </h1>
              <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
                Crea, edita y organiza cursos y contenido educativo
              </p>
            </div>
          </div>

          {error && (
            <div style={{
              background: '#ffebee',
              border: '1px solid #f44336',
              color: '#d32f2f',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '16px'
            }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div style={{
        background: 'white',
        padding: '24px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
        marginBottom: '24px',
        display: 'flex',
        gap: '20px',
        alignItems: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ flex: 1, minWidth: '300px', position: 'relative' }}>
          <input
            type="text"
            placeholder="🔍 Buscar por nombre, código o descripción..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              paddingRight: searchTerm ? '40px' : '16px',
              border: '2px solid #e9ecef',
              borderRadius: '12px',
              fontSize: '16px',
              outline: 'none',
              transition: 'all 0.3s ease',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = '#4CAF50'}
            onBlur={(e) => e.target.style.borderColor = '#e9ecef'}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#6c757d',
                padding: '4px'
              }}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            border: '2px solid #e9ecef',
            borderRadius: '12px',
            fontSize: '16px',
            outline: 'none',
            minWidth: '150px',
            cursor: 'pointer'
          }}
        >
          <option value="todos">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        {(searchTerm || filterStatus !== 'todos') && (
          <button
            onClick={clearSearch}
            style={{
              background: '#6c757d',
              color: 'white',
              border: 'none',
              padding: '12px 20px',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            Limpiar
          </button>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = 'none';
          }}
        >
          <span style={{ fontSize: '18px' }}>+</span>
          Nuevo Curso
        </button>
      </div>

      {/* Estadísticas */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '16px',
        marginBottom: '24px'
      }}>
        {[
          { label: 'Total Cursos', value: courseStats.total, icon: '📚', color: '#2196F3' },
          { label: 'Activos', value: courseStats.active, icon: '✅', color: '#4CAF50' },
          { label: 'Estudiantes', value: courseStats.totalStudents, icon: '🎓', color: '#9C27B0' },
          { label: 'Promedio por Curso', value: courseStats.averageStudents, icon: '📊', color: '#FF9800' }
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'white',
            padding: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)',
            textAlign: 'center',
            border: `2px solid ${stat.color}20`
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.9rem', color: '#6c757d' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Indicador de filtros activos */}
      {(searchTerm || filterStatus !== 'todos') && (
        <div style={{
          background: '#e3f2fd',
          border: '1px solid #2196f3',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          fontSize: '14px',
          color: '#1976d2'
        }}>
          <span>🔍</span>
          <span>
            Mostrando {pagination.total} de {allCourses.length} cursos
            {searchTerm && ` con "${searchTerm}"`}
            {filterStatus !== 'todos' && ` (${filterStatus}s)`}
          </span>
        </div>
      )}

      {/* Lista/Grid de Cursos */}
      {loading && allCourses.length === 0 ? (
        <LoadingSpinner message="Cargando cursos..." />
      ) : (
        <>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
            gap: '24px'
          }}>
            {displayCourses.map((curso) => (
              <div key={curso.id} style={{
                background: 'white',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden',
                transition: 'all 0.3s ease',
                border: '1px solid rgba(0, 0, 0, 0.05)'
              }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = 'translateY(-8px)';
                  e.currentTarget.style.boxShadow = '0 16px 40px rgba(0, 0, 0, 0.15)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
                }}
              >
                {/* Header del curso */}
                <div style={{
                  background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                  padding: '20px',
                  color: 'white'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '2rem' }}>📚</div>
                    <span style={{
                      background: `${getStatusColor(curso.activo)}`,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '600',
                      textTransform: 'capitalize'
                    }}>
                      {getStatusText(curso.activo)}
                    </span>
                  </div>
                  <h3 style={{
                    margin: 0,
                    fontSize: '1.3rem',
                    fontWeight: '700',
                    marginBottom: '8px'
                  }}>
                    {curso.nombre}
                  </h3>
                  <p style={{
                    margin: 0,
                    opacity: 0.9,
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}>
                    Código: {curso.codigo_curso}
                  </p>
                </div>

                {/* Contenido del curso */}
                <div style={{ padding: '20px' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📝</span>
                      <div>
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>Descripción:</span>
                        <p style={{ color: '#6c757d', margin: '4px 0 0 0', fontSize: '0.9rem', lineHeight: '1.4' }}>
                          {curso.descripcion || 'Sin descripción'}
                        </p>
                      </div>
                    </div>

                    {/* Mostrar docentes si tienes el campo */}
                    {curso.docentes_principales && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <span style={{ fontSize: '1.2rem' }}>👨‍🏫</span>
                        <span style={{ fontWeight: '600', color: '#2c3e50' }}>Docentes:</span>
                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>{curso.docentes_principales}</span>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>🎓</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>Estudiantes:</span>
                      <span style={{ color: '#6c757d' }}>{parseInt(curso.total_estudiantes) || 0}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '1.2rem' }}>📊</span>
                      <span style={{ fontWeight: '600', color: '#2c3e50' }}>Porcentaje mínimo:</span>
                      <span style={{ color: '#6c757d' }}>{parseFloat(curso.porcentaje_minimo_examen) || 70}%</span>
                    </div>
                  </div>

                  <div style={{
                    background: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                  }}>
                    <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                      Creado el: {new Date(curso.fecha_creacion).toLocaleDateString()}
                    </div>
                    {curso.creado_por_nombre && (
                      <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
                        Por: {curso.creado_por_nombre}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => handleEdit(curso)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => handleViewStudents(curso)}
                      style={{
                        flex: 1,
                        background: 'linear-gradient(135deg, #FF9800, #F57C00)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      👥 Estudiantes
                    </button>
                    <button
                      onClick={() => handleDelete(curso.id)}
                      style={{
                        background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                        color: 'white',
                        border: 'none',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        fontSize: '14px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                      onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                      onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div style={{
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '12px',
              marginTop: '24px'
            }}>
              <button
                disabled={!pagination.hasPrev}
                onClick={() => handlePageChange(currentPage - 1)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid #e9ecef',
                  borderRadius: '6px',
                  cursor: pagination.hasNext ? 'pointer' : 'not-allowed',
                  opacity: pagination.hasNext ? 1 : 0.5,
                  background: 'white'
                }}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {displayCourses.length === 0 && !loading && (
        <div style={{
          background: 'white',
          padding: '60px 20px',
          borderRadius: '16px',
          textAlign: 'center',
          color: '#6c757d',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
          <h3>No se encontraron cursos</h3>
          <p>
            {searchTerm || filterStatus !== 'todos'
              ? 'Intenta cambiar los filtros de búsqueda'
              : 'No hay cursos disponibles'
            }
          </p>
          {(searchTerm || filterStatus !== 'todos') && (
            <button
              onClick={clearSearch}
              style={{
                background: '#2196F3',
                color: 'white',
                border: 'none',
                padding: '12px 24px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '600',
                marginTop: '16px'
              }}
            >
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {/* Modal Agregar/Editar Curso */}
      {(showAddModal || showEditModal) && (
        <div className="modal-overlay" onClick={() => {
          setShowAddModal(false);
          setShowEditModal(false);
          resetForm();
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCourse ? 'Editar Curso' : 'Nuevo Curso'}</h2>
              <button
                className="modal-close"
                onClick={() => {
                  setShowAddModal(false);
                  setShowEditModal(false);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="course-form">
              <div className="form-group">
                <label htmlFor="codigo_curso">Código del Curso *</label>
                <input
                  type="text"
                  id="codigo_curso"
                  value={formData.codigo_curso}
                  onChange={(e) => handleFormChange('codigo_curso', e.target.value)}
                  placeholder="Ej: MAT-101"
                  required
                  className={formErrors.codigo_curso ? 'input-error' : ''}
                />
                {formErrors.codigo_curso && (
                  <div className="error-text">{formErrors.codigo_curso}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="nombre">Nombre del Curso *</label>
                <input
                  type="text"
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => handleFormChange('nombre', e.target.value)}
                  placeholder="Ej: Matemáticas Avanzadas"
                  required
                  className={formErrors.nombre ? 'input-error' : ''}
                />
                {formErrors.nombre && (
                  <div className="error-text">{formErrors.nombre}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="descripcion">Descripción *</label>
                <textarea
                  id="descripcion"
                  value={formData.descripcion}
                  onChange={(e) => handleFormChange('descripcion', e.target.value)}
                  placeholder="Descripción del curso..."
                  rows="4"
                  required
                  className={formErrors.descripcion ? 'input-error' : ''}
                />
                {formErrors.descripcion && (
                  <div className="error-text">{formErrors.descripcion}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="porcentaje_minimo_examen">Porcentaje Mínimo para Aprobar (%)</label>
                <input
                  type="number"
                  id="porcentaje_minimo_examen"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.porcentaje_minimo_examen}
                  onChange={(e) => handleFormChange('porcentaje_minimo_examen', parseFloat(e.target.value) || 0)}
                  placeholder="70"
                  className={formErrors.porcentaje_minimo_examen ? 'input-error' : ''}
                />
                {formErrors.porcentaje_minimo_examen && (
                  <div className="error-text">{formErrors.porcentaje_minimo_examen}</div>
                )}
              </div>

              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.activo}
                    onChange={(e) => handleFormChange('activo', e.target.checked)}
                  />
                  <span className="checkbox-text">Curso activo</span>
                </label>
                <small className="form-hint">Los cursos inactivos no serán visibles para estudiantes</small>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    resetForm();
                  }}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={submitting}
                >
                  {submitting ? 'Guardando...' : selectedCourse ? 'Actualizar' : 'Crear Curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Modal Ver Estudiantes */}
      {showStudentsModal && selectedCourse && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '32px',
            maxWidth: '800px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <h2 style={{ marginBottom: '24px', color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.5rem' }}>👥</span>
              Estudiantes de {selectedCourse.nombre}
            </h2>

            {studentsLoading ? (
              <LoadingSpinner message="Cargando estudiantes..." />
            ) : (
              <>
                {courseStudents.length > 0 ? (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8f9fa' }}>
                          <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600', color: '#2c3e50' }}>
                            Estudiante
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>
                            Estado
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>
                            Nota Final
                          </th>
                          <th style={{ padding: '12px', textAlign: 'center', fontWeight: '600', color: '#2c3e50' }}>
                            Fecha Inscripción
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {courseStudents.map((student) => (
                          <tr key={student.id} style={{ borderBottom: '1px solid #f1f3f4' }}>
                            <td style={{ padding: '12px' }}>
                              <div>
                                <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                  {student.nombres} {student.apellidos}
                                </div>
                                <div style={{ fontSize: '12px', color: '#6c757d' }}>
                                  {student.email}
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center' }}>
                              <span style={{
                                background: student.estado === 'inscrito' ? '#4CAF5020' :
                                  student.estado === 'completado' ? '#2196F320' : '#FF980020',
                                color: student.estado === 'inscrito' ? '#4CAF50' :
                                  student.estado === 'completado' ? '#2196F3' : '#FF9800',
                                padding: '4px 8px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: '600',
                                textTransform: 'capitalize'
                              }}>
                                {student.estado}
                              </span>
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#6c757d' }}>
                              {student.nota_final ? `${student.nota_final}%` : '-'}
                            </td>
                            <td style={{ padding: '12px', textAlign: 'center', color: '#6c757d' }}>
                              {new Date(student.fecha_inscripcion).toLocaleDateString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>👤</div>
                    <h3>No hay estudiantes inscritos</h3>
                    <p>Este curso aún no tiene estudiantes asignados</p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedCourse(null);
                  setCourseStudents([]);
                }}
                style={{
                  padding: '12px 24px',
                  border: '2px solid #e9ecef',
                  borderRadius: '8px',
                  background: 'white',
                  color: '#6c757d',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: '600'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCursos;