"use client"

import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useFuncion } from "../../context/FuncionContext"
import LoadingSpinner from "../../components/LoadingSpinner"

const AdminEstudiantes = () => {
    const [searchTerm, setSearchTerm] = useState("")
    const [, setFilterStatus] = useState("todos")
    const [filterCourse, setFilterCourse] = useState("todos")
    const [showEnrollModal, setShowEnrollModal] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [showCoursesModal, setShowCoursesModal] = useState(false)
    const [selectedStudent, setSelectedStudent] = useState(null)
    const [currentPage, setCurrentPage] = useState(1)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Estados para los datos paginados desde backend
    const [studentsData, setStudentsData] = useState({
        students: [],
        pagination: {
            page: 1,
            limit: 15,
            total: 0,
            totalPages: 0,
            hasNext: false,
            hasPrev: false,
        },
    })

    const [allCourses, setAllCourses] = useState([])
    const [studentStats, setStudentStats] = useState({
        total: 0,
        inscrito: 0,
        aprobado: 0,
        reprobado: 0,
        retirado: 0,
        totalInscripciones: 0,
    })

    // Configuración de paginación
    const ITEMS_PER_PAGE = 5

    // Estados para el formulario de inscripción
    const [enrollFormData, setEnrollFormData] = useState({
        curso_id: "",
        usuario_id: "",
        estado: "inscrito",
    })
    const [enrollFormErrors, setEnrollFormErrors] = useState({})
    const [submitting, setSubmitting] = useState(false)

    // Estados para editar inscripción
    const [editFormData, setEditFormData] = useState({
        estado: "inscrito",
        nota_final: "",
    })

    // Estados para cursos del estudiante
    const [coursesLoading, setCoursesLoading] = useState(false)
    const [fromCoursesModal, setFromCoursesModal] = useState(false)

    const {
        fetchStudents,
        fetchCourses,
        enrollStudentToCourse,
        updateStudentEnrollment,
        removeStudentFromCourse,
        getStudentCourses,
    } = useFuncion()

    // Función helper para normalizar datos de inscripciones
    const normalizeStudentData = (student) => {
        // Verificar diferentes posibles nombres para las inscripciones
        const inscripciones = student.inscripciones || student.enrollments || student.cursos || student.courses || []

        return {
            ...student,
            inscripciones: Array.isArray(inscripciones) ? inscripciones : [],
        }
    }

    // Función helper para actualizar los datos del estudiante seleccionado
    const updateSelectedStudent = async () => {
        if (showCoursesModal && selectedStudent) {
            try {
                setCoursesLoading(true)
                const response = await fetchStudents({
                    page: 1,
                    limit: 1000,
                    include_enrollments: true,
                })
                const studentsArray = Array.isArray(response) ? response : response.students || []
                const updatedStudent = studentsArray.find((s) => s.id === selectedStudent.id)
                if (updatedStudent) {
                    setSelectedStudent(normalizeStudentData(updatedStudent))
                }
            } catch (err) {
                console.error("Error actualizando datos del estudiante seleccionado:", err)
            } finally {
                setCoursesLoading(false)
            }
        }
    }

    // Función para obtener cursos disponibles para un estudiante específico
    const getAvailableCoursesForStudent = useCallback(
        (studentId) => {
            if (!studentId) return allCourses

            const selectedStudentData = studentsData.students.find((s) => s.id === Number.parseInt(studentId))
            if (!selectedStudentData) {
                return allCourses
            }

            const normalizedStudent = normalizeStudentData(selectedStudentData)
            const enrolledCourseIds = normalizedStudent.inscripciones.map(
                (enrollment) => enrollment.curso_id || enrollment.course_id || enrollment.id,
            )

            return allCourses.filter((course) => !enrolledCourseIds.includes(course.id))
        },
        [allCourses, studentsData.students],
    )

    // Cargar estudiantes con paginación desde backend
    const loadStudents = useCallback(
        async (page = 1, search = "", course = "") => {
            try {
                setLoading(true)
                setError(null)

                const params = {
                    page: page,
                    limit: ITEMS_PER_PAGE,
                    include_enrollments: true,
                }

                // Solo agregar search si no está vacío
                if (search && search.trim()) {
                    params.search = search.trim()
                }

                // Solo agregar course si no es 'todos'
                if (course && course !== "todos") {
                    params.course = course
                }

                const data = await fetchStudents(params)


                if (data && data.students) {
                    // Normalizar datos de estudiantes
                    const normalizedStudents = data.students.map(normalizeStudentData)
                    const normalizedData = {
                        ...data,
                        students: normalizedStudents,
                    }

                    setStudentsData(normalizedData)

                    // Calcular estadísticas desde los datos recibidos
                    const students = normalizedStudents
                    const inscritoCount = students.filter(
                        (s) => s.inscripciones && s.inscripciones.some((i) => i.estado === "inscrito"),
                    ).length
                    const aprobadoCount = students.filter(
                        (s) => s.inscripciones && s.inscripciones.some((i) => i.estado === "aprobado"),
                    ).length
                    const reprobadoCount = students.filter(
                        (s) => s.inscripciones && s.inscripciones.some((i) => i.estado === "reprobado"),
                    ).length
                    const retiradoCount = students.filter(
                        (s) => s.inscripciones && s.inscripciones.some((i) => i.estado === "retirado"),
                    ).length
                    const totalInscripciones = students.reduce((sum, s) => {
                        return sum + (s.inscripciones ? s.inscripciones.length : 0)
                    }, 0)

                    setStudentStats({
                        total: data.pagination.total,
                        inscrito: inscritoCount,
                        aprobado: aprobadoCount,
                        reprobado: reprobadoCount,
                        retirado: retiradoCount,
                        totalInscripciones,
                    })

                } else {
                    console.warn("⚠️ Estructura de datos inesperada:", data)
                    setStudentsData({
                        students: [],
                        pagination: {
                            page: 1,
                            limit: ITEMS_PER_PAGE,
                            total: 0,
                            totalPages: 0,
                            hasNext: false,
                            hasPrev: false,
                        },
                    })
                }
            } catch (err) {
                console.error("❌ Error cargando estudiantes:", err)
                setError(err.message)
                setStudentsData({
                    students: [],
                    pagination: {
                        page: 1,
                        limit: ITEMS_PER_PAGE,
                        total: 0,
                        totalPages: 0,
                        hasNext: false,
                        hasPrev: false,
                    },
                })
            } finally {
                setLoading(false)
            }
        },
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )
    // Cargar cursos disponibles para inscripción
    const loadAvailableCourses = useCallback(async () => {
        try {
            const coursesData = await fetchCourses({ page: 1, limit: 1000 })
            const coursesArray = Array.isArray(coursesData) ? coursesData : coursesData.courses || []
            setAllCourses(coursesArray.filter((c) => c.activo))
        } catch (err) {
            console.error("Error cargando cursos:", err)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Efecto para cargar datos iniciales - SOLO UNA VEZ
    useEffect(() => {
        loadAvailableCourses()
        // Cargar primera página al inicio
        loadStudents(1, "", "todos")
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Efecto para manejar cambios en filtros - resetea a página 1
    useEffect(() => {
        setCurrentPage(1)
    }, [searchTerm, filterCourse])

    // Efecto para manejar cambios de página
    useEffect(() => {
        // Cargar datos de la página actual con los filtros actuales
        loadStudents(currentPage, searchTerm, filterCourse)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage])

    // Nuevo useEffect para cuando cambian los filtros y estamos en página 1
    useEffect(() => {
        if (currentPage === 1) {
            loadStudents(1, searchTerm, filterCourse)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterCourse])

    // Manejar formulario de inscripción
    const handleEnrollFormChange = (field, value) => {
        setEnrollFormData((prev) => ({
            ...prev,
            [field]: value,
        }))
        if (enrollFormErrors[field]) {
            setEnrollFormErrors((prev) => ({
                ...prev,
                [field]: null,
            }))
        }
    }

    const validateEnrollForm = () => {
        const errors = {}
        if (!enrollFormData.curso_id) {
            errors.curso_id = "Debe seleccionar un curso"
        }
        if (!enrollFormData.usuario_id) {
            errors.usuario_id = "Debe seleccionar un estudiante"
        }
        setEnrollFormErrors(errors)
        return Object.keys(errors).length === 0
    }

    const handleEnrollSubmit = async (e) => {
        e.preventDefault()
        if (!validateEnrollForm()) return

        setSubmitting(true)
        try {
            await enrollStudentToCourse(enrollFormData.curso_id, enrollFormData)
            setShowEnrollModal(false)
            resetEnrollForm()

            // Recargar la página actual
            await loadStudents(currentPage, searchTerm, filterCourse)
            if (fromCoursesModal && selectedStudent) {
                // Actualizar datos del estudiante seleccionado
                const response = await fetchStudents({
                    page: 1,
                    limit: 1000,
                    include_enrollments: true,
                })
                const studentsArray = Array.isArray(response) ? response : response.students || []
                const updatedStudent = studentsArray.find((s) => s.id === selectedStudent.id)
                if (updatedStudent) {
                    setSelectedStudent(normalizeStudentData(updatedStudent))
                }
                setShowCoursesModal(true)
                setFromCoursesModal(false)
            }
        } catch (err) {
            console.error("Error inscribiendo estudiante:", err)
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const resetEnrollForm = () => {
        setEnrollFormData({
            curso_id: "",
            usuario_id: "",
            estado: "inscrito",
        })
        setEnrollFormErrors({})
    }

    const handleEditEnrollment = (student, enrollment) => {
        setSelectedStudent({ ...student, selectedEnrollment: enrollment })
        setEditFormData({
            estado: enrollment.estado,
            nota_final: enrollment.nota_final || "",
        })
        setShowEditModal(true)
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault()
        setSubmitting(true)
        try {
            await updateStudentEnrollment(selectedStudent.selectedEnrollment.id, editFormData)
            setShowEditModal(false)

            // Recargar la página actual
            await loadStudents(currentPage, searchTerm, filterCourse)
            await updateSelectedStudent()
            if (!showCoursesModal) {
                setSelectedStudent(null)
            }
        } catch (err) {
            console.error("Error actualizando inscripción:", err)
            setError(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const handleRemoveEnrollment = async (enrollmentId) => {
        if (!window.confirm("¿Estás seguro de que quieres remover esta inscripción?")) {
            return
        }

        try {
            await removeStudentFromCourse(enrollmentId)

            // Recargar la página actual
            await loadStudents(currentPage, searchTerm, filterCourse)
            if (showCoursesModal && selectedStudent) {
                // Actualizar datos del estudiante seleccionado
                const response = await fetchStudents({
                    page: 1,
                    limit: 1000,
                    include_enrollments: true,
                })
                const studentsArray = Array.isArray(response) ? response : response.students || []
                const updatedStudent = studentsArray.find((s) => s.id === selectedStudent.id)
                if (updatedStudent) {
                    setSelectedStudent(normalizeStudentData(updatedStudent))
                }
            }
        } catch (err) {
            console.error("Error removiendo inscripción:", err)
            setError(err.message)
        }
    }

    const handleViewCourses = async (student) => {
        const normalizedStudent = normalizeStudentData(student)
        setSelectedStudent(normalizedStudent)
        setCoursesLoading(true)
        try {
            await getStudentCourses(student.id)
            setShowCoursesModal(true)
        } catch (err) {
            console.error("Error cargando cursos del estudiante:", err)
            setError(err.message)
        } finally {
            setCoursesLoading(false)
        }
    }

    const getStatusColor = (estado) => {
        const colors = {
            inscrito: "#2196F3",
            aprobado: "#4CAF50",
            reprobado: "#f44336",
            retirado: "#FF9800",
        }
        return colors[estado] || "#6c757d"
    }

    const getStatusText = (estado) => {
        const texts = {
            inscrito: "Inscrito",
            aprobado: "Aprobado",
            reprobado: "Reprobado",
            retirado: "Retirado",
        }
        return texts[estado] || estado
    }

    const handlePageChange = (newPage) => {
        // Validaciones
        if (newPage < 1 || newPage > studentsData.pagination.totalPages) {
            console.warn("⚠️ Página inválida:", newPage)
            return
        }

        if (newPage === currentPage) {
            return
        }

        setCurrentPage(newPage)
    }

    const clearFilters = () => {
        setSearchTerm("")
        setFilterStatus("todos")
        setFilterCourse("todos")
        setCurrentPage(1)
    }

    if (error && !studentsData.students.length) {
        return (
            <div
                style={{
                    padding: "40px 20px",
                    maxWidth: "1400px",
                    margin: "0 auto",
                    textAlign: "center",
                }}
            >
                <div
                    style={{
                        background: "white",
                        padding: "40px",
                        borderRadius: "20px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        border: "2px solid #f44336",
                    }}
                >
                    <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
                    <h2 style={{ color: "#f44336", marginBottom: "16px" }}>Error al cargar estudiantes</h2>
                    <p style={{ color: "#6c757d", marginBottom: "24px" }}>{error}</p>
                    <button
                        onClick={() => loadStudents(1, searchTerm, filterCourse)}
                        style={{
                            background: "#f44336",
                            color: "white",
                            border: "none",
                            padding: "12px 24px",
                            borderRadius: "8px",
                            cursor: "pointer",
                            fontSize: "1rem",
                            fontWeight: "600",
                        }}
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div
            style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto", minHeight: "100vh", background: "#f8f9fa" }}
        >
            {/* Header */}
            <div style={{ marginBottom: "32px" }}>
                <Link
                    to="/admin"
                    style={{
                        textDecoration: "none",
                        color: "#6c757d",
                        fontSize: "14px",
                        fontWeight: "500",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        marginBottom: "16px",
                    }}
                >
                    ← Volver al Dashboard
                </Link>
                <div
                    style={{
                        background: "white",
                        padding: "32px",
                        borderRadius: "20px",
                        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
                        border: "1px solid rgba(0, 0, 0, 0.05)",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                        <div style={{ fontSize: "3rem" }}>🎓</div>
                        <div>
                            <h1
                                style={{
                                    fontSize: "2.2rem",
                                    color: "#2196F3",
                                    marginBottom: "8px",
                                    fontWeight: "800",
                                }}
                            >
                                Gestionar Estudiantes
                            </h1>
                            <p style={{ color: "#6c757d", margin: 0, fontSize: "1.1rem" }}>
                                Administra estudiantes y sus inscripciones a cursos
                            </p>
                        </div>
                    </div>
                    {error && (
                        <div
                            style={{
                                background: "#ffebee",
                                border: "1px solid #f44336",
                                color: "#d32f2f",
                                padding: "12px 16px",
                                borderRadius: "8px",
                                marginTop: "16px",
                            }}
                        >
                            {error}
                        </div>
                    )}
                </div>
            </div>

            {/* Filtros y Búsqueda */}
            <div
                style={{
                    background: "white",
                    padding: "24px",
                    borderRadius: "16px",
                    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                    marginBottom: "24px",
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
                    flexWrap: "wrap",
                }}
            >
                <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
                    <input
                        type="text"
                        placeholder="🔍 Buscar por nombre, email o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            width: "100%",
                            padding: "12px 16px",
                            paddingRight: searchTerm ? "40px" : "16px",
                            border: "2px solid #e9ecef",
                            borderRadius: "12px",
                            fontSize: "16px",
                            outline: "none",
                            transition: "all 0.3s ease",
                            boxSizing: "border-box",
                        }}
                        onFocus={(e) => (e.target.style.borderColor = "#2196F3")}
                        onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm("")}
                            style={{
                                position: "absolute",
                                right: "8px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                background: "none",
                                border: "none",
                                fontSize: "18px",
                                cursor: "pointer",
                                color: "#6c757d",
                                padding: "4px",
                            }}
                            title="Limpiar búsqueda"
                        >
                            ✕
                        </button>
                    )}
                </div>

                <select
                    value={filterCourse}
                    onChange={(e) => setFilterCourse(e.target.value)}
                    style={{
                        padding: "12px 16px",
                        border: "2px solid #e9ecef",
                        borderRadius: "12px",
                        fontSize: "16px",
                        outline: "none",
                        minWidth: "200px",
                        cursor: "pointer",
                    }}
                >
                    <option value="todos">Todos los cursos</option>
                    {allCourses.map((course) => (
                        <option key={course.id} value={course.id.toString()}>
                            {course.codigo_curso} - {course.nombre}
                        </option>
                    ))}
                </select>

                {(searchTerm || filterCourse !== "todos") && (
                    <button
                        onClick={clearFilters}
                        style={{
                            background: "#6c757d",
                            color: "white",
                            border: "none",
                            padding: "12px 20px",
                            borderRadius: "12px",
                            fontSize: "16px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                        }}
                    >
                        Limpiar
                    </button>
                )}

                <button
                    onClick={() => {
                        setFromCoursesModal(false)
                        setShowEnrollModal(true)
                    }}
                    style={{
                        background: "linear-gradient(135deg, #2196F3, #1976D2)",
                        color: "white",
                        border: "none",
                        padding: "12px 24px",
                        borderRadius: "12px",
                        fontSize: "16px",
                        fontWeight: "600",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                    }}
                    onMouseOver={(e) => {
                        e.target.style.transform = "translateY(-2px)"
                        e.target.style.boxShadow = "0 6px 20px rgba(33, 150, 243, 0.4)"
                    }}
                    onMouseOut={(e) => {
                        e.target.style.transform = "translateY(0)"
                        e.target.style.boxShadow = "none"
                    }}
                >
                    <span style={{ fontSize: "18px" }}>+</span>
                    Inscribir Estudiante
                </button>
            </div>

            {/* Estadísticas */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "16px",
                    marginBottom: "24px",
                }}
            >
                {[
                    { label: "Total Estudiantes", value: studentStats.total, icon: "🎓", color: "#2196F3" },
                    { label: "Inscritos", value: studentStats.inscrito, icon: "📝", color: "#2196F3" },
                    { label: "Aprobados", value: studentStats.aprobado, icon: "✅", color: "#4CAF50" },
                    { label: "Reprobados", value: studentStats.reprobado, icon: "❌", color: "#f44336" },
                    { label: "Retirados", value: studentStats.retirado, icon: "🚪", color: "#FF9800" },
                    { label: "Total Inscripciones", value: studentStats.totalInscripciones, icon: "📚", color: "#795548" },
                ].map((stat, index) => (
                    <div
                        key={index}
                        style={{
                            background: "white",
                            padding: "16px",
                            borderRadius: "12px",
                            boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
                            textAlign: "center",
                            border: `2px solid ${stat.color}20`,
                        }}
                    >
                        <div style={{ fontSize: "1.8rem", marginBottom: "6px" }}>{stat.icon}</div>
                        <div style={{ fontSize: "1.4rem", fontWeight: "700", color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: "0.85rem", color: "#6c757d" }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            {/* Indicador de filtros activos */}
            {(searchTerm || filterCourse !== "todos") && (
                <div
                    style={{
                        background: "#e3f2fd",
                        border: "1px solid #2196f3",
                        borderRadius: "8px",
                        padding: "12px 16px",
                        marginBottom: "16px",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                        fontSize: "14px",
                        color: "#1976d2",
                    }}
                >
                    <span>🔍</span>
                    <span>
                        Mostrando {studentsData.pagination.total} estudiantes
                        {searchTerm && ` con "${searchTerm}"`}
                        {filterCourse !== "todos" && ` (curso filtrado)`}
                    </span>
                </div>
            )}

            {/* Lista de Estudiantes */}
            {loading ? (
                <LoadingSpinner message="Cargando estudiantes..." />
            ) : (
                <>
                    <div
                        style={{
                            background: "white",
                            borderRadius: "16px",
                            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                            overflow: "hidden",
                        }}
                    >
                        {/* Header de la tabla */}
                        <div
                            style={{
                                background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                color: "white",
                                padding: "20px 24px",
                                display: "grid",
                                gridTemplateColumns: "1fr 200px 150px 200px 120px",
                                gap: "16px",
                                alignItems: "center",
                                fontWeight: "600",
                                fontSize: "14px",
                            }}
                        >
                            <div>ESTUDIANTE</div>
                            <div>CÓDIGO</div>
                            <div>ESTADO</div>
                            <div>INSCRIPCIONES</div>
                            <div>ACCIONES</div>
                        </div>

                        {/* Filas de estudiantes */}
                        {studentsData.students.map((student, index) => {
                            const normalizedStudent = normalizeStudentData(student)
                            return (
                                <div
                                    key={student.id}
                                    style={{
                                        padding: "20px 24px",
                                        display: "grid",
                                        gridTemplateColumns: "1fr 200px 150px 200px 120px",
                                        gap: "16px",
                                        alignItems: "center",
                                        borderBottom: index < studentsData.students.length - 1 ? "1px solid #f0f0f0" : "none",
                                        transition: "all 0.2s ease",
                                        cursor: "pointer",
                                    }}
                                    onMouseOver={(e) => {
                                        e.currentTarget.style.backgroundColor = "#f8f9fa"
                                    }}
                                    onMouseOut={(e) => {
                                        e.currentTarget.style.backgroundColor = "transparent"
                                    }}
                                >
                                    {/* Columna Estudiante */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                        <div
                                            style={{
                                                width: "48px",
                                                height: "48px",
                                                borderRadius: "50%",
                                                background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: "white",
                                                fontWeight: "600",
                                                fontSize: "18px",
                                            }}
                                        >
                                            {student.nombres ? student.nombres[0] : "?"}
                                        </div>
                                        <div>
                                            <div
                                                style={{
                                                    fontWeight: "600",
                                                    color: "#2c3e50",
                                                    fontSize: "16px",
                                                    marginBottom: "4px",
                                                }}
                                            >
                                                {student.nombres} {student.apellidos}
                                            </div>
                                            <div
                                                style={{
                                                    color: "#6c757d",
                                                    fontSize: "14px",
                                                }}
                                            >
                                                {student.email}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Columna Código */}
                                    <div
                                        style={{
                                            background: "#f8f9fa",
                                            padding: "8px 12px",
                                            borderRadius: "8px",
                                            fontSize: "14px",
                                            fontWeight: "600",
                                            color: "#495057",
                                            textAlign: "center",
                                        }}
                                    >
                                        {student.codigo_institucional}
                                    </div>

                                    {/* Columna Estado */}
                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                                        <span
                                            style={{
                                                background: student.activo ? "#4CAF50" : "#f44336",
                                                color: "white",
                                                padding: "6px 12px",
                                                borderRadius: "20px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                            }}
                                        >
                                            {student.activo ? "Activo" : "Inactivo"}
                                        </span>
                                    </div>

                                    {/* Columna Inscripciones */}
                                    <div style={{ fontSize: "14px" }}>
                                        <div
                                            style={{
                                                fontWeight: "600",
                                                color: "#2c3e50",
                                                marginBottom: "4px",
                                            }}
                                        >
                                            {normalizedStudent.inscripciones.length} cursos
                                        </div>
                                        {normalizedStudent.inscripciones.length > 0 && (
                                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                                {normalizedStudent.inscripciones.slice(0, 2).map((enrollment, idx) => (
                                                    <span
                                                        key={idx}
                                                        style={{
                                                            background: getStatusColor(enrollment.estado),
                                                            color: "white",
                                                            padding: "2px 6px",
                                                            borderRadius: "10px",
                                                            fontSize: "10px",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        {getStatusText(enrollment.estado)}
                                                    </span>
                                                ))}
                                                {normalizedStudent.inscripciones.length > 2 && (
                                                    <span
                                                        style={{
                                                            color: "#6c757d",
                                                            fontSize: "10px",
                                                            padding: "2px 6px",
                                                        }}
                                                    >
                                                        +{normalizedStudent.inscripciones.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Columna Acciones */}
                                    <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleViewCourses(student)
                                            }}
                                            style={{
                                                background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                                                color: "white",
                                                border: "none",
                                                padding: "8px 12px",
                                                borderRadius: "6px",
                                                fontSize: "12px",
                                                fontWeight: "600",
                                                cursor: "pointer",
                                                transition: "all 0.2s ease",
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "4px",
                                            }}
                                            onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                                            onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                                            title="Ver cursos del estudiante"
                                        >
                                            📚
                                        </button>
                                    </div>
                                </div>
                            )
                        })}

                        {/* Mensaje si no hay estudiantes */}
                        {studentsData.students.length === 0 && !loading && (
                            <div
                                style={{
                                    padding: "60px 20px",
                                    textAlign: "center",
                                    color: "#6c757d",
                                }}
                            >
                                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                                <h3>No se encontraron estudiantes</h3>
                                <p>
                                    {searchTerm || filterCourse !== "todos"
                                        ? "Intenta cambiar los filtros de búsqueda"
                                        : "No hay estudiantes disponibles"}
                                </p>
                                {(searchTerm || filterCourse !== "todos") && (
                                    <button
                                        onClick={clearFilters}
                                        style={{
                                            background: "#2196F3",
                                            color: "white",
                                            border: "none",
                                            padding: "12px 24px",
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            fontSize: "16px",
                                            fontWeight: "600",
                                            marginTop: "16px",
                                        }}
                                    >
                                        Limpiar filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Paginación Mejorada */}
                    {studentsData.pagination.totalPages > 1 && (
                        <div
                            style={{
                                background: "white",
                                padding: "20px",
                                borderRadius: "12px",
                                boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)",
                                marginTop: "24px",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                            }}
                        >
                            <div style={{ color: "#6c757d", fontSize: "14px" }}>
                                Mostrando {studentsData.students.length} de {studentsData.pagination.total} estudiantes
                                <br />
                                Página {currentPage} de {studentsData.pagination.totalPages}
                            </div>
                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                {/* Primera página */}
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        handlePageChange(1)
                                    }}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "6px",
                                        cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                                        opacity: currentPage <= 1 ? 0.5 : 1,
                                        background: currentPage <= 1 ? "#f8f9fa" : "white",
                                        fontSize: "14px",
                                    }}
                                    title="Primera página"
                                >
                                    ⏮️
                                </button>

                                {/* Página anterior */}
                                <button
                                    disabled={currentPage <= 1}
                                    onClick={() => {
                                        handlePageChange(currentPage - 1)
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "6px",
                                        cursor: currentPage <= 1 ? "not-allowed" : "pointer",
                                        opacity: currentPage <= 1 ? 0.5 : 1,
                                        background: currentPage <= 1 ? "#f8f9fa" : "white",
                                    }}
                                >
                                    ← Anterior
                                </button>

                                {/* Números de página */}
                                {Array.from({ length: Math.min(5, studentsData.pagination.totalPages) }, (_, i) => {
                                    let pageNum
                                    const totalPages = studentsData.pagination.totalPages

                                    if (totalPages <= 5) {
                                        pageNum = i + 1
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i
                                    } else {
                                        pageNum = currentPage - 2 + i
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            onClick={() => {
                                                handlePageChange(pageNum)
                                            }}
                                            style={{
                                                padding: "8px 12px",
                                                border: "1px solid #e9ecef",
                                                borderRadius: "6px",
                                                cursor: "pointer",
                                                background: pageNum === currentPage ? "#2196F3" : "white",
                                                color: pageNum === currentPage ? "white" : "#333",
                                                fontWeight: pageNum === currentPage ? "600" : "normal",
                                            }}
                                        >
                                            {pageNum}
                                        </button>
                                    )
                                })}

                                {/* Página siguiente */}
                                <button
                                    disabled={currentPage >= studentsData.pagination.totalPages}
                                    onClick={() => {
                                        handlePageChange(currentPage + 1)
                                    }}
                                    style={{
                                        padding: "8px 16px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "6px",
                                        cursor: currentPage >= studentsData.pagination.totalPages ? "not-allowed" : "pointer",
                                        opacity: currentPage >= studentsData.pagination.totalPages ? 0.5 : 1,
                                        background: currentPage >= studentsData.pagination.totalPages ? "#f8f9fa" : "white",
                                    }}
                                >
                                    Siguiente →
                                </button>

                                {/* Última página */}
                                <button
                                    disabled={currentPage >= studentsData.pagination.totalPages}
                                    onClick={() => {
                                        handlePageChange(studentsData.pagination.totalPages)
                                    }}
                                    style={{
                                        padding: "8px 12px",
                                        border: "1px solid #e9ecef",
                                        borderRadius: "6px",
                                        cursor: currentPage >= studentsData.pagination.totalPages ? "not-allowed" : "pointer",
                                        opacity: currentPage >= studentsData.pagination.totalPages ? 0.5 : 1,
                                        background: currentPage >= studentsData.pagination.totalPages ? "#f8f9fa" : "white",
                                        fontSize: "14px",
                                    }}
                                    title="Última página"
                                >
                                    ⏭️
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Modal Inscribir Estudiante */}
            {showEnrollModal && (
                <EnrollStudentModal
                    show={showEnrollModal}
                    onClose={() => {
                        setShowEnrollModal(false)
                        resetEnrollForm()
                        if (fromCoursesModal && selectedStudent) {
                            setShowCoursesModal(true)
                            setFromCoursesModal(false)
                        }
                    }}
                    onSubmit={handleEnrollSubmit}
                    formData={enrollFormData}
                    formErrors={enrollFormErrors}
                    onFormChange={handleEnrollFormChange}
                    submitting={submitting}
                    allStudents={studentsData.students}
                    allCourses={allCourses}
                    getAvailableCoursesForStudent={getAvailableCoursesForStudent}
                    fromCoursesModal={fromCoursesModal}
                />
            )}

            {/* Modal Editar Inscripción */}
            {showEditModal && selectedStudent && (
                <EditEnrollmentModal
                    show={showEditModal}
                    student={selectedStudent}
                    onClose={() => {
                        setShowEditModal(false)
                        setSelectedStudent(null)
                    }}
                    onSubmit={handleEditSubmit}
                    formData={editFormData}
                    onFormChange={(field, value) => setEditFormData((prev) => ({ ...prev, [field]: value }))}
                    submitting={submitting}
                />
            )}

            {/* Modal Ver Cursos del Estudiante */}
            {showCoursesModal && selectedStudent && (
                <StudentCoursesModal
                    show={showCoursesModal}
                    student={selectedStudent}
                    onClose={() => {
                        setShowCoursesModal(false)
                        setSelectedStudent(null)
                    }}
                    onEnrollToCourse={() => {
                        setEnrollFormData({
                            curso_id: "",
                            usuario_id: selectedStudent.id,
                            estado: "inscrito",
                        })
                        setFromCoursesModal(true)
                        setShowEnrollModal(true)
                        setShowCoursesModal(false)
                    }}
                    onEditEnrollment={handleEditEnrollment}
                    onRemoveEnrollment={handleRemoveEnrollment}
                    coursesLoading={coursesLoading}
                    getStatusColor={getStatusColor}
                    getStatusText={getStatusText}
                />
            )}
        </div>
    )
}

// Componente Modal para Inscribir Estudiante
const EnrollStudentModal = ({
    show,
    onClose,
    onSubmit,
    formData,
    formErrors,
    onFormChange,
    submitting,
    allStudents,
    allCourses,
    getAvailableCoursesForStudent,
    fromCoursesModal,
}) => {
    if (!show) return null

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1100,
                padding: "20px",
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "500px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: 0, color: "#2c3e50" }}>Inscribir Estudiante a Curso</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#6c757d",
                        }}
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={onSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Estudiante *
                        </label>
                        <select
                            value={formData.usuario_id}
                            onChange={(e) => onFormChange("usuario_id", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: `2px solid ${formErrors.usuario_id ? "#f44336" : "#e9ecef"}`,
                                borderRadius: "8px",
                                fontSize: "16px",
                                outline: "none",
                                background: fromCoursesModal ? "#f8f9fa" : "white",
                                color: fromCoursesModal ? "#6c757d" : "inherit",
                                cursor: fromCoursesModal ? "not-allowed" : "pointer",
                            }}
                            disabled={fromCoursesModal}
                            required
                        >
                            <option value="">Seleccionar estudiante...</option>
                            {allStudents
                                .filter((s) => s.activo)
                                .map((student) => (
                                    <option key={student.id} value={student.id}>
                                        {student.nombres} {student.apellidos} - {student.email}
                                    </option>
                                ))}
                        </select>
                        {formErrors.usuario_id && (
                            <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>{formErrors.usuario_id}</div>
                        )}
                        {fromCoursesModal && (
                            <div
                                style={{
                                    color: "#2196F3",
                                    fontSize: "12px",
                                    marginTop: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                🔒 Estudiante pre-seleccionado desde el modal de cursos
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Curso *
                        </label>
                        <select
                            value={formData.curso_id}
                            onChange={(e) => onFormChange("curso_id", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: `2px solid ${formErrors.curso_id ? "#f44336" : "#e9ecef"}`,
                                borderRadius: "8px",
                                fontSize: "16px",
                                outline: "none",
                            }}
                            required
                            disabled={!formData.usuario_id}
                        >
                            <option value="">
                                {!formData.usuario_id ? "Primero seleccione un estudiante..." : "Seleccionar curso disponible..."}
                            </option>
                            {formData.usuario_id &&
                                getAvailableCoursesForStudent(formData.usuario_id).map((course) => (
                                    <option key={course.id} value={course.id}>
                                        {course.codigo_curso} - {course.nombre}
                                    </option>
                                ))}
                        </select>
                        {formErrors.curso_id && (
                            <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>{formErrors.curso_id}</div>
                        )}
                        {formData.usuario_id && getAvailableCoursesForStudent(formData.usuario_id).length === 0 && (
                            <div
                                style={{
                                    color: "#ff9800",
                                    fontSize: "14px",
                                    marginTop: "4px",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "4px",
                                }}
                            >
                                ⚠️ Este estudiante ya está inscrito en todos los cursos disponibles
                            </div>
                        )}
                        {formData.usuario_id && getAvailableCoursesForStudent(formData.usuario_id).length > 0 && (
                            <div style={{ color: "#4caf50", fontSize: "12px", marginTop: "4px" }}>
                                ✅ {getAvailableCoursesForStudent(formData.usuario_id).length} cursos disponibles para inscripción
                            </div>
                        )}
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Estado de Inscripción
                        </label>
                        <select
                            value={formData.estado}
                            onChange={(e) => onFormChange("estado", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                outline: "none",
                            }}
                        >
                            <option value="inscrito">Inscrito</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="reprobado">Reprobado</option>
                            <option value="retirado">Retirado</option>
                        </select>
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "12px 24px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                background: "white",
                                color: "#6c757d",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "600",
                            }}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: "12px 24px",
                                border: "none",
                                borderRadius: "8px",
                                background:
                                    formData.usuario_id && getAvailableCoursesForStudent(formData.usuario_id).length === 0
                                        ? "#ccc"
                                        : "linear-gradient(135deg, #2196F3, #1976D2)",
                                color: "white",
                                cursor:
                                    formData.usuario_id && getAvailableCoursesForStudent(formData.usuario_id).length === 0
                                        ? "not-allowed"
                                        : "pointer",
                                fontSize: "16px",
                                fontWeight: "600",
                            }}
                            disabled={
                                submitting || (formData.usuario_id && getAvailableCoursesForStudent(formData.usuario_id).length === 0)
                            }
                        >
                            {submitting ? "Inscribiendo..." : "Inscribir"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Componente Modal para Editar Inscripción
const EditEnrollmentModal = ({ show, student, onClose, onSubmit, formData, onFormChange, submitting }) => {
    if (!show || !student) return null

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1100,
                padding: "20px",
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "500px",
                    width: "100%",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: 0, color: "#2c3e50" }}>Editar Inscripción</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: "none",
                            border: "none",
                            fontSize: "24px",
                            cursor: "pointer",
                            color: "#6c757d",
                        }}
                    >
                        ×
                    </button>
                </div>

                <div style={{ marginBottom: "20px", padding: "16px", background: "#f8f9fa", borderRadius: "8px" }}>
                    <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                        Estudiante: {student.nombres} {student.apellidos}
                    </div>
                    <div style={{ color: "#6c757d", fontSize: "14px" }}>Curso: {student.selectedEnrollment?.curso_nombre}</div>
                </div>

                <form onSubmit={onSubmit}>
                    <div style={{ marginBottom: "20px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Estado de Inscripción
                        </label>
                        <select
                            value={formData.estado}
                            onChange={(e) => onFormChange("estado", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                outline: "none",
                            }}
                        >
                            <option value="inscrito">Inscrito</option>
                            <option value="aprobado">Aprobado</option>
                            <option value="reprobado">Reprobado</option>
                            <option value="retirado">Retirado</option>
                        </select>
                    </div>

                    <div style={{ marginBottom: "24px" }}>
                        <label style={{ display: "block", marginBottom: "8px", fontWeight: "600", color: "#2c3e50" }}>
                            Nota Final (0-100)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            placeholder="Ejemplo: 85.50"
                            value={formData.nota_final}
                            onChange={(e) => onFormChange("nota_final", e.target.value)}
                            style={{
                                width: "100%",
                                padding: "12px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                fontSize: "16px",
                                outline: "none",
                            }}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "12px" }}>
                        <button
                            type="button"
                            onClick={onClose}
                            style={{
                                flex: 1,
                                padding: "12px 24px",
                                border: "2px solid #e9ecef",
                                borderRadius: "8px",
                                background: "white",
                                color: "#6c757d",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "600",
                            }}
                            disabled={submitting}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1,
                                padding: "12px 24px",
                                border: "none",
                                borderRadius: "8px",
                                background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                                color: "white",
                                cursor: "pointer",
                                fontSize: "16px",
                                fontWeight: "600",
                            }}
                            disabled={submitting}
                        >
                            {submitting ? "Actualizando..." : "Actualizar"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// Componente Modal para Ver Cursos del Estudiante
const StudentCoursesModal = ({
    show,
    student,
    onClose,
    onEnrollToCourse,
    onEditEnrollment,
    onRemoveEnrollment,
    coursesLoading,
    getStatusColor,
    getStatusText,
}) => {
    if (!show || !student) return null

    return (
        <div
            style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1050,
                padding: "20px",
            }}
        >
            <div
                style={{
                    background: "white",
                    borderRadius: "16px",
                    padding: "32px",
                    maxWidth: "900px",
                    width: "100%",
                    maxHeight: "90vh",
                    overflowY: "auto",
                }}
            >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
                    <h2 style={{ margin: 0, color: "#2c3e50", display: "flex", alignItems: "center", gap: "12px" }}>
                        <span style={{ fontSize: "1.5rem" }}>🎓</span>
                        Cursos de {student.nombres} {student.apellidos}
                    </h2>
                    <button
                        onClick={onEnrollToCourse}
                        style={{
                            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                            color: "white",
                            border: "none",
                            padding: "10px 16px",
                            borderRadius: "8px",
                            fontSize: "14px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s ease",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                        }}
                        onMouseOver={(e) => (e.target.style.transform = "translateY(-1px)")}
                        onMouseOut={(e) => (e.target.style.transform = "translateY(0)")}
                    >
                        <span style={{ fontSize: "16px" }}>+</span>
                        Inscribir a Curso
                    </button>
                </div>

                {coursesLoading ? (
                    <LoadingSpinner message="Cargando cursos..." />
                ) : (
                    <>
                        {student.inscripciones && student.inscripciones.length > 0 ? (
                            <div style={{ display: "grid", gap: "16px" }}>
                                {student.inscripciones.map((enrollment) => (
                                    <div
                                        key={enrollment.id}
                                        style={{
                                            border: "1px solid #e9ecef",
                                            borderRadius: "12px",
                                            padding: "20px",
                                            background: "white",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                justifyContent: "space-between",
                                                alignItems: "flex-start",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            <div>
                                                <h3 style={{ margin: 0, color: "#2c3e50", fontSize: "1.2rem" }}>{enrollment.curso_nombre}</h3>
                                                <p style={{ margin: "4px 0", color: "#6c757d", fontSize: "0.9rem" }}>
                                                    Código: {enrollment.curso_codigo}
                                                </p>
                                            </div>
                                            <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                                <span
                                                    style={{
                                                        background: getStatusColor(enrollment.estado),
                                                        color: "white",
                                                        padding: "4px 12px",
                                                        borderRadius: "20px",
                                                        fontSize: "12px",
                                                        fontWeight: "600",
                                                    }}
                                                >
                                                    {getStatusText(enrollment.estado)}
                                                </span>
                                                {enrollment.nota_final && (
                                                    <span
                                                        style={{
                                                            background: "#607D8B",
                                                            color: "white",
                                                            padding: "4px 12px",
                                                            borderRadius: "20px",
                                                            fontSize: "12px",
                                                            fontWeight: "600",
                                                        }}
                                                    >
                                                        Nota: {enrollment.nota_final}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: "0.85rem", color: "#6c757d", marginBottom: "16px" }}>
                                            Inscrito el: {new Date(enrollment.fecha_inscripcion).toLocaleDateString()}
                                            {enrollment.fecha_estado !== enrollment.fecha_inscripcion && (
                                                <span> • Estado actualizado: {new Date(enrollment.fecha_estado).toLocaleDateString()}</span>
                                            )}
                                        </div>
                                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                                            <button
                                                onClick={() => onEditEnrollment(student, enrollment)}
                                                style={{
                                                    background: "linear-gradient(135deg, #2196F3, #1976D2)",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 16px",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                ✏️ Editar
                                            </button>
                                            <button
                                                onClick={() => onRemoveEnrollment(enrollment.id)}
                                                style={{
                                                    background: "linear-gradient(135deg, #f44336, #d32f2f)",
                                                    color: "white",
                                                    border: "none",
                                                    padding: "8px 16px",
                                                    borderRadius: "6px",
                                                    fontSize: "14px",
                                                    fontWeight: "600",
                                                    cursor: "pointer",
                                                }}
                                            >
                                                🗑️ Remover
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
                                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🎓</div>
                                <h3>No tiene cursos inscritos</h3>
                                <p>Este estudiante aún no está inscrito en ningún curso</p>
                                <button
                                    onClick={onEnrollToCourse}
                                    style={{
                                        background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
                                        color: "white",
                                        border: "none",
                                        padding: "12px 24px",
                                        borderRadius: "8px",
                                        fontSize: "16px",
                                        fontWeight: "600",
                                        cursor: "pointer",
                                        marginTop: "16px",
                                        display: "flex",
                                        alignItems: "center",
                                        gap: "8px",
                                        margin: "16px auto 0",
                                    }}
                                >
                                    <span style={{ fontSize: "18px" }}>+</span>
                                    Inscribir Primer Curso
                                </button>
                            </div>
                        )}
                    </>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
                    <button
                        onClick={onClose}
                        style={{
                            padding: "12px 24px",
                            border: "2px solid #e9ecef",
                            borderRadius: "8px",
                            background: "white",
                            color: "#6c757d",
                            cursor: "pointer",
                            fontSize: "16px",
                            fontWeight: "600",
                        }}
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    )
}

export default AdminEstudiantes
