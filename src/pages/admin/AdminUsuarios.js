import { useState, useEffect, useCallback } from "react"
import { Link } from "react-router-dom"
import { useFuncion } from "../../context/FuncionContext"
import LoadingSpinner from "../../components/LoadingSpinner"

const AdminUsuarios = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [filterRole, setFilterRole] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showAddModal, setShowAddModal] = useState(false)
  const [showRolesModal, setShowRolesModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Estados para los datos paginados desde backend
  const [usersData, setUsersData] = useState({
    users: [],
    pagination: {
      page: 1,
      limit: 5,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  })

  const [userStats, setUserStats] = useState({
    total_usuarios: 0,
    usuarios_activos: 0,
    usuarios_inactivos: 0,
    roles_distribution: [],
  })

  // Configuración de paginación
  const ITEMS_PER_PAGE = 5

  // Estados para el formulario de nuevo usuario
  const [formData, setFormData] = useState({
    codigo_institucional: "",
    email: "",
    nombres: "",
    apellidos: "",
  })
  const [formErrors, setFormErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  // Estados para gestión de roles
  const [userRoles, setUserRoles] = useState([])
  const [availableRoles] = useState(["estudiante", "docente", "administrador"])
  const [rolesLoading, setRolesLoading] = useState(false)

  const { fetchUsers, fetchUserStats, createUser, deleteUser, addUserRole, removeUserRole, toggleUserStatus } =
    useFuncion()

  // Cargar usuarios con paginación desde backend
  const loadUsers = useCallback(
    async (page = 1, search = "", role = "", status = "") => {
      try {
        setLoading(true)
        setError(null)

        const params = {
          page: page,
          limit: ITEMS_PER_PAGE,
        }

        // Solo agregar search si no está vacío
        if (search && search.trim()) {
          params.search = search.trim()
        }

        // Solo agregar role si no está vacío
        if (role && role.trim()) {
          params.role = role.trim()
        }

        // Solo agregar status si no está vacío
        if (status && status.trim()) {
          params.status = status.trim()
        }

        const data = await fetchUsers(params)

        if (data && data.users) {
          setUsersData({
            users: data.users || [],
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
          console.warn("⚠️ Estructura de datos inesperada:", data)
          setUsersData({
            users: [],
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
        console.error("❌ Error cargando usuarios:", err)
        setError(err.message)
        setUsersData({
          users: [],
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

  // Cargar estadísticas
  const loadUserStats = useCallback(async () => {
    try {
      const stats = await fetchUserStats()
      setUserStats(stats)
    } catch (err) {
      console.error("Error cargando estadísticas:", err)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Efecto para cargar datos iniciales - SOLO UNA VEZ
  useEffect(() => {
    loadUserStats()
    loadUsers(1, "", "", "")
  }, [loadUserStats, loadUsers])

  // Efecto para manejar cambios en filtros - resetea a página 1
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filterRole, filterStatus])

  // Efecto para manejar cambios de página
  useEffect(() => {
    loadUsers(currentPage, searchTerm, filterRole, filterStatus)
  }, [currentPage, loadUsers, searchTerm, filterRole, filterStatus])

  // Nuevo useEffect separado para cuando cambian los filtros (y ya estamos en página 1)
  useEffect(() => {
    if (currentPage === 1) {
      loadUsers(1, searchTerm, filterRole, filterStatus)
    }
  }, [searchTerm, filterRole, filterStatus, loadUsers, currentPage])

  // Manejar formulario SOLO para crear usuario
  const handleFormChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }))
    // Limpiar error del campo
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }))
    }
  }

  const validateForm = () => {
    const errors = {}
    if (!formData.codigo_institucional) {
      errors.codigo_institucional = "Código institucional es requerido"
    }
    if (!formData.email) {
      errors.email = "Email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = "Email inválido"
    }
    if (!formData.nombres) {
      errors.nombres = "Nombres son requeridos"
    }
    if (!formData.apellidos) {
      errors.apellidos = "Apellidos son requeridos"
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    setSubmitting(true)
    try {
      // Solo crear usuario
      await createUser(formData)
      setShowAddModal(false)
      setFormData({
        codigo_institucional: "",
        email: "",
        nombres: "",
        apellidos: "",
      })
      setFormErrors({})
      // Recargar datos
      await loadUsers(currentPage, searchTerm, filterRole, filterStatus)
      await loadUserStats()
    } catch (err) {
      console.error("Error creando usuario:", err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (userId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este usuario?")) {
      return
    }
    try {
      await deleteUser(userId)
      await loadUsers(currentPage, searchTerm, filterRole, filterStatus)
      await loadUserStats()
    } catch (err) {
      console.error("Error eliminando usuario:", err)
      setError(err.message)
    }
  }

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await toggleUserStatus(userId, !currentStatus)
      await loadUsers(currentPage, searchTerm, filterRole, filterStatus)
      await loadUserStats()
    } catch (err) {
      console.error("Error cambiando estado:", err)
      setError(err.message)
    }
  }

  // === FUNCIONES PARA GESTIÓN DE ROLES ===
  const handleManageRoles = (user) => {
    setSelectedUser(user)
    setUserRoles([...(user.roles || [])])
    setShowRolesModal(true)
  }

  const handleAddRole = async (role) => {
    if (userRoles.includes(role)) return
    setRolesLoading(true)
    try {
      await addUserRole(selectedUser.id, role)
      setUserRoles((prev) => [...prev, role])
      // Actualizar la lista de usuarios localmente
      setUsersData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) =>
          user.id === selectedUser.id ? { ...user, roles: [...(user.roles || []), role] } : user,
        ),
      }))
      await loadUserStats()
    } catch (err) {
      console.error("Error agregando rol:", err)
      setError(err.message)
    } finally {
      setRolesLoading(false)
    }
  }

  const handleRemoveRole = async (role) => {
    if (userRoles.length <= 1) {
      alert("El usuario debe tener al menos un rol")
      return
    }
    setRolesLoading(true)
    try {
      await removeUserRole(selectedUser.id, role)
      setUserRoles((prev) => prev.filter((r) => r !== role))
      // Actualizar la lista de usuarios localmente
      setUsersData((prevData) => ({
        ...prevData,
        users: prevData.users.map((user) =>
          user.id === selectedUser.id ? { ...user, roles: (user.roles || []).filter((r) => r !== role) } : user,
        ),
      }))
      await loadUserStats()
    } catch (err) {
      console.error("Error removiendo rol:", err)
      setError(err.message)
    } finally {
      setRolesLoading(false)
    }
  }

  const getRoleColor = (rol) => {
    const colors = {
      administrador: "#FF9800",
      docente: "#4CAF50",
      estudiante: "#2196F3",
    }
    return colors[rol] || "#6c757d"
  }

  const getStatusColor = (estado) => {
    return estado ? "#4CAF50" : "#f44336"
  }

  const getStatusText = (estado) => {
    return estado ? "Activo" : "Inactivo"
  }

  // Función simplificada para cambio de página
  const handlePageChange = (newPage) => {

    // Validaciones
    if (newPage < 1 || newPage > usersData.pagination.totalPages) {
      console.warn("⚠️ Página inválida:", newPage)
      return
    }

    if (newPage === currentPage) {
      return
    }

    setCurrentPage(newPage)
  }

  // Calcular estadísticas locales
  const getLocalStats = () => {
    const rolesCount = {}
    userStats.roles_distribution?.forEach((role) => {
      rolesCount[role.rol] = Number.parseInt(role.cantidad) || 0
    })

    return [
      {
        label: "Total Usuarios",
        value: Number.parseInt(userStats.total_usuarios) || 0,
        icon: "👥",
        color: "#2196F3",
      },
      {
        label: "Estudiantes",
        value: rolesCount.estudiante || 0,
        icon: "🎓",
        color: "#9C27B0",
      },
      {
        label: "Docentes",
        value: rolesCount.docente || 0,
        icon: "👨‍🏫",
        color: "#FF9800",
      },
      {
        label: "Administradores",
        value: rolesCount.administrador || 0,
        icon: "⚙️",
        color: "#4CAF50",
      },
    ]
  }

  const clearFilters = () => {
    setSearchTerm("")
    setFilterRole("")
    setFilterStatus("")
    setCurrentPage(1)
  }

  if (error && !usersData.users.length) {
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
          <h2 style={{ color: "#f44336", marginBottom: "16px" }}>Error al cargar usuarios</h2>
          <p style={{ color: "#6c757d", marginBottom: "24px" }}>{error}</p>
          <button
            onClick={() => loadUsers(currentPage, searchTerm, filterRole, filterStatus)}
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
            <div style={{ fontSize: "3rem" }}>👥</div>
            <div>
              <h1
                style={{
                  fontSize: "2.2rem",
                  color: "#2E7D32",
                  marginBottom: "8px",
                  fontWeight: "800",
                }}
              >
                Gestionar Usuarios
              </h1>
              <p style={{ color: "#6c757d", margin: 0, fontSize: "1.1rem" }}>
                Administra cuentas de usuarios, permisos y roles del sistema
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
            placeholder="🔍 Buscar por nombre o email..."
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
            onFocus={(e) => (e.target.style.borderColor = "#4CAF50")}
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
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "2px solid #e9ecef",
            borderRadius: "12px",
            fontSize: "16px",
            outline: "none",
            minWidth: "150px",
            cursor: "pointer",
          }}
        >
          <option value="">Todos los roles</option>
          <option value="estudiante">Estudiantes</option>
          <option value="docente">Docentes</option>
          <option value="administrador">Administradores</option>
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: "12px 16px",
            border: "2px solid #e9ecef",
            borderRadius: "12px",
            fontSize: "16px",
            outline: "none",
            minWidth: "150px",
            cursor: "pointer",
          }}
        >
          <option value="">Todos los estados</option>
          <option value="activo">Activos</option>
          <option value="inactivo">Inactivos</option>
        </select>

        {(searchTerm || filterRole || filterStatus) && (
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
          onClick={() => setShowAddModal(true)}
          style={{
            background: "linear-gradient(135deg, #4CAF50, #2E7D32)",
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
            e.target.style.boxShadow = "0 6px 20px rgba(76, 175, 80, 0.4)"
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)"
            e.target.style.boxShadow = "none"
          }}
        >
          <span style={{ fontSize: "18px" }}>+</span>
          Nuevo Usuario
        </button>
      </div>

      {/* Estadísticas */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        {getLocalStats().map((stat, index) => (
          <div
            key={index}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)",
              textAlign: "center",
              border: `2px solid ${stat.color}20`,
            }}
          >
            <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{stat.icon}</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "700", color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: "0.9rem", color: "#6c757d" }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Indicador de filtros activos */}
      {(searchTerm || filterRole || filterStatus) && (
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
            Mostrando {usersData.pagination.total} usuarios
            {searchTerm && ` con "${searchTerm}"`}
            {filterRole && ` (rol: ${filterRole})`}
            {filterStatus && ` (estado: ${filterStatus})`}
          </span>
        </div>
      )}

      {/* Lista de Usuarios */}
      {loading ? (
        <LoadingSpinner message="Cargando usuarios..." />
      ) : (
        <>
          <div
            style={{
              background: "white",
              borderRadius: "16px",
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid #e9ecef",
                background: "linear-gradient(135deg, #f8f9fa, #e9ecef)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <h3 style={{ margin: 0, color: "#2c3e50", fontWeight: "700" }}>
                Lista de Usuarios ({usersData.pagination.total || 0})
              </h3>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f8f9fa" }}>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#2c3e50" }}>Usuario</th>
                    <th style={{ padding: "16px", textAlign: "left", fontWeight: "600", color: "#2c3e50" }}>Email</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>Roles</th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>
                      Estado
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>
                      Registro
                    </th>
                    <th style={{ padding: "16px", textAlign: "center", fontWeight: "600", color: "#2c3e50" }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {usersData.users.map((usuario) => (
                    <tr
                      key={usuario.id}
                      style={{
                        borderBottom: "1px solid #f1f3f4",
                        transition: "all 0.2s ease",
                      }}
                      onMouseOver={(e) => (e.currentTarget.style.background = "#f8f9fa")}
                      onMouseOut={(e) => (e.currentTarget.style.background = "white")}
                    >
                      <td style={{ padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              background: `linear-gradient(135deg, ${getRoleColor(usuario.roles?.[0])}, ${getRoleColor(usuario.roles?.[0])}80)`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "white",
                              fontWeight: "700",
                              fontSize: "16px",
                            }}
                          >
                            {usuario.nombres?.charAt(0) || "?"}
                          </div>
                          <div>
                            <div style={{ fontWeight: "600", color: "#2c3e50" }}>
                              {usuario.nombres} {usuario.apellidos}
                            </div>
                            {usuario.codigo_institucional && (
                              <div style={{ fontSize: "12px", color: "#6c757d" }}>{usuario.codigo_institucional}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "16px", color: "#6c757d" }}>{usuario.email}</td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", justifyContent: "center" }}>
                          {(usuario.roles || []).map((role, index) => (
                            <span
                              key={index}
                              style={{
                                background: `${getRoleColor(role)}20`,
                                color: getRoleColor(role),
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: "600",
                                textTransform: "capitalize",
                              }}
                            >
                              {role}
                            </span>
                          ))}
                          <button
                            onClick={() => handleManageRoles(usuario)}
                            style={{
                              background: "#e3f2fd",
                              color: "#1976d2",
                              border: "none",
                              padding: "2px 6px",
                              borderRadius: "12px",
                              fontSize: "11px",
                              fontWeight: "600",
                              cursor: "pointer",
                              marginLeft: "4px",
                            }}
                            title="Gestionar roles"
                          >
                            ⚙️
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <button
                          onClick={() => handleToggleStatus(usuario.id, usuario.activo)}
                          style={{
                            background: `${getStatusColor(usuario.activo)}20`,
                            color: getStatusColor(usuario.activo),
                            border: "none",
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            textTransform: "capitalize",
                          }}
                        >
                          {getStatusText(usuario.activo)}
                        </button>
                      </td>
                      <td style={{ padding: "16px", textAlign: "center", color: "#6c757d" }}>
                        {new Date(usuario.fecha_creacion).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "16px", textAlign: "center" }}>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          <button
                            onClick={() => handleDelete(usuario.id)}
                            style={{
                              background: "none",
                              border: "1px solid #f44336",
                              color: "#f44336",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              transition: "all 0.2s ease",
                            }}
                            onMouseOver={(e) => {
                              e.target.style.background = "#f4433620"
                            }}
                            onMouseOut={(e) => {
                              e.target.style.background = "none"
                            }}
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

            {/* Mensaje si no hay usuarios */}
            {usersData.users.length === 0 && !loading && (
              <div
                style={{
                  padding: "60px 20px",
                  textAlign: "center",
                  color: "#6c757d",
                }}
              >
                <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔍</div>
                <h3>No se encontraron usuarios</h3>
                <p>
                  {searchTerm || filterRole || filterStatus
                    ? "Intenta cambiar los filtros de búsqueda"
                    : "No hay usuarios disponibles"}
                </p>
                {(searchTerm || filterRole || filterStatus) && (
                  <button
                    onClick={clearFilters}
                    style={{
                      background: "#4CAF50",
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
          {usersData.pagination.totalPages > 1 && (
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
                Mostrando {usersData.users.length} de {usersData.pagination.total} usuarios
                <br />
                Página {currentPage} de {usersData.pagination.totalPages}
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
                {Array.from({ length: Math.min(5, usersData.pagination.totalPages) }, (_, i) => {
                  let pageNum
                  const totalPages = usersData.pagination.totalPages

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
                        background: pageNum === currentPage ? "#4CAF50" : "white",
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
                  disabled={currentPage >= usersData.pagination.totalPages}
                  onClick={() => {
                    handlePageChange(currentPage + 1)
                  }}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #e9ecef",
                    borderRadius: "6px",
                    cursor: currentPage >= usersData.pagination.totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage >= usersData.pagination.totalPages ? 0.5 : 1,
                    background: currentPage >= usersData.pagination.totalPages ? "#f8f9fa" : "white",
                  }}
                >
                  Siguiente →
                </button>

                {/* Última página */}
                <button
                  disabled={currentPage >= usersData.pagination.totalPages}
                  onClick={() => {
                    handlePageChange(usersData.pagination.totalPages)
                  }}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid #e9ecef",
                    borderRadius: "6px",
                    cursor: currentPage >= usersData.pagination.totalPages ? "not-allowed" : "pointer",
                    opacity: currentPage >= usersData.pagination.totalPages ? 0.5 : 1,
                    background: currentPage >= usersData.pagination.totalPages ? "#f8f9fa" : "white",
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

      {/* Modal Gestión de Roles */}
      {showRolesModal && selectedUser && (
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
            zIndex: 1000,
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
            <h2
              style={{
                marginBottom: "24px",
                color: "#2c3e50",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <span style={{ fontSize: "1.5rem" }}>👤</span>
              Gestionar Roles - {selectedUser.nombres} {selectedUser.apellidos}
            </h2>

            {/* Roles Actuales */}
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  color: "#2c3e50",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>🏷️</span>
                Roles Actuales
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                  padding: "16px",
                  background: "#f8f9fa",
                  borderRadius: "12px",
                  border: "2px solid #e9ecef",
                }}
              >
                {userRoles.length > 0 ? (
                  userRoles.map((role, index) => (
                    <div
                      key={index}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        background: `${getRoleColor(role)}20`,
                        color: getRoleColor(role),
                        padding: "8px 12px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                        border: `2px solid ${getRoleColor(role)}30`,
                      }}
                    >
                      <span style={{ textTransform: "capitalize" }}>{role}</span>
                      {userRoles.length > 1 && (
                        <button
                          onClick={() => handleRemoveRole(role)}
                          disabled={rolesLoading}
                          style={{
                            background: "none",
                            border: "none",
                            color: getRoleColor(role),
                            cursor: rolesLoading ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            padding: "2px",
                            borderRadius: "50%",
                            width: "18px",
                            height: "18px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            opacity: rolesLoading ? 0.5 : 1,
                          }}
                          title="Remover rol"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#6c757d", fontStyle: "italic" }}>No hay roles asignados</div>
                )}
              </div>
            </div>

            {/* Agregar Nuevos Roles */}
            <div style={{ marginBottom: "24px" }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  color: "#2c3e50",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span>➕</span>
                Agregar Roles
              </h3>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "8px",
                }}
              >
                {availableRoles.map((role) => {
                  const hasRole = userRoles.includes(role)
                  return (
                    <button
                      key={role}
                      onClick={() => handleAddRole(role)}
                      disabled={hasRole || rolesLoading}
                      style={{
                        background: hasRole ? "#e0e0e0" : `${getRoleColor(role)}10`,
                        color: hasRole ? "#9e9e9e" : getRoleColor(role),
                        border: hasRole ? "2px solid #e0e0e0" : `2px solid ${getRoleColor(role)}30`,
                        padding: "10px 16px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: "600",
                        cursor: hasRole || rolesLoading ? "not-allowed" : "pointer",
                        textTransform: "capitalize",
                        transition: "all 0.2s ease",
                        opacity: hasRole ? 0.6 : 1,
                      }}
                      onMouseOver={(e) => {
                        if (!hasRole && !rolesLoading) {
                          e.target.style.background = `${getRoleColor(role)}20`
                          e.target.style.transform = "translateY(-1px)"
                        }
                      }}
                      onMouseOut={(e) => {
                        if (!hasRole) {
                          e.target.style.background = `${getRoleColor(role)}10`
                          e.target.style.transform = "translateY(0)"
                        }
                      }}
                    >
                      {hasRole ? `✓ ${role}` : `+ ${role}`}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Loading State */}
            {rolesLoading && (
              <div
                style={{
                  background: "#e3f2fd",
                  border: "1px solid #2196f3",
                  color: "#1976d2",
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <span style={{ fontSize: "1.2rem" }}>⏳</span>
                Actualizando roles...
              </div>
            )}

            {/* Información Adicional */}
            <div
              style={{
                background: "#fff3e0",
                border: "1px solid #ff9800",
                borderRadius: "8px",
                padding: "12px",
                marginBottom: "24px",
              }}
            >
              <div style={{ color: "#e65100", fontSize: "14px", lineHeight: "1.4" }}>
                <strong>💡 Información:</strong>
                <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
                  <li>Un usuario debe tener al menos un rol</li>
                  <li>Los roles determinan los permisos en el sistema</li>
                  <li>Los cambios se aplican inmediatamente</li>
                </ul>
              </div>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setShowRolesModal(false)
                  setSelectedUser(null)
                  setUserRoles([])
                }}
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
      )}

      {/* Modal Agregar Usuario */}
      {showAddModal && (
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
            zIndex: 1000,
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
            <h2 style={{ marginBottom: "24px", color: "#2c3e50" }}>Nuevo Usuario</h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>
                  Código Institucional *
                </label>
                <input
                  type="text"
                  value={formData.codigo_institucional}
                  onChange={(e) => handleFormChange("codigo_institucional", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: formErrors.codigo_institucional ? "2px solid #f44336" : "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Ej: 123456789"
                  required
                />
                {formErrors.codigo_institucional && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>
                    {formErrors.codigo_institucional}
                  </div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleFormChange("email", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: formErrors.email ? "2px solid #f44336" : "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                  placeholder="usuario@universidad.edu"
                  required
                />
                {formErrors.email && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>{formErrors.email}</div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Nombres *</label>
                <input
                  type="text"
                  value={formData.nombres}
                  onChange={(e) => handleFormChange("nombres", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: formErrors.nombres ? "2px solid #f44336" : "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Nombres del usuario"
                  required
                />
                {formErrors.nombres && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>{formErrors.nombres}</div>
                )}
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "8px", fontWeight: "600" }}>Apellidos *</label>
                <input
                  type="text"
                  value={formData.apellidos}
                  onChange={(e) => handleFormChange("apellidos", e.target.value)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    border: formErrors.apellidos ? "2px solid #f44336" : "2px solid #e9ecef",
                    borderRadius: "8px",
                    fontSize: "16px",
                    boxSizing: "border-box",
                  }}
                  placeholder="Apellidos del usuario"
                  required
                />
                {formErrors.apellidos && (
                  <div style={{ color: "#f44336", fontSize: "14px", marginTop: "4px" }}>{formErrors.apellidos}</div>
                )}
              </div>

              {/* INFORMACIÓN SOBRE LA CONTRASEÑA */}
              <div
                style={{
                  background: "#e3f2fd",
                  border: "1px solid #2196f3",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "24px",
                }}
              >
                <div style={{ color: "#1976d2", fontSize: "14px", lineHeight: "1.4" }}>
                  <strong>🔐 Información sobre acceso:</strong>
                  <p style={{ margin: "8px 0 0 0" }}>
                    Después de crear el usuario, las credenciales de acceso se configurarán por separado.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setFormData({
                      codigo_institucional: "",
                      email: "",
                      nombres: "",
                      apellidos: "",
                    })
                    setFormErrors({})
                  }}
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
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: "12px 24px",
                    border: "none",
                    borderRadius: "8px",
                    background: submitting ? "#ccc" : "linear-gradient(135deg, #4CAF50, #2E7D32)",
                    color: "white",
                    cursor: submitting ? "not-allowed" : "pointer",
                    fontSize: "16px",
                    fontWeight: "600",
                  }}
                >
                  {submitting ? "Creando..." : "Crear Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUsuarios
