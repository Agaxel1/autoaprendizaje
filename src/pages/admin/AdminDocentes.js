// pages/admin/AdminDocentes.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useFuncion } from '../../context/FuncionContext';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminDocentes = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('todos');
    const [filterAssignmentType, setFilterAssignmentType] = useState('todos');
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCoursesModal, setShowCoursesModal] = useState(false);
    const [selectedTeacher, setSelectedTeacher] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estados para los datos
    const [allTeachers, setAllTeachers] = useState([]);
    const [allCourses, setAllCourses] = useState([]); // Para el dropdown de asignación
    const [teacherStats, setTeacherStats] = useState({
        total: 0,
        active: 0,
        titular: 0,
        asistente: 0,
        colaborador: 0,
        totalCourses: 0
    });

    // Configuración de paginación
    const ITEMS_PER_PAGE = 20;

    // Estados para el formulario de asignación
    const [assignFormData, setAssignFormData] = useState({
        curso_id: '',
        usuario_id: '',
        tipo_asignacion: 'titular',
        activo: true
    });
    const [assignFormErrors, setAssignFormErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);

    // Estados para editar asignación
    const [editFormData, setEditFormData] = useState({
        tipo_asignacion: 'titular',
        activo: true
    });

    // Estados para cursos del docente
    const [coursesLoading, setCoursesLoading] = useState(false);
    const [fromCoursesModal, setFromCoursesModal] = useState(false); // Nuevo estado para rastrear el origen

    const {
        fetchTeachers,
        fetchCourses,
        assignTeacherToCourse,
        updateTeacherAssignment,
        removeTeacherFromCourse,
        getTeacherCourses
    } = useFuncion();

    // Función helper para actualizar los datos del docente seleccionado
    const updateSelectedTeacher = async () => {
        if (showCoursesModal && selectedTeacher) {
            try {
                const updatedTeachers = await fetchTeachers({ page: 1, limit: 1000 });
                const teachersArray = Array.isArray(updatedTeachers) ? updatedTeachers : (updatedTeachers.teachers || []);
                const updatedTeacher = teachersArray.find(t => t.id === selectedTeacher.id);
                if (updatedTeacher) {
                    setSelectedTeacher(updatedTeacher);
                }
            } catch (err) {
                console.error('Error actualizando datos del docente seleccionado:', err);
            }
        }
    };

    // Función para obtener cursos disponibles para un docente específico
    const getAvailableCoursesForTeacher = useCallback((teacherId) => {
        if (!teacherId) return allCourses;

        const selectedTeacherData = allTeachers.find(t => t.id === parseInt(teacherId));
        if (!selectedTeacherData || !selectedTeacherData.asignaciones) {
            return allCourses;
        }

        // Obtener IDs de cursos donde el docente ya está asignado (activo o inactivo)
        const assignedCourseIds = selectedTeacherData.asignaciones.map(assignment => assignment.curso_id);

        // Filtrar cursos que NO están en las asignaciones del docente
        return allCourses.filter(course => !assignedCourseIds.includes(course.id));
    }, [allCourses, allTeachers]);

    // Cargar todos los docentes
    const loadAllTeachers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            // Obtener todos los docentes con sus asignaciones
            const data = await fetchTeachers({ page: 1, limit: 1000 });
            const teachersArray = Array.isArray(data) ? data : (data.teachers || []);

            setAllTeachers(teachersArray);

            // Calcular estadísticas
            const activeCount = teachersArray.filter(t => t.activo).length;
            const titularCount = teachersArray.filter(t =>
                t.asignaciones && t.asignaciones.some(a => a.tipo_asignacion === 'titular' && a.activo)
            ).length;
            const asistenteCount = teachersArray.filter(t =>
                t.asignaciones && t.asignaciones.some(a => a.tipo_asignacion === 'asistente' && a.activo)
            ).length;
            const colaboradorCount = teachersArray.filter(t =>
                t.asignaciones && t.asignaciones.some(a => a.tipo_asignacion === 'colaborador' && a.activo)
            ).length;
            const totalCourses = teachersArray.reduce((sum, t) => {
                return sum + (t.asignaciones ? t.asignaciones.filter(a => a.activo).length : 0);
            }, 0);

            setTeacherStats({
                total: teachersArray.length,
                active: activeCount,
                titular: titularCount,
                asistente: asistenteCount,
                colaborador: colaboradorCount,
                totalCourses
            });

        } catch (err) {
            console.error('Error cargando docentes:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [fetchTeachers]);

    // Cargar cursos disponibles para asignación
    const loadAvailableCourses = useCallback(async () => {
        try {
            const coursesData = await fetchCourses({ page: 1, limit: 1000 });
            const coursesArray = Array.isArray(coursesData) ? coursesData : (coursesData.courses || []);
            setAllCourses(coursesArray.filter(c => c.activo)); // Solo cursos activos
        } catch (err) {
            console.error('Error cargando cursos:', err);
        }
    }, [fetchCourses]);

    // Función para filtrar docentes localmente
    const getFilteredTeachers = useCallback(() => {
        let filtered = [...allTeachers];

        // Filtrar por término de búsqueda
        if (searchTerm.trim()) {
            const searchLower = searchTerm.toLowerCase().trim();
            filtered = filtered.filter(teacher => {
                return (
                    (teacher.nombres && teacher.nombres.toLowerCase().includes(searchLower)) ||
                    (teacher.apellidos && teacher.apellidos.toLowerCase().includes(searchLower)) ||
                    (teacher.email && teacher.email.toLowerCase().includes(searchLower)) ||
                    (teacher.cedula && teacher.cedula.includes(searchTerm)) ||
                    (teacher.codigo_institucional && teacher.codigo_institucional.includes(searchTerm)) ||
                    (teacher.asignaciones && teacher.asignaciones.some(a =>
                        a.curso_nombre && a.curso_nombre.toLowerCase().includes(searchLower)
                    ))
                );
            });
        }

        // Filtrar por estado
        if (filterStatus !== 'todos') {
            if (filterStatus === 'activo') {
                filtered = filtered.filter(teacher => teacher.activo);
            } else if (filterStatus === 'inactivo') {
                filtered = filtered.filter(teacher => !teacher.activo);
            }
        }

        // Filtrar por tipo de asignación
        if (filterAssignmentType !== 'todos') {
            filtered = filtered.filter(teacher =>
                teacher.asignaciones && teacher.asignaciones.some(a =>
                    a.tipo_asignacion === filterAssignmentType && a.activo
                )
            );
        }

        return filtered;
    }, [allTeachers, searchTerm, filterStatus, filterAssignmentType]);

    // Función para obtener docentes paginados
    const getPaginatedTeachers = useCallback(() => {
        const filtered = getFilteredTeachers();
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);

        const validPage = Math.min(Math.max(1, currentPage), Math.max(1, totalPages));
        if (validPage !== currentPage) {
            setCurrentPage(validPage);
        }

        const startIndex = (validPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const paginatedTeachers = filtered.slice(startIndex, endIndex);

        return {
            teachers: paginatedTeachers,
            pagination: {
                page: validPage,
                limit: ITEMS_PER_PAGE,
                total: filtered.length,
                totalPages: totalPages,
                hasNext: validPage < totalPages,
                hasPrev: validPage > 1
            }
        };
    }, [getFilteredTeachers, currentPage]);

    // Efectos
    useEffect(() => {
        loadAllTeachers();
        loadAvailableCourses();
    }, [loadAllTeachers, loadAvailableCourses]);

    // Resetear página cuando cambian los filtros
    useEffect(() => {
        if (currentPage !== 1) {
            setCurrentPage(1);
        }
    }, [searchTerm, filterStatus, filterAssignmentType, currentPage]);

    // Obtener datos paginados actuales
    const { teachers: displayTeachers, pagination } = getPaginatedTeachers();

    // Manejar formulario de asignación
    const handleAssignFormChange = (field, value) => {
        setAssignFormData(prev => ({
            ...prev,
            [field]: value
        }));

        if (assignFormErrors[field]) {
            setAssignFormErrors(prev => ({
                ...prev,
                [field]: null
            }));
        }
    };

    const validateAssignForm = () => {
        const errors = {};

        if (!assignFormData.curso_id) {
            errors.curso_id = 'Debe seleccionar un curso';
        }

        if (!assignFormData.usuario_id) {
            errors.usuario_id = 'Debe seleccionar un docente';
        }

        setAssignFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleAssignSubmit = async (e) => {
        e.preventDefault();

        if (!validateAssignForm()) return;

        setSubmitting(true);

        try {
            await assignTeacherToCourse(assignFormData.curso_id, assignFormData);
            setShowAssignModal(false);
            resetAssignForm();
            await loadAllTeachers();

            // Si venía del modal de cursos, actualizar datos y volver a abrirlo
            if (fromCoursesModal && selectedTeacher) {
                await updateSelectedTeacher();
                setShowCoursesModal(true);
                setFromCoursesModal(false); // Resetear el flag
            }
        } catch (err) {
            console.error('Error asignando docente:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const resetAssignForm = () => {
        setAssignFormData({
            curso_id: '',
            usuario_id: '',
            tipo_asignacion: 'titular',
            activo: true
        });
        setAssignFormErrors({});
    };

    const handleEditAssignment = (teacher, assignment) => {
        setSelectedTeacher({ ...teacher, selectedAssignment: assignment });
        setEditFormData({
            tipo_asignacion: assignment.tipo_asignacion,
            activo: assignment.activo
        });
        setShowEditModal(true);
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            await updateTeacherAssignment(
                selectedTeacher.selectedAssignment.id,
                editFormData
            );
            setShowEditModal(false);
            await loadAllTeachers();

            // Actualizar datos del docente seleccionado si el modal está abierto
            await updateSelectedTeacher();

            // Solo resetear selectedTeacher si no está el modal de cursos abierto
            if (!showCoursesModal) {
                setSelectedTeacher(null);
            }
        } catch (err) {
            console.error('Error actualizando asignación:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemoveAssignment = async (assignmentId) => {
        if (!window.confirm('¿Estás seguro de que quieres remover esta asignación?')) {
            return;
        }

        try {
            await removeTeacherFromCourse(assignmentId);
            await loadAllTeachers();

            // Actualizar datos del docente seleccionado si el modal está abierto
            await updateSelectedTeacher();
        } catch (err) {
            console.error('Error removiendo asignación:', err);
            setError(err.message);
        }
    };

    const handleViewCourses = async (teacher) => {
        setSelectedTeacher(teacher);
        setCoursesLoading(true);
        try {
            await getTeacherCourses(teacher.id);
            setShowCoursesModal(true);
        } catch (err) {
            console.error('Error cargando cursos del docente:', err);
            setError(err.message);
        } finally {
            setCoursesLoading(false);
        }
    };

    const getAssignmentTypeColor = (tipo) => {
        const colors = {
            'titular': '#4CAF50',
            'asistente': '#2196F3',
            'colaborador': '#FF9800'
        };
        return colors[tipo] || '#6c757d';
    };

    const getAssignmentTypeText = (tipo) => {
        const texts = {
            'titular': 'Titular',
            'asistente': 'Asistente',
            'colaborador': 'Colaborador'
        };
        return texts[tipo] || tipo;
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterStatus('todos');
        setFilterAssignmentType('todos');
    };

    if (error && !allTeachers.length) {
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
                    <h2 style={{ color: '#f44336', marginBottom: '16px' }}>Error al cargar docentes</h2>
                    <p style={{ color: '#6c757d', marginBottom: '24px' }}>{error}</p>
                    <button
                        onClick={() => loadAllTeachers()}
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
                        <div style={{ fontSize: '3rem' }}>👨‍🏫</div>
                        <div>
                            <h1 style={{
                                fontSize: '2.2rem',
                                color: '#2196F3',
                                marginBottom: '8px',
                                fontWeight: '800'
                            }}>
                                Gestionar Docentes
                            </h1>
                            <p style={{ color: '#6c757d', margin: 0, fontSize: '1.1rem' }}>
                                Administra docentes y sus asignaciones a cursos
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
                        placeholder="🔍 Buscar por nombre, email, código institucional o curso..."
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
                        onFocus={(e) => e.target.style.borderColor = '#2196F3'}
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

                <select
                    value={filterAssignmentType}
                    onChange={(e) => setFilterAssignmentType(e.target.value)}
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
                    <option value="todos">Todos los tipos</option>
                    <option value="titular">Titulares</option>
                    <option value="asistente">Asistentes</option>
                    <option value="colaborador">Colaboradores</option>
                </select>

                {(searchTerm || filterStatus !== 'todos' || filterAssignmentType !== 'todos') && (
                    <button
                        onClick={clearFilters}
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
                    onClick={() => {
                        setFromCoursesModal(false); // Resetear el flag ya que viene del botón general
                        setShowAssignModal(true);
                    }}
                    style={{
                        background: 'linear-gradient(135deg, #2196F3, #1976D2)',
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
                        e.target.style.boxShadow = '0 6px 20px rgba(33, 150, 243, 0.4)';
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                        e.target.style.boxShadow = 'none';
                    }}
                >
                    <span style={{ fontSize: '18px' }}>+</span>
                    Asignar Docente
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
                    { label: 'Total Docentes', value: teacherStats.total, icon: '👨‍🏫', color: '#2196F3' },
                    { label: 'Activos', value: teacherStats.active, icon: '✅', color: '#4CAF50' },
                    { label: 'Titulares', value: teacherStats.titular, icon: '👑', color: '#FF9800' },
                    { label: 'Asistentes', value: teacherStats.asistente, icon: '🤝', color: '#9C27B0' },
                    { label: 'Colaboradores', value: teacherStats.colaborador, icon: '🔗', color: '#607D8B' },
                    { label: 'Total Asignaciones', value: teacherStats.totalCourses, icon: '📚', color: '#795548' }
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
            {(searchTerm || filterStatus !== 'todos' || filterAssignmentType !== 'todos') && (
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
                        Mostrando {pagination.total} de {allTeachers.length} docentes
                        {searchTerm && ` con "${searchTerm}"`}
                        {filterStatus !== 'todos' && ` (${filterStatus}s)`}
                        {filterAssignmentType !== 'todos' && ` (${filterAssignmentType}s)`}
                    </span>
                </div>
            )}

            {/* Lista de Docentes */}
            {loading && allTeachers.length === 0 ? (
                <LoadingSpinner message="Cargando Docentes..." />
            ) : (
                <>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
                        gap: '24px'
                    }}>
                        {displayTeachers.map((teacher) => (
                            <div key={teacher.id} style={{
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
                                {/* Header del docente */}
                                <div style={{
                                    background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                    padding: '20px',
                                    color: 'white'
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                        <div style={{ fontSize: '2rem' }}>👨‍🏫</div>
                                        <span style={{
                                            background: teacher.activo ? '#4CAF50' : '#f44336',
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '12px',
                                            fontWeight: '600'
                                        }}>
                                            {teacher.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '1.3rem',
                                        fontWeight: '700',
                                        marginBottom: '8px'
                                    }}>
                                        {teacher.nombres} {teacher.apellidos}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        opacity: 0.9,
                                        fontSize: '0.9rem'
                                    }}>
                                        {teacher.email}
                                    </p>
                                </div>

                                {/* Contenido del docente */}
                                <div style={{ padding: '20px' }}>
                                    <div style={{ marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>🆔</span>
                                            <span style={{ fontWeight: '600', color: '#2c3e50' }}>Código:</span>
                                            <span style={{ color: '#6c757d' }}>{teacher.codigo_institucional}</span>
                                        </div>

                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                            <span style={{ fontSize: '1.2rem' }}>📚</span>
                                            <span style={{ fontWeight: '600', color: '#2c3e50' }}>Cursos asignados:</span>
                                            <span style={{ color: '#6c757d' }}>
                                                {teacher.asignaciones ? teacher.asignaciones.filter(a => a.activo).length : 0}
                                            </span>
                                        </div>

                                        {/* Asignaciones actuales */}
                                        {teacher.asignaciones && teacher.asignaciones.filter(a => a.activo).length > 0 && (
                                            <div style={{
                                                background: '#f8f9fa',
                                                padding: '12px',
                                                borderRadius: '8px',
                                                marginBottom: '16px'
                                            }}>
                                                <div style={{ fontWeight: '600', color: '#2c3e50', marginBottom: '8px' }}>
                                                    Asignaciones actuales:
                                                </div>
                                                {teacher.asignaciones.filter(a => a.activo).slice(0, 3).map((assignment, idx) => (
                                                    <div key={idx} style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        padding: '4px 0',
                                                        borderBottom: idx < teacher.asignaciones.filter(a => a.activo).length - 1 ? '1px solid #e9ecef' : 'none'
                                                    }}>
                                                        <span style={{ fontSize: '0.9rem', color: '#2c3e50' }}>
                                                            {assignment.curso_nombre}
                                                        </span>
                                                        <span style={{
                                                            background: getAssignmentTypeColor(assignment.tipo_asignacion),
                                                            color: 'white',
                                                            padding: '2px 8px',
                                                            borderRadius: '12px',
                                                            fontSize: '0.8rem',
                                                            fontWeight: '600'
                                                        }}>
                                                            {getAssignmentTypeText(assignment.tipo_asignacion)}
                                                        </span>
                                                    </div>
                                                ))}
                                                {teacher.asignaciones.filter(a => a.activo).length > 3 && (
                                                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginTop: '8px' }}>
                                                        +{teacher.asignaciones.filter(a => a.activo).length - 3} más
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleViewCourses(teacher)}
                                            style={{
                                                flex: 1,
                                                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
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
                                            📚 Ver Cursos
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
                                    cursor: pagination.hasPrev ? 'pointer' : 'not-allowed',
                                    opacity: pagination.hasPrev ? 1 : 0.5,
                                    background: 'white'
                                }}
                            >
                                ← Anterior
                            </button>

                            <span style={{ color: '#6c757d', fontSize: '14px' }}>
                                Página {pagination.page} de {pagination.totalPages}
                            </span>

                            <button
                                disabled={!pagination.hasNext}
                                onClick={() => handlePageChange(currentPage + 1)}
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

            {displayTeachers.length === 0 && !loading && (
                <div style={{
                    background: 'white',
                    padding: '60px 20px',
                    borderRadius: '16px',
                    textAlign: 'center',
                    color: '#6c757d',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)'
                }}>
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🔍</div>
                    <h3>No se encontraron docentes</h3>
                    <p>
                        {searchTerm || filterStatus !== 'todos' || filterAssignmentType !== 'todos'
                            ? 'Intenta cambiar los filtros de búsqueda'
                            : 'No hay docentes disponibles'
                        }
                    </p>
                    {(searchTerm || filterStatus !== 'todos' || filterAssignmentType !== 'todos') && (
                        <button
                            onClick={clearFilters}
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

            {/* Modal Asignar Docente */}
            {showAssignModal && (
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
                    zIndex: 1100,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, color: '#2c3e50' }}>Asignar Docente a Curso</h2>
                            <button
                                onClick={() => {
                                    setShowAssignModal(false);
                                    resetAssignForm();

                                    // Si venía del modal de cursos, volver a abrirlo
                                    if (fromCoursesModal && selectedTeacher) {
                                        setShowCoursesModal(true);
                                        setFromCoursesModal(false);
                                    }
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6c757d'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={handleAssignSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                                    Docente *
                                </label>
                                <select
                                    value={assignFormData.usuario_id}
                                    onChange={(e) => handleAssignFormChange('usuario_id', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: `2px solid ${assignFormErrors.usuario_id ? '#f44336' : '#e9ecef'}`,
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        outline: 'none',
                                        background: fromCoursesModal ? '#f8f9fa' : 'white',
                                        color: fromCoursesModal ? '#6c757d' : 'inherit',
                                        cursor: fromCoursesModal ? 'not-allowed' : 'pointer'
                                    }}
                                    disabled={fromCoursesModal}
                                    required
                                >
                                    <option value="">Seleccionar docente...</option>
                                    {allTeachers.filter(t => t.activo).map(teacher => (
                                        <option key={teacher.id} value={teacher.id}>
                                            {teacher.nombres} {teacher.apellidos} - {teacher.email}
                                        </option>
                                    ))}
                                </select>
                                {assignFormErrors.usuario_id && (
                                    <div style={{ color: '#f44336', fontSize: '14px', marginTop: '4px' }}>
                                        {assignFormErrors.usuario_id}
                                    </div>
                                )}
                                {fromCoursesModal && (
                                    <div style={{ color: '#2196F3', fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        🔒 Docente pre-seleccionado desde el modal de cursos
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                                    Curso *
                                </label>
                                <select
                                    value={assignFormData.curso_id}
                                    onChange={(e) => handleAssignFormChange('curso_id', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: `2px solid ${assignFormErrors.curso_id ? '#f44336' : '#e9ecef'}`,
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        outline: 'none'
                                    }}
                                    required
                                    disabled={!assignFormData.usuario_id}
                                >
                                    <option value="">
                                        {!assignFormData.usuario_id
                                            ? 'Primero seleccione un docente...'
                                            : 'Seleccionar curso disponible...'
                                        }
                                    </option>
                                    {assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.codigo_curso} - {course.nombre}
                                        </option>
                                    ))}
                                </select>
                                {assignFormErrors.curso_id && (
                                    <div style={{ color: '#f44336', fontSize: '14px', marginTop: '4px' }}>
                                        {assignFormErrors.curso_id}
                                    </div>
                                )}
                                {assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).length === 0 && (
                                    <div style={{ color: '#ff9800', fontSize: '14px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ⚠️ Este docente ya está asignado a todos los cursos disponibles
                                    </div>
                                )}
                                {assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).length > 0 && (
                                    <div style={{ color: '#4caf50', fontSize: '12px', marginTop: '4px' }}>
                                        ✅ {getAvailableCoursesForTeacher(assignFormData.usuario_id).length} cursos disponibles para asignar
                                    </div>
                                )}
                            </div>

                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                                    Tipo de Asignación
                                </label>
                                <select
                                    value={assignFormData.tipo_asignacion}
                                    onChange={(e) => handleAssignFormChange('tipo_asignacion', e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="titular">Titular</option>
                                    <option value="asistente">Asistente</option>
                                    <option value="colaborador">Colaborador</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={assignFormData.activo}
                                        onChange={(e) => handleAssignFormChange('activo', e.target.checked)}
                                    />
                                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>Asignación activa</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowAssignModal(false);
                                        resetAssignForm();

                                        // Si venía del modal de cursos, volver a abrirlo
                                        if (fromCoursesModal && selectedTeacher) {
                                            setShowCoursesModal(true);
                                            setFromCoursesModal(false);
                                        }
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        background: 'white',
                                        color: '#6c757d',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                    disabled={submitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).length === 0
                                            ? '#ccc'
                                            : 'linear-gradient(135deg, #2196F3, #1976D2)',
                                        color: 'white',
                                        cursor: assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).length === 0
                                            ? 'not-allowed'
                                            : 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                    disabled={submitting || (assignFormData.usuario_id && getAvailableCoursesForTeacher(assignFormData.usuario_id).length === 0)}
                                >
                                    {submitting ? 'Asignando...' : 'Asignar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Editar Asignación */}
            {showEditModal && selectedTeacher && (
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
                    zIndex: 1100,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '500px',
                        width: '100%'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, color: '#2c3e50' }}>Editar Asignación</h2>
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setSelectedTeacher(null);
                                }}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '24px',
                                    cursor: 'pointer',
                                    color: '#6c757d'
                                }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ marginBottom: '20px', padding: '16px', background: '#f8f9fa', borderRadius: '8px' }}>
                            <div style={{ fontWeight: '600', color: '#2c3e50' }}>
                                Docente: {selectedTeacher.nombres} {selectedTeacher.apellidos}
                            </div>
                            <div style={{ color: '#6c757d', fontSize: '14px' }}>
                                Curso: {selectedTeacher.selectedAssignment?.curso_nombre}
                            </div>
                        </div>

                        <form onSubmit={handleEditSubmit}>
                            <div style={{ marginBottom: '20px' }}>
                                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#2c3e50' }}>
                                    Tipo de Asignación
                                </label>
                                <select
                                    value={editFormData.tipo_asignacion}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, tipo_asignacion: e.target.value }))}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        fontSize: '16px',
                                        outline: 'none'
                                    }}
                                >
                                    <option value="titular">Titular</option>
                                    <option value="asistente">Asistente</option>
                                    <option value="colaborador">Colaborador</option>
                                </select>
                            </div>

                            <div style={{ marginBottom: '24px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={editFormData.activo}
                                        onChange={(e) => setEditFormData(prev => ({ ...prev, activo: e.target.checked }))}
                                    />
                                    <span style={{ fontWeight: '600', color: '#2c3e50' }}>Asignación activa</span>
                                </label>
                            </div>

                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowEditModal(false);
                                        setSelectedTeacher(null);
                                    }}
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        border: '2px solid #e9ecef',
                                        borderRadius: '8px',
                                        background: 'white',
                                        color: '#6c757d',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                    disabled={submitting}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '12px 24px',
                                        border: 'none',
                                        borderRadius: '8px',
                                        background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                        color: 'white',
                                        cursor: 'pointer',
                                        fontSize: '16px',
                                        fontWeight: '600'
                                    }}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Actualizando...' : 'Actualizar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Ver Cursos del Docente */}
            {showCoursesModal && selectedTeacher && (
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
                    zIndex: 1050,
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '32px',
                        maxWidth: '900px',
                        width: '100%',
                        maxHeight: '90vh',
                        overflowY: 'auto'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0, color: '#2c3e50', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ fontSize: '1.5rem' }}>📚</span>
                                Cursos de {selectedTeacher.nombres} {selectedTeacher.apellidos}
                            </h2>

                            {/* Botón para agregar nuevo curso */}
                            <button
                                onClick={() => {
                                    setAssignFormData({
                                        curso_id: '',
                                        usuario_id: selectedTeacher.id,
                                        tipo_asignacion: 'titular',
                                        activo: true
                                    });
                                    setFromCoursesModal(true); // Marcar que viene del modal de cursos
                                    setShowAssignModal(true);
                                    setShowCoursesModal(false); // Cerrar el modal de cursos
                                }}
                                style={{
                                    background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    fontSize: '14px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                }}
                                onMouseOver={(e) => e.target.style.transform = 'translateY(-1px)'}
                                onMouseOut={(e) => e.target.style.transform = 'translateY(0)'}
                            >
                                <span style={{ fontSize: '16px' }}>+</span>
                                Asignar Curso
                            </button>
                        </div>

                        {coursesLoading ? (
                            <LoadingSpinner message="Cargando cursos..." />
                        ) : (
                            <>
                                {selectedTeacher.asignaciones && selectedTeacher.asignaciones.length > 0 ? (
                                    <div style={{ display: 'grid', gap: '16px' }}>
                                        {selectedTeacher.asignaciones.map((assignment) => (
                                            <div key={assignment.id} style={{
                                                border: '1px solid #e9ecef',
                                                borderRadius: '12px',
                                                padding: '20px',
                                                background: assignment.activo ? 'white' : '#f8f9fa'
                                            }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                                                    <div>
                                                        <h3 style={{ margin: 0, color: '#2c3e50', fontSize: '1.2rem' }}>
                                                            {assignment.curso_nombre}
                                                        </h3>
                                                        <p style={{ margin: '4px 0', color: '#6c757d', fontSize: '0.9rem' }}>
                                                            Código: {assignment.curso_codigo}
                                                        </p>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                        <span style={{
                                                            background: getAssignmentTypeColor(assignment.tipo_asignacion),
                                                            color: 'white',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {getAssignmentTypeText(assignment.tipo_asignacion)}
                                                        </span>
                                                        <span style={{
                                                            background: assignment.activo ? '#4CAF50' : '#f44336',
                                                            color: 'white',
                                                            padding: '4px 12px',
                                                            borderRadius: '20px',
                                                            fontSize: '12px',
                                                            fontWeight: '600'
                                                        }}>
                                                            {assignment.activo ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: '0.85rem', color: '#6c757d', marginBottom: '16px' }}>
                                                    Asignado el: {new Date(assignment.fecha_asignacion).toLocaleDateString()}
                                                </div>

                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    <button
                                                        onClick={() => handleEditAssignment(selectedTeacher, assignment)}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        ✏️ Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveAssignment(assignment.id)}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                                                            color: 'white',
                                                            border: 'none',
                                                            padding: '8px 16px',
                                                            borderRadius: '6px',
                                                            fontSize: '14px',
                                                            fontWeight: '600',
                                                            cursor: 'pointer'
                                                        }}
                                                    >
                                                        🗑️ Remover
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '40px', color: '#6c757d' }}>
                                        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📚</div>
                                        <h3>No tiene cursos asignados</h3>
                                        <p>Este docente aún no tiene cursos asignados</p>

                                        {/* Botón para asignar primer curso */}
                                        <button
                                            onClick={() => {
                                                setAssignFormData({
                                                    curso_id: '',
                                                    usuario_id: selectedTeacher.id,
                                                    tipo_asignacion: 'titular',
                                                    activo: true
                                                });
                                                setFromCoursesModal(true); // Marcar que viene del modal de cursos
                                                setShowAssignModal(true);
                                                setShowCoursesModal(false); // Cerrar el modal de cursos
                                            }}
                                            style={{
                                                background: 'linear-gradient(135deg, #4CAF50, #2E7D32)',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 24px',
                                                borderRadius: '8px',
                                                fontSize: '16px',
                                                fontWeight: '600',
                                                cursor: 'pointer',
                                                marginTop: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px',
                                                margin: '16px auto 0'
                                            }}
                                        >
                                            <span style={{ fontSize: '18px' }}>+</span>
                                            Asignar Primer Curso
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                            <button
                                onClick={() => {
                                    setShowCoursesModal(false);
                                    setSelectedTeacher(null);
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

export default AdminDocentes;