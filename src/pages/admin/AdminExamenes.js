import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useFuncion } from "../../context/FuncionContext"
import LoadingSpinner from "../../components/LoadingSpinner"

const AdminExamenes = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterDate, setFilterDate] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showStudentsModal, setShowStudentsModal] = useState(false)
  const [showAddStudentModal, setShowAddStudentModal] = useState(false)
  const [selectedExam, setSelectedExam] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para los datos paginados desde backend
  const [examsData, setExamsData] = useState({
    exams: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  })

  const [examStats, setExamStats] = useState({
    total_horarios: 0,
    horarios_activos: 0,
    cupos_totales: 0,
    cupos_ocupados: 0,
    estudiantes_agendados: 0,
  })

  // Configuración de paginación
  const ITEMS_PER_PAGE = 10

  // Estados para el formulario de nuevo horario
  const [formData, setFormData] = useState({
    fecha_examen: "",
    hora_inicio: "",
    hora_fin: "",
    cupos_disponibles: 20,
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Estados para gestión de estudiantes en examen
  const [examStudents, setExamStudents] = useState([])
  const [availableStudents, setAvailableStudents] = useState([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [studentsLoading, setStudentsLoading] = useState(false)

  const { 
    fetchExamSchedules, 
    fetchExamStats, 
    createExamSchedule, 
    updateExamSchedule,
    deleteExamSchedule,
    fetchExamStudents,
    fetchAvailableStudents,
    addStudentToExam,
    removeStudentFromExam,
    updateStudentExamStatus
  } = useFuncion()

  // Cargar horarios de examen con paginación
  const loadExams = useCallback(
    async (page = 1, search = "", dateFilter = "", status = "") => {
      try {
        setLoading(true)
        setError(null)

        const params = {
          page: page,
          limit: ITEMS_PER_PAGE,
        }

        if (search && search.trim()) {
          params.search = search.trim()
        }

        if (dateFilter && dateFilter.trim()) {
          params.fecha = dateFilter.trim()
        }

        if (status && status.trim()) {
          params.status = status.trim()
        }

        const data = await fetchExamSchedules(params)

        if (data && data.schedules) {
          setExamsData({
            exams: data.schedules || [],
            pagination: data.pagination || {
              page: 1,
              limit: ITEMS_PER_PAGE,
              total: 0,
              totalPages: 0,
              hasNext: false,
              hasPrev: false,
            },
          })
        } else {
          setExamsData({
            exams: [],
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
        console.error("❌ Error cargando horarios de examen:", err)
        setError(err.message)
        setExamsData({
          exams: [],
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
    []
  )

  // Cargar estadísticas
  const loadExamStats = useCallback(async () => {
    try {
      const stats = await fetchExamStats()
      setExamStats(stats)
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
  }, [fetchExamStats])

  // Efecto para cargar datos iniciales
  useEffect(() => {
    loadExamStats()
    loadExams(1, "", "", "")
  }, [loadExamStats, loadExams])

  // Efecto para manejar cambios en filtros
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterDate, filterStatus])

  // Efecto para manejar cambios de página
  useEffect(() => {
    loadExams(currentPage, searchTerm, filterDate, filterStatus)
  }, [currentPage, loadExams, searchTerm, filterDate, filterStatus])

  // Manejar formulario para crear horario
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    const today = new Date().toISOString().split('T')[0]
    
    if (!formData.fecha_examen) {
      errors.fecha_examen = "Fecha de examen es requerida"
    } else if (formData.fecha_examen < today) {
      errors.fecha_examen = "La fecha debe ser futura"
    }
    
    if (!formData.hora_inicio) {
      errors.hora_inicio = "Hora de inicio es requerida"
    }
    
    if (!formData.hora_fin) {
      errors.hora_fin = "Hora de fin es requerida"
    } else if (formData.hora_inicio && formData.hora_fin <= formData.hora_inicio) {
      errors.hora_fin = "La hora de fin debe ser posterior a la hora de inicio"
    }
    
    if (!formData.cupos_disponibles || formData.cupos_disponibles < 1) {
      errors.cupos_disponibles = "Debe tener al menos 1 cupo disponible"
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      await createExamSchedule(formData)
      setShowAddModal(false)
      setFormData({
        fecha_examen: "",
        hora_inicio: "",
        hora_fin: "",
        cupos_disponibles: 20,
      })
      setFormErrors({})
      await loadExams(currentPage, searchTerm, filterDate, filterStatus)
      await loadExamStats()
    } catch (err) {
      console.error("Error creando horario:", err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (examId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este horario de examen?")) {
      return
    }
    try {
      await deleteExamSchedule(examId)
      await loadExams(currentPage, searchTerm, filterDate, filterStatus)
      await loadExamStats()
    } catch (err) {
      console.error("Error eliminando horario:", err)
      setError(err.message)
    }
  }

  const handleToggleStatus = async (examId, currentStatus) => {
    try {
      await updateExamSchedule(examId, { activo: !currentStatus })
      await loadExams(currentPage, searchTerm, filterDate, filterStatus)
      await loadExamStats()
    } catch (err) {
      console.error("Error cambiando estado:", err)
      setError(err.message)
    }
  }

  // === FUNCIONES PARA GESTIÓN DE ESTUDIANTES ===
  const handleViewStudents = async (exam) => {
    setSelectedExam(exam)
    setStudentsLoading(true)
    try {
      const students = await fetchExamStudents(exam.id)
      setExamStudents(students || [])
      setShowStudentsModal(true)
    } catch (err) {
      console.error("Error cargando estudiantes:", err)
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleShowAddStudent = async () => {
    setStudentsLoading(true)
    try {
      const available = await fetchAvailableStudents(selectedExam.id)
      setAvailableStudents(available || [])
      setShowAddStudentModal(true)
    } catch (err) {
      console.error("Error cargando estudiantes disponibles:", err)
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleAddStudent = async () => {
    if (!selectedStudentId) return
    
    setStudentsLoading(true)
    try {
      await addStudentToExam(selectedExam.id, selectedStudentId)
      const updatedStudents = await fetchExamStudents(selectedExam.id)
      setExamStudents(updatedStudents || [])
      setShowAddStudentModal(false)
      setSelectedStudentId("")
      await loadExams(currentPage, searchTerm, filterDate, filterStatus)
      await loadExamStats()
    } catch (err) {
      console.error("Error agregando estudiante:", err)
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleRemoveStudent = async (studentId) => {
    if (!window.confirm("¿Estás seguro de que quieres remover este estudiante del examen?")) {
      return
    }
    
    setStudentsLoading(true)
    try {
      await removeStudentFromExam(selectedExam.id, studentId)
      const updatedStudents = await fetchExamStudents(selectedExam.id)
      setExamStudents(updatedStudents || [])
      await loadExams(currentPage, searchTerm, filterDate, filterStatus)
      await loadExamStats()
    } catch (err) {
      console.error("Error removiendo estudiante:", err)
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  const handleUpdateStudentStatus = async (studentId, newStatus) => {
    setStudentsLoading(true)
    try {
      await updateStudentExamStatus(selectedExam.id, studentId, newStatus)
      const updatedStudents = await fetchExamStudents(selectedExam.id)
      setExamStudents(updatedStudents || [])
    } catch (err) {
      console.error("Error actualizando estado:", err)
      setError(err.message)
    } finally {
      setStudentsLoading(false)
    }
  }

  const getStatusColor = (estado) => {
    const colors = {
      agendado: "#2196F3",
      confirmado: "#4CAF50", 
      cancelado: "#f44336",
      completado: "#9C27B0"
    }
    return colors[estado] || "#6c757d"
  }

  const getStatusText = (estado) => {
    const texts = {
      agendado: "Agendado",
      confirmado: "Confirmado",
      cancelado: "Cancelado", 
      completado: "Completado"
    }
    return texts[estado] || estado
  }

  const formatTime = (time) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > examsData.pagination.totalPages) {
      return
    }
    if (newPage === currentPage) {
      return
    }
    setCurrentPage(newPage)
  }

  const getLocalStats = () => {
    return [
      {
        label: "Total Horarios",
        value: examStats.total_horarios || 0,
        icon: "📅",
        color: "#2196F3",
      },
      {
        label: "Horarios Activos",
        value: examStats.horarios_activos || 0,
        icon: "✅",
        color: "#4CAF50",
      },
      {
        label: "Cupos Totales",
        value: examStats.cupos_totales || 0,
        icon: "🎯",
        color: "#FF9800",
      },
      {
        label: "Estudiantes Agendados",
        value: examStats.estudiantes_agendados || 0,
        icon: "👥",
        color: "#9C27B0",
      },
    ]
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterDate("")
    setFilterStatus("")
    setCurrentPage(1)
  }

  if (error && !examsData.exams.length) {
    return (
      <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ background: "white", padding: "40px", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", border: "2px solid #f44336" }}>
          <div style={{ fontSize: "4rem", marginBottom: "20px" }}>⚠️</div>
          <h2 style={{ color: "#f44336", marginBottom: "16px" }}>Error al cargar horarios de examen</h2>
          <p style={{ color: "#6c757d", marginBottom: "24px" }}>{error}</p>
          <button
            onClick={() => loadExams(currentPage, searchTerm, filterDate, filterStatus)}
            style={{ background: "#f44336", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "1rem", fontWeight: "600" }}
          >
            Reintentar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1400px", margin: "0 auto", minHeight: "100vh", background: "#f8f9fa" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <Link
          to="/admin"
          style={{ textDecoration: "none", color: "#6c757d", fontSize: "14px", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}
        >
          ← Volver al Dashboard
        </Link>
        <div style={{ background: "white", padding: "32px", borderRadius: "20px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", border: "1px solid rgba(0, 0, 0, 0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
            <div style={{ fontSize: "3rem" }}>📝</div>
            <div>
              <h1 style={{ fontSize: "2.2rem", color: "#2E7D32", marginBottom: "8px", fontWeight: "800" }}>
                Gestionar Horarios de Examen
              </h1>
              <p style={{ color: "#6c757d", margin: 0, fontSize: "1.1rem" }}>
                Administra horarios de examen, cupos y estudiantes agendados
              </p>
            </div>
          </div>
          {error && (
            <div style={{ background: "#ffebee", border: "1px solid #f44336", color: "#d32f2f", padding: "12px 16px", borderRadius: "8px", marginTop: "16px" }}>
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Filtros y Búsqueda */}
      <div style={{ background: "white", padding: "24px", borderRadius: "16px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
          <input
            type="text"
            placeholder="🔍 Buscar horarios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: "100%", padding: "12px 16px", paddingRight: searchTerm ? "40px" : "16px", border: "2px solid #e9ecef", borderRadius: "12px", fontSize: "16px", outline: "none", transition: "all 0.3s ease", boxSizing: "border-box" }}
            onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
            onBlur={(e) => (e.target.style.borderColor = "#e9ecef")}
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#6c757d", padding: "4px" }}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <input
          type="date"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
          style={{ padding: "12px 16px", border: "2px solid #e9ecef", borderRadius: "12px", fontSize: "16px", outline: "none", minWidth: "150px", cursor: "pointer" }}
        />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: "12px 16px", border: "2px solid #e9ecef", borderRadius: "12px", fontSize: "16px", outline: "none", minWidth: "150px", cursor: "pointer" }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        {(searchTerm || filterDate || filterStatus) && (
          <button
            onClick={clearFilters}
            style={{ background: "#6c757d", color: "white", border: "none", padding: "12px 20px", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease" }}
          >
            Limpiar
          </button>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          style={{ background: "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "white", border: "none", padding: "12px 24px", borderRadius: "12px", fontSize: "16px", fontWeight: "600", cursor: "pointer", transition: "all 0.3s ease", display: "flex", alignItems: "center", gap: "8px" }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-2px)"
            e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)"
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)"
            e.target.style.boxShadow = "none"
          }}
        >
          <span style={{ fontSize: "18px" }}>+</span>
          Nuevo Horario
        </button>
      </div>

      {/* Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        {getLocalStats().map((stat, index) => (
          <div
            key={index}
            style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)", textAlign: "center", border: `2px solid ${stat.color}20` }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Lista de Horarios */}
      {loading ? (
        <LoadingSpinner message="Cargando horarios de examen..." />
      ) : (
        <>
          <div style={{ background: "white", borderRadius: "16px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)", overflow: "hidden" }}>
            <div style={{ padding: "24px", borderBottom: "1px solid #e9ecef", background: "linear-gradient(135deg, #f8f9fa, #e9ecef)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, color: "#2c3e50", fontWeight: "700" }}>
                Horarios de Examen ({examsData.pagination.total || 0})
              </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#2c3e50" }}>Fecha y Hora</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Cupos</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Estudiantes</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Estado</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {examsData.exams.map((exam) => (
                    <tr
                      key={exam.id}
                      style={{ borderBottom: "1px solid #f1f3f4", transition: "all 0.2s ease" }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "linear-gradient(135deg, #2196F3, #1976D2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "16px" }}>
                            📅
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {formatDate(exam.fecha_examen)}
                            </div>
                            <div style={{ fontSize: "14px", color: "#6c757d" }}>
                              {formatTime(exam.hora_inicio)} - {formatTime(exam.hora_fin)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
                          <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                            {exam.cupos_ocupados || 0} / {exam.cupos_disponibles || 0}
                          </div>
                          <div style={{ width: "60px", height: "6px", background: "#e9ecef", borderRadius: "3px", overflow: "hidden" }}>
                            <div
                              style={{
                                width: `${((exam.cupos_ocupados || 0) / (exam.cupos_disponibles || 1)) * 100}%`,
                                height: "100%",
                                background: (exam.cupos_ocupados || 0) >= (exam.cupos_disponibles || 0) ? "#f44336" : "#4CAF50",
                                transition: "all 0.3s ease"
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleViewStudents(exam)}
                          style={{ background: "#e3f2fd", color: "#1976d2", border: "none", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", margin: "0 auto" }}
                        >
                          👥 Ver ({exam.cupos_ocupados || 0})
                        </button>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleStatus(exam.id, exam.activo)}
                          style={{ background: exam.activo ? "#4CAF5020" : "#f4433620", color: exam.activo ? "#4CAF50" : "#f44336", border: "none", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "600", cursor: "pointer", textTransform: "capitalize" }}
                        >
                          {exam.activo ? "Activo" : "Inactivo"}
                        </button>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleDelete(exam.id)}
                            style={{ background: "none", border: "1px solid #f44336", color: "#f44336", padding: "6px 12px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", transition: "all 0.2s ease" }}
                            onMouseOver={(e) => { e.target.style.background = "#f4433620" }}
                            onMouseOut={(e) => { e.target.style.background = "none" }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mensaje si no hay horarios */}
            {examsData.exams.length === 0 && !loading && (
              <div style={{ padding: "60px 20px", textAlign: "center", color: "#6c757d" }}>
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📅</div>
                <h3>No se encontraron horarios de examen</h3>
                <p>
                  {searchTerm || filterDate || filterStatus
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay horarios disponibles"}
                </p>
                {(searchTerm || filterDate || filterStatus) && (
                  <button
                    onClick={clearFilters}
                    style={{ background: "#4CAF50", color: "white", border: "none", padding: "12px 24px", borderRadius: "8px", cursor: "pointer", fontSize: "16px", fontWeight: "600", marginTop: "16px" }}
                  >
                    Limpiar filtros
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Paginación */}
          {examsData.pagination.totalPages > 1 && (
            <div style={{ background: "white", padding: "20px", borderRadius: "12px", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.1)", marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ color: "#6c757d", fontSize: "14px" }}>
                Mostrando {examsData.exams.length} de {examsData.pagination.total} horarios
                <br />
                Página {currentPage} de {examsData.pagination.totalPages}
              </div>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(1)}
                  style={{ padding: "8px 12px", border: "1px solid #e9ecef", borderRadius: "6px", cursor: currentPage <= 1 ? "not-allowed" : "pointer", opacity: currentPage <= 1 ? 0.5 : 1, background: currentPage <= 1 ? "#f8f9fa" : "white", fontSize: "14px" }}
                  title="Primera página"
                >
                  ⏮️
                </button>

                <button
                  disabled={currentPage <= 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                  style={{ padding: "8px 16px", border: "1px solid #e9ecef", borderRadius: "6px", cursor: currentPage <= 1 ? "not-allowed" : "pointer", opacity: currentPage <= 1 ? 0.5 : 1, background: currentPage <= 1 ? "#f8f9fa" : "white" }}
                >
                  ← Anterior
                </button>

                {Array.from({ length: Math.min(5, examsData.pagination.totalPages) }, (_, i) => {
                  let pageNum
                  const totalPages = examsData.pagination.totalPages

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
                      onClick={() => handlePageChange(pageNum)}
                      style={{ padding: "8px 12px", border: "1px solid #e9ecef", borderRadius: "6px", cursor: "pointer", background: pageNum === currentPage ? "#4CAF50" : "white", color: pageNum === currentPage ? "white" : "#333", fontWeight: pageNum === currentPage ? "600" : "normal" }}
                    >
                      {pageNum}
                    </button>
                  )
                })}

                <button
                  disabled={currentPage >= examsData.pagination.totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                  style={{ padding: "8px 16px", border: "1px solid #e9ecef", borderRadius: "6px", cursor: currentPage >= examsData.pagination.totalPages ? "not-allowed" : "pointer", opacity: currentPage >= examsData.pagination.totalPages ? 0.5 : 1, background: currentPage >= examsData.pagination.totalPages ? "#f8f9fa" : "white" }}
                >
                  Siguiente →
                </button>

                <button
                  disabled={currentPage >= examsData.pagination.totalPages}
                  onClick={() => handlePageChange(examsData.pagination.totalPages)}
                  style={{ padding: "8px 12px", border: "1px solid #e9ecef", borderRadius: "6px", cursor: currentPage >= examsData.pagination.totalPages ? "not-allowed" : "pointer", opacity: currentPage >= examsData.pagination.totalPages ? 0.5 : 1, background: currentPage >= examsData.pagination.totalPages ? "#f8f9fa" : "white", fontSize: "14px" }}
                  title="Última página"
                >
                  ⏭️
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal Agregar Horario */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "24px", color: "#2c3e50", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>📅</span>
              Nuevo Horario de Examen
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Fecha del Examen *
                </label>
                <input
                  type="date"
                  value={formData.fecha_examen}
                  onChange={(e) => handleFormChange("fecha_examen", e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  style={{ width: "100%", padding: "12px", border: formErrors.fecha_examen ? "2px solid #f44336" : "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                  required
                />
                {formErrors.fecha_examen && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>
                    {formErrors.fecha_examen}
                  </div>
                )}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Hora de Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => handleFormChange("hora_inicio", e.target.value)}
                    style={{ width: "100%", padding: "12px", border: formErrors.hora_inicio ? "2px solid #f44336" : "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                    required
                  />
                  {formErrors.hora_inicio && (
                    <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>
                      {formErrors.hora_inicio}
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Hora de Fin *
                  </label>
                  <input
                    type="time"
                    value={formData.hora_fin}
                    onChange={(e) => handleFormChange("hora_fin", e.target.value)}
                    style={{ width: "100%", padding: "12px", border: formErrors.hora_fin ? "2px solid #f44336" : "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                    required
                  />
                  {formErrors.hora_fin && (
                    <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>
                      {formErrors.hora_fin}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Cupos Disponibles *
                </label>
                <input
                  type="number"
                  value={formData.cupos_disponibles}
                  onChange={(e) => handleFormChange("cupos_disponibles", parseInt(e.target.value))}
                  min="1"
                  max="100"
                  style={{ width: "100%", padding: "12px", border: formErrors.cupos_disponibles ? "2px solid #f44336" : "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box" }}
                  placeholder="20"
                  required
                />
                {formErrors.cupos_disponibles && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>
                    {formErrors.cupos_disponibles}
                  </div>
                )}
              </div>

              <div style={{ background: "#e3f2fd", border: "1px solid #2196f3", borderRadius: "8px", padding: "16px", marginBottom: "24px" }}>
                <div style={{ color: "#1976d2", fontSize: "14px", lineHeight: "1.4" }}>
                  <strong>💡 Información:</strong>
                  <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                    <li>La fecha debe ser futura</li>
                    <li>La hora de fin debe ser posterior a la de inicio</li>
                    <li>Los cupos pueden modificarse posteriormente</li>
                  </ul>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({ fecha_examen: "", hora_inicio: "", hora_fin: "", cupos_disponibles: 20 })
                    setFormErrors({})
                  }}
                  style={{ padding: "12px 24px", border: "2px solid #e9ecef", borderRadius: "8px", background: "white", color: "#6c757d", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "12px 24px", border: "none", borderRadius: "8px", background: submitting ? "#ccc" : "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "white", cursor: submitting ? "not-allowed" : "pointer", fontSize: "16px", fontWeight: "600" }}
                >
                  {submitting ? "Creando..." : "Crear Horario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ver Estudiantes */}
      {showStudentsModal && selectedExam && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "800px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "24px", color: "#2c3e50", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>👥</span>
              Estudiantes Agendados - {formatDate(selectedExam.fecha_examen)}
            </h2>

            <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "12px", marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                  {formatTime(selectedExam.hora_inicio)} - {formatTime(selectedExam.hora_fin)}
                </div>
                <div style={{ fontSize: "14px", color: "#6c757d" }}>
                  Cupos: {selectedExam.cupos_ocupados || 0} / {selectedExam.cupos_disponibles || 0}
                </div>
              </div>
              <button
                onClick={handleShowAddStudent}
                disabled={studentsLoading || (selectedExam.cupos_ocupados >= selectedExam.cupos_disponibles)}
                style={{ background: studentsLoading || (selectedExam.cupos_ocupados >= selectedExam.cupos_disponibles) ? "#ccc" : "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "white", border: "none", padding: "10px 16px", borderRadius: "8px", fontSize: "14px", fontWeight: "600", cursor: studentsLoading || (selectedExam.cupos_ocupados >= selectedExam.cupos_disponibles) ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <span>+</span>
                Agregar Estudiante
              </button>
            </div>

            {studentsLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
                <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
                Cargando estudiantes...
              </div>
            ) : (
              <>
                {examStudents.length > 0 ? (
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse" }}>
                      <thead>
                        <tr style={{ background: "#f8f9fa" }}>
                          <th style={{ padding: "12px", textAlign: "left", fontWeight: "600", color: "#2c3e50" }}>Estudiante</th>
                          <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Estado</th>
                          <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Fecha Agendamiento</th>
                          <th style={{ padding: "12px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {examStudents.map((student, index) => (
                          <tr key={index} style={{ borderBottom: "1px solid #f1f3f4" }}>
                            <td style={{ padding: "12px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #2196F3, #1976D2)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: "700", fontSize: "14px" }}>
                                  {student.nombres?.charAt(0) || "?"}
                                </div>
                                <div>
                                  <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                                    {student.nombres} {student.apellidos}
                                  </div>
                                  <div style={{ fontSize: "12px", color: "#6c757d" }}>{student.email}</div>
                                </div>
                              </div>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <select
                                value={student.estado || 'agendado'}
                                onChange={(e) => handleUpdateStudentStatus(student.id, e.target.value)}
                                disabled={studentsLoading}
                                style={{ background: `${getStatusColor(student.estado || 'agendado')}20`, color: getStatusColor(student.estado || 'agendado'), border: "none", padding: "4px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: "600", cursor: studentsLoading ? "not-allowed" : "pointer" }}
                              >
                                <option value="agendado">Agendado</option>
                                <option value="confirmado">Confirmado</option>
                                <option value="cancelado">Cancelado</option>
                                <option value="completado">Completado</option>
                              </select>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center", color: "#6c757d", fontSize: "14px" }}>
                              {new Date(student.fecha_agendamiento).toLocaleDateString()}
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <button
                                onClick={() => handleRemoveStudent(student.id)}
                                disabled={studentsLoading}
                                style={{ background: "none", border: "1px solid #f44336", color: "#f44336", padding: "4px 8px", borderRadius: "4px", cursor: studentsLoading ? "not-allowed" : "pointer", fontSize: "11px", transition: "all 0.2s ease" }}
                                onMouseOver={(e) => { if (!studentsLoading) e.target.style.background = "#f4433620" }}
                                onMouseOut={(e) => { e.target.style.background = "none" }}
                              >
                                Remover
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
                    <div style={{ fontSize: "3rem", marginBottom: "16px" }}>👥</div>
                    <h3>No hay estudiantes agendados</h3>
                    <p>Este horario aún no tiene estudiantes agendados</p>
                  </div>
                )}
              </>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", marginTop: "24px" }}>
              <button
                onClick={() => {
                  setShowStudentsModal(false)
                  setSelectedExam(null)
                  setExamStudents([])
                }}
                style={{ padding: "12px 24px", border: "2px solid #e9ecef", borderRadius: "8px", background: "white", color: "#6c757d", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Agregar Estudiante */}
      {showAddStudentModal && selectedExam && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1001, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "500px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
            <h2 style={{ marginBottom: "24px", color: "#2c3e50", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "1.5rem" }}>➕</span>
              Agregar Estudiante al Examen
            </h2>

            <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: "12px", marginBottom: "24px" }}>
              <div style={{ fontWeight: "600", color: "#2c3e50", marginBottom: "4px" }}>
                {formatDate(selectedExam.fecha_examen)}
              </div>
              <div style={{ fontSize: "14px", color: "#6c757d" }}>
                {formatTime(selectedExam.hora_inicio)} - {formatTime(selectedExam.hora_fin)}
              </div>
            </div>

            {studentsLoading ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6c757d" }}>
                <div style={{ fontSize: "2rem", marginBottom: "16px" }}>⏳</div>
                Cargando estudiantes disponibles...
              </div>
            ) : (
              <>
                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                    Seleccionar Estudiante *
                  </label>
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    style={{ width: "100%", padding: "12px", border: "2px solid #e9ecef", borderRadius: "8px", fontSize: "16px", boxSizing: "border-box", cursor: "pointer" }}
                    required
                  >
                    <option value="">-- Seleccionar estudiante --</option>
                    {availableStudents.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.nombres} {student.apellidos} - {student.email}
                      </option>
                    ))}
                  </select>
                </div>

                {availableStudents.length === 0 && (
                  <div style={{ background: "#fff3e0", border: "1px solid #ff9800", borderRadius: "8px", padding: "12px", marginBottom: "20px", color: "#e65100", fontSize: "14px" }}>
                    <strong>⚠️ No hay estudiantes disponibles</strong>
                    <p style={{ margin: "4px 0 0 0" }}>
                      Todos los estudiantes elegibles ya están agendados para este horario o no cumplen los requisitos.
                    </p>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    onClick={() => {
                      setShowAddStudentModal(false)
                      setSelectedStudentId("")
                      setAvailableStudents([])
                    }}
                    style={{ padding: "12px 24px", border: "2px solid #e9ecef", borderRadius: "8px", background: "white", color: "#6c757d", cursor: "pointer", fontSize: "16px", fontWeight: "600" }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAddStudent}
                    disabled={!selectedStudentId || studentsLoading}
                    style={{ padding: "12px 24px", border: "none", borderRadius: "8px", background: !selectedStudentId || studentsLoading ? "#ccc" : "linear-gradient(135deg, #4CAF50, #2E7D32)", color: "white", cursor: !selectedStudentId || studentsLoading ? "not-allowed" : "pointer", fontSize: "16px", fontWeight: "600" }}
                  >
                    {studentsLoading ? "Agregando..." : "Agregar Estudiante"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminExamenes