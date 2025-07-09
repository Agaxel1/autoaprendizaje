import React, { useState, useEffect, useCallback } from 'react';
import { useFuncion } from '../context/FuncionContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { useAuth } from '../context/AuthContext';
import '../CSS/CourseList.css';

const CourseList = () => {
  const { fetchCourses, fetchStudentCourses, fetchTeacherCourses } = useFuncion();
  const { currentRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estados mejorados para búsqueda
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [allCourses, setAllCourses] = useState([]); // Todos los cursos sin filtrar
  const coursesPerPage = 20;

  // Verificar roles basado en el rol actual seleccionado
  const isAdmin = currentRole === 'administrador';
  const isTeacher = currentRole === 'docente';
  const isStudent = currentRole === 'estudiante';

  // Función simple para obtener color del curso
  const getCourseColor = useCallback(() => {
    return '4CAF50'; // Color verde para todos los cursos
  }, []);

  // Función para determinar el estado del estudiante
  const getStudentStatus = (estado) => {
    const statusMap = {
      'inscrito': { text: 'Inscrito', color: 'blue' },
      'activo': { text: 'Activo', color: 'green' },
      'completado': { text: 'Completado', color: 'success' },
      'retirado': { text: 'Retirado', color: 'red' },
      'suspendido': { text: 'Suspendido', color: 'orange' }
    };
    return statusMap[estado] || { text: 'Desconocido', color: 'gray' };
  };

  const getCourses = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      let data = [];

      if (isAdmin) {
        data = await fetchCourses({ page, limit: coursesPerPage });
        data = data.courses;
      } else if (isTeacher) {
        data = await fetchTeacherCourses({ page, limit: coursesPerPage });
      } else if (isStudent) {
        data = await fetchStudentCourses({ page, limit: coursesPerPage });
      } else {
        console.warn('⚠️ Rol no reconocido, usando vista de estudiante por defecto');
        data = await fetchStudentCourses({ page, limit: coursesPerPage });
      }
      
      const transformedCourses = data.map(course => {
        const courseData = course.curso || course;

        const baseData = {
          id: courseData.id,
          title: courseData.nombre,
          description: courseData.descripcion,
          code: courseData.codigo_curso,
          minExamPercentage: parseFloat(courseData.porcentaje_minimo_examen),
          active: courseData.activo,
          createdBy: courseData.creado_por,
          createdAt: courseData.fecha_creacion,
          updatedAt: courseData.fecha_actualizacion,
          category: 'Curso', // Categoría simple para todos los cursos
          //image: `https://via.placeholder.com/400x250/${getCourseColor()}/ffffff?text=${encodeURIComponent(courseData.codigo_curso)}`,
          image: `https://api.vida-roleplay.es/imagenes/back1.png`,
          featured: courseData.id % 5 === 0
        };

        if (isAdmin) {
          return {
            ...baseData,
            totalStudents: Math.floor(Math.random() * 200) + 20,
            totalTeachers: Math.floor(Math.random() * 3) + 1,
            averageGrade: (Math.random() * 20 + 75).toFixed(1)
          };
        } else if (isTeacher) {
          return {
            ...baseData,
            myStudents: Math.floor(Math.random() * 50) + 5,
            assignmentType: course.tipo_asignacion || 'titular',
            assignmentDate: course.fecha_asignacion,
            averageGrade: (Math.random() * 20 + 75).toFixed(1),
            isActive: course.activo !== undefined ? course.activo : true
          };
        } else if (isStudent) {
          return {
            ...baseData,
            enrollmentStatus: course.estado || 'inscrito',
            finalGrade: course.nota_final ? parseFloat(course.nota_final) : null,
            enrollmentDate: course.fecha_inscripcion ? new Date(course.fecha_inscripcion) : new Date(),
            statusDate: course.fecha_estado ? new Date(course.fecha_estado) : new Date(),
            progress: course.nota_final ? Math.min(100, parseFloat(course.nota_final)) : Math.floor(Math.random() * 100)
          };
        }

        return baseData;
      });

      setAllCourses(transformedCourses);

    } catch (err) {
      console.error('Error fetching courses:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [
    isAdmin,
    isTeacher,
    isStudent,
    coursesPerPage,
    getCourseColor,
    fetchCourses,
    fetchTeacherCourses,
    fetchStudentCourses
  ]);

  // Efecto para cargar cursos cuando cambia el rol
  useEffect(() => {
    getCourses(currentPage);
  }, [currentRole, currentPage, getCourses]);

  // Efecto para debouncing del término de búsqueda
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Efecto para resetear la página cuando cambia la búsqueda
  useEffect(() => {
    if (debouncedSearchTerm !== searchTerm) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, searchTerm]);

  // Filtrar cursos localmente por búsqueda (más fluido)
  const filteredCourses = allCourses.filter(course => {
    if (!debouncedSearchTerm.trim()) return true;

    const searchLower = debouncedSearchTerm.toLowerCase().trim();
    return (
      course.title.toLowerCase().includes(searchLower) ||
      course.code.toLowerCase().includes(searchLower) ||
      (course.description && course.description.toLowerCase().includes(searchLower))
    );
  });

  // Paginación local de cursos filtrados
  const startIndex = (currentPage - 1) * coursesPerPage;
  const endIndex = startIndex + coursesPerPage;
  const paginatedCourses = filteredCourses.slice(startIndex, endIndex);

  // Calcular páginas basado en cursos filtrados
  const totalPages = Math.ceil(filteredCourses.length / coursesPerPage);

  // Manejar reintento en caso de error
  const handleRetry = () => {
    getCourses(currentPage);
  };

  // Manejar cambio de búsqueda
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    // Resetear página solo si hay término de búsqueda
    if (value.trim()) {
      setCurrentPage(1);
    }
  };

  // Función para obtener mensaje de no resultados según el rol
  const getNoResultsMessage = () => {
    if (isStudent) return 'No tienes cursos asignados en este momento. Contacta al administrador para más información.';
    if (isTeacher) return 'No tienes cursos asignados como docente.';
    if (isAdmin) return 'No hay cursos disponibles en este momento.';
    return 'No se encontraron cursos.';
  };

  if (loading) {
    return <LoadingSpinner message="Cargando cursos..." />;
  }

  if (error) {
    return (
      <div className="courses-container">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar los cursos</h3>
          <p>{error}</p>
          <button onClick={handleRetry} className="retry-btn">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* Header simplificado */}
      <div className="page-header">
        <h1 className="page-title">
          {isAdmin ? 'Gestión de Cursos' : isTeacher ? 'Mis Cursos' : 'Mis Cursos'}
        </h1>
        <p className="page-subtitle">
          {isAdmin ? 'Administra todos los cursos de la plataforma' :
            isTeacher ? 'Gestiona tus cursos asignados' :
              'Accede a tus cursos y revisa tu progreso'}
        </p>
      </div>

      {/* Barra de herramientas */}
      <div className="toolbar">
        <div className="search-container">
          <div className="search-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>
        </div>
      </div>

      {/* Estadísticas compactas */}
      {(isAdmin || isTeacher) && allCourses.length > 0 && (
        <div className="stats-bar">
          {isAdmin && (
            <>
              <div className="stat-item">
                <span className="stat-number">{filteredCourses.length}</span>
                <span className="stat-label">Cursos {searchTerm ? 'encontrados' : ''}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{allCourses.reduce((sum, course) => sum + (course.totalStudents || 0), 0).toLocaleString()}</span>
                <span className="stat-label">Estudiantes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{allCourses.reduce((sum, course) => sum + (course.totalTeachers || 0), 0)}</span>
                <span className="stat-label">Docentes</span>
              </div>
            </>
          )}
          {isTeacher && (
            <>
              <div className="stat-item">
                <span className="stat-number">{filteredCourses.length}</span>
                <span className="stat-label">Mis Cursos {searchTerm ? 'encontrados' : ''}</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{allCourses.reduce((sum, course) => sum + (course.myStudents || 0), 0)}</span>
                <span className="stat-label">Estudiantes</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{allCourses.filter(c => c.averageGrade >= 80).length}</span>
                <span className="stat-label">Exitosos</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid de cursos */}
      <div className="courses-grid">
        {paginatedCourses.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">📚</div>
            <h3>{searchTerm ? 'No se encontraron cursos' : 'No hay cursos disponibles'}</h3>
            <p>
              {searchTerm
                ? `No se encontraron cursos que coincidan con "${searchTerm}"`
                : getNoResultsMessage()
              }
            </p>
            {searchTerm && (
              <button
                className="no-results-action"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        ) : (
          paginatedCourses.map(course => {
            const studentStatus = isStudent ? getStudentStatus(course.enrollmentStatus) : null;

            return (
              <div key={course.id} className={`course-card ${course.featured ? 'featured' : ''} ${!course.active ? 'inactive' : ''} ${studentStatus ? 'enrolled' : ''}`}>
                {course.featured && <div className="featured-badge">Destacado</div>}
                {!course.active && <div className="inactive-badge">Inactivo</div>}
                {studentStatus && <div className={`status-badge ${studentStatus.color}`}>{studentStatus.text}</div>}

                <div className="course-image">
                  <img src={course.image} alt={course.title} />
                  <div className="course-overlay">
                    <button className="preview-btn">
                      {isAdmin ? 'Gestionar' : isTeacher ? 'Enseñar' : 'Acceder'}
                    </button>
                  </div>
                </div>

                <div className="course-content">
                  <div className="course-meta">
                    <span className="course-code">{course.code}</span>
                  </div>

                  <h3 className="course-title">{course.title}</h3>
                  <p className="course-description">{course.description}</p>

                  {/* Vista de Administrador */}
                  {isAdmin && (
                    <>
                      <div className="course-details">
                        <div className="detail-item">
                          <span className="detail-label">Porcentaje mínimo:</span>
                          <span className="detail-value">{course.minExamPercentage}%</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Creado por:</span>
                          <span className="detail-value">Usuario {course.createdBy}</span>
                        </div>
                      </div>

                      <div className="course-stats">
                        <div className="stat">
                          <span className="icon">👥</span>
                          <span>{course.totalStudents} estudiantes</span>
                        </div>
                        <div className="stat">
                          <span className="icon">👨‍🏫</span>
                          <span>{course.totalTeachers} docentes</span>
                        </div>
                        <div className="stat">
                          <span className="icon">📊</span>
                          <span>{course.averageGrade}% promedio</span>
                        </div>
                      </div>

                      <div className="course-footer">
                        <div className="course-status">
                          <span className={`status-indicator ${course.active ? 'active' : 'inactive'}`}>
                            {course.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <button className="enroll-btn admin-btn">
                          Gestionar
                        </button>
                      </div>
                    </>
                  )}

                  {/* Vista de Docente */}
                  {isTeacher && (
                    <>
                      <div className="course-details">
                        <div className="detail-item">
                          <span className="detail-label">Tipo de asignación:</span>
                          <span className="detail-value">{course.assignmentType === 'titular' ? 'Titular' : 'Asistente'}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Porcentaje mínimo:</span>
                          <span className="detail-value">{course.minExamPercentage}%</span>
                        </div>
                      </div>

                      <div className="course-stats">
                        <div className="stat">
                          <span className="icon">👥</span>
                          <span>{course.myStudents} estudiantes</span>
                        </div>
                        <div className="stat">
                          <span className="icon">📊</span>
                          <span>{course.averageGrade}% promedio</span>
                        </div>
                        <div className="stat">
                          <span className="icon">🎓</span>
                          <span>{course.assignmentType}</span>
                        </div>
                      </div>

                      <div className="course-footer">
                        <div className="course-status">
                          <span className={`status-indicator ${course.active ? 'active' : 'inactive'}`}>
                            {course.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                        <button className="enroll-btn teacher-btn" disabled={!course.active}>
                          {course.active ? 'Enseñar' : 'No Disponible'}
                        </button>
                      </div>
                    </>
                  )}

                  {/* Vista de Estudiante */}
                  {isStudent && (
                    <>
                      <div className="student-info">
                        <div className="enrollment-details">
                          <div className="detail-item">
                            <span className="detail-label">Estado:</span>
                            <span className={`detail-value status-${studentStatus.color}`}>
                              {studentStatus.text}
                            </span>
                          </div>
                          <div className="detail-item">
                            <span className="detail-label">Fecha de inscripción:</span>
                            <span className="detail-value">
                              {course.enrollmentDate ? course.enrollmentDate.toLocaleDateString() : 'No disponible'}
                            </span>
                          </div>
                        </div>

                        {course.enrollmentStatus === 'activo' && (
                          <div className="student-progress">
                            <div className="progress-header">
                              <span className="progress-label">Progreso del curso</span>
                              <span className="progress-percentage">{course.progress}%</span>
                            </div>
                            <div className="progress-bar">
                              <div
                                className="progress-fill"
                                style={{ width: `${course.progress}%` }}
                              ></div>
                            </div>
                          </div>
                        )}

                        {course.finalGrade !== null && course.finalGrade !== undefined && (
                          <div className="final-grade">
                            <span className="grade-label">Nota final:</span>
                            <span className={`grade-value ${course.finalGrade >= course.minExamPercentage ? 'passed' : 'failed'}`}>
                              {course.finalGrade}%
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="course-stats">
                        <div className="stat">
                          <span className="icon">🎯</span>
                          <span>{course.minExamPercentage}% mínimo</span>
                        </div>
                        <div className="stat">
                          <span className="icon">📅</span>
                          <span>{course.enrollmentDate ? course.enrollmentDate.toLocaleDateString() : 'Sin fecha'}</span>
                        </div>
                        <div className="stat">
                          <span className="icon">📈</span>
                          <span>{course.finalGrade || course.progress || 0}% progreso</span>
                        </div>
                      </div>

                      <div className="course-footer">
                        <div className="course-status">
                          <span className={`status-indicator ${course.enrollmentStatus}`}>
                            {studentStatus.text}
                          </span>
                        </div>
                        <button
                          className="enroll-btn student-btn"
                          disabled={course.enrollmentStatus === 'completado' || course.enrollmentStatus === 'retirado'}
                        >
                          {course.enrollmentStatus === 'activo' ? 'Continuar' :
                            course.enrollmentStatus === 'completado' ? 'Completado' :
                              course.enrollmentStatus === 'retirado' ? 'Retirado' : 'Acceder'}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            ← Anterior
          </button>

          <div className="pagination-info">
            <span>Página {currentPage} de {totalPages}</span>
            <span className="total-courses">
              ({filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''}
              {searchTerm ? ` encontrado${filteredCourses.length !== 1 ? 's' : ''}` : ' total'})
            </span>
          </div>

          <button
            className="pagination-btn"
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Siguiente →
          </button>
        </div>
      )}
    </div>
  );
};

export default CourseList;