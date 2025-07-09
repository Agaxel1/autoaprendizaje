// src/services/funcionService.js
const API_BASE = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

// Función helper para headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error('No hay token de autenticación');

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'x-api-key': API_KEY,
  };
};

// Función helper para manejar respuestas
const handleResponse = async (response) => {
  if (!response.ok) {
    if (response.status === 401) throw new Error('Token expirado o inválido');
    if (response.status === 403) throw new Error('No tienes permisos para esta acción');
    if (response.status === 404) throw new Error('Recurso no encontrado');
    throw new Error(`Error en la petición. ${response.status}`);
  }
  return await response.json();
};

export const funcionService = {
  // === FUNCIONES EXISTENTES ===

  // Admin: Obtener todos los cursos
  async fetchCourses({ page = 1, limit = 20, search = '' }) {
    const params = new URLSearchParams({ page, limit, search });
    const response = await fetch(`${API_BASE}/api/courses?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Estudiante: Obtener cursos inscritos
  async fetchStudentCourses({ page = 1, limit = 20, search = '' }) {
    const params = new URLSearchParams({ page, limit, search });
    const response = await fetch(`${API_BASE}/api/courses/student?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Docente: Obtener cursos asignados
  async fetchTeacherCourses({ page = 1, limit = 20, search = '' }) {
    const params = new URLSearchParams({ page, limit, search });
    const response = await fetch(`${API_BASE}/api/courses/teacher?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener curso específico
  async getCourse(id) {
    const response = await fetch(`${API_BASE}/api/courses/${id}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Crear curso
  async createCourse(courseData) {
    const response = await fetch(`${API_BASE}/api/courses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(courseData)
    });
    return await handleResponse(response);
  },

  // Actualizar curso
  async updateCourse(id, courseData) {
    const response = await fetch(`${API_BASE}/api/courses/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(courseData)
    });
    return await handleResponse(response);
  },

  // Eliminar curso
  async deleteCourse(id) {
    const response = await fetch(`${API_BASE}/api/courses/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token expirado o inválido');
      if (response.status === 403) throw new Error('No tienes permisos para esta acción');
      if (response.status === 404) throw new Error('Curso no encontrado');
      throw new Error(`Error al eliminar curso: ${response.status}`);
    }

    return { success: true };
  },

  // Obtener estudiantes de un curso
  async getCourseStudents(courseId, { page = 1, limit = 20 }) {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${API_BASE}/api/courses/${courseId}/students?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Asignar docente a curso
  async assignTeacherToCourse(courseId, teacherData) {
    const response = await fetch(`${API_BASE}/api/courses/${courseId}/assign-teacher`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(teacherData)
    });
    return await handleResponse(response);
  },

  // Obtener niveles de un curso
  async getCourseLevels(courseId) {
    const response = await fetch(`${API_BASE}/api/courses/${courseId}/levels`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === FUNCIONES PARA ADMIN DASHBOARD ===

  // Obtener estadísticas generales del dashboard
  async fetchDashboardStats() {
    const response = await fetch(`${API_BASE}/api/admin/dashboard/stats`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener todos los usuarios
  async fetchUsers({ page = 1, limit = 20, search = '', role = '', status = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(role && { role }),
      ...(status && { status })
    });
    const response = await fetch(`${API_BASE}/api/admin/users?${params.toString()}`, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  },

  // Obtener estadísticas de usuarios
  async fetchUserStats() {
    const response = await fetch(`${API_BASE}/api/admin/users/stats`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener todos los estudiantes
  async fetchStudents({ page = 1, limit = 20, search = '', course = '', includeEnrollments = true }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(course && { course }),
      ...(includeEnrollments && { include_enrollments: 'true' })
    });
    const response = await fetch(`${API_BASE}/api/admin/students?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener estadísticas de cursos
  async fetchCourseStats() {
    const response = await fetch(`${API_BASE}/api/admin/courses/stats`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener actividad reciente del sistema
  async fetchRecentActivity({ page = 1, limit = 10, type = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(type && { type })
    });
    const response = await fetch(`${API_BASE}/api/admin/activity?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener registros recientes
  async fetchRecentRegistrations({ days = 7, limit = 50 }) {
    const params = new URLSearchParams({ days, limit });
    const response = await fetch(`${API_BASE}/api/admin/registrations/recent?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === GESTIÓN DE USUARIOS ===

  // Crear usuario
  async createUser(userData) {
    const response = await fetch(`${API_BASE}/api/admin/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return await handleResponse(response);
  },

  // Actualizar usuario
  async updateUser(id, userData) {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return await handleResponse(response);
  },

  // Eliminar usuario
  async deleteUser(id) {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Cambiar rol de usuario
  async changeUserRole(userId, roleData) {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(roleData)
    });
    return await handleResponse(response);
  },

  // Activar/Desactivar usuario
  async toggleUserStatus(userId, status) {
    const response = await fetch(`${API_BASE}/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ active: status })
    });
    return await handleResponse(response);
  },

  // Obtener usuario específico
  async getUser(id) {
    const response = await fetch(`${API_BASE}/api/admin/users/${id}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === REPORTES Y ANÁLISIS ===

  // Obtener reportes del sistema
  async fetchSystemReports({ page = 1, limit = 20, type = '', dateFrom = '', dateTo = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(type && { type }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    });
    const response = await fetch(`${API_BASE}/api/admin/reports?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Generar reporte específico
  async generateReport(reportType, params = {}) {
    const response = await fetch(`${API_BASE}/api/admin/reports/generate`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        type: reportType,
        parameters: params
      })
    });
    return await handleResponse(response);
  },

  // Descargar reporte
  async downloadReport(reportId) {
    const response = await fetch(`${API_BASE}/api/admin/reports/${reportId}/download`, {
      headers: getHeaders()
    });

    if (!response.ok) {
      throw new Error(`Error descargando reporte: ${response.status}`);
    }

    return response.blob();
  },

  // === CONFIGURACIÓN DEL SISTEMA ===

  // Obtener configuración del sistema
  async getSystemConfig() {
    const response = await fetch(`${API_BASE}/api/admin/config`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Actualizar configuración del sistema
  async updateSystemConfig(configData) {
    const response = await fetch(`${API_BASE}/api/admin/config`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(configData)
    });
    return await handleResponse(response);
  },

  // === BACKUP Y MANTENIMIENTO ===

  // Crear backup del sistema
  async createBackup() {
    const response = await fetch(`${API_BASE}/api/admin/backup`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener lista de backups
  async getBackups() {
    const response = await fetch(`${API_BASE}/api/admin/backup`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Restaurar backup
  async restoreBackup(backupId) {
    const response = await fetch(`${API_BASE}/api/admin/backup/${backupId}/restore`, {
      method: 'POST',
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === LOGS Y AUDITORÍA ===

  // Obtener logs del sistema
  async getSystemLogs({ page = 1, limit = 50, level = '', dateFrom = '', dateTo = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(level && { level }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    });
    const response = await fetch(`${API_BASE}/api/admin/logs?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener logs de auditoría
  async getAuditLogs({ page = 1, limit = 50, action = '', userId = '', dateFrom = '', dateTo = '' }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(action && { action }),
      ...(userId && { userId }),
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo })
    });
    const response = await fetch(`${API_BASE}/api/admin/audit?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === NOTIFICACIONES ===

  // Enviar notificación a usuarios
  async sendNotification(notificationData) {
    const response = await fetch(`${API_BASE}/api/admin/notifications`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(notificationData)
    });
    return await handleResponse(response);
  },

  // Obtener notificaciones enviadas
  async getSentNotifications({ page = 1, limit = 20 }) {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${API_BASE}/api/admin/notifications?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === ESTADÍSTICAS AVANZADAS ===

  // Obtener estadísticas de uso
  async getUsageStats({ period = '30d', type = 'all' }) {
    const params = new URLSearchParams({ period, type });
    const response = await fetch(`${API_BASE}/api/admin/stats/usage?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener estadísticas de performance
  async getPerformanceStats({ period = '24h' }) {
    const params = new URLSearchParams({ period });
    const response = await fetch(`${API_BASE}/api/admin/stats/performance?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener métricas en tiempo real
  async getRealTimeMetrics() {
    const response = await fetch(`${API_BASE}/api/admin/metrics/realtime`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  async addUserRole(userId, role) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/roles`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ role })
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Error adding user role:', error);
      throw error;
    }
  },

  // Remover rol de usuario
  async removeUserRole(userId, role) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/roles/${role}`, {
        method: 'DELETE',
        headers: getHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Error removing user role:', error);
      throw error;
    }
  },

  // Obtener roles de un usuario
  async getUserRoles(userId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/users/${userId}/roles`, {
        headers: getHeaders()
      });

      return await handleResponse(response);
    } catch (error) {
      console.error('❌ Error getting user roles:', error);
      throw error;
    }
  },

  // === GESTIÓN DE DOCENTES ===

  // Actualizar asignación de docente a curso
  async updateTeacherAssignment(assignmentId, assignmentData) {
    const response = await fetch(`${API_BASE}/api/admin/teacher-assignments/${assignmentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(assignmentData)
    });
    return await handleResponse(response);
  },

  // Remover docente de curso
  async removeTeacherFromCourse(assignmentId) {
    const response = await fetch(`${API_BASE}/api/admin/teacher-assignments/${assignmentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token expirado o inválido');
      if (response.status === 403) throw new Error('No tienes permisos para esta acción');
      if (response.status === 404) throw new Error('Asignación no encontrada');
      throw new Error(`Error al remover asignación: ${response.status}`);
    }

    return { success: true };
  },

  // Obtener cursos de un docente específico
  async getTeacherCourses(teacherId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${API_BASE}/api/admin/teachers/${teacherId}/courses?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // Obtener todos los docentes con asignaciones
  async fetchTeachers({ page = 1, limit = 20, search = '', department = '', includeAssignments = true }) {
    const params = new URLSearchParams({
      page,
      limit,
      ...(search && { search }),
      ...(department && { department }),
      ...(includeAssignments && { include_assignments: 'true' })
    });
    const response = await fetch(`${API_BASE}/api/admin/teachers?${params.toString()}`, {
      headers: getHeaders()
    });

    return await handleResponse(response);
  },

  // === NUEVAS FUNCIONES PARA GESTIÓN DE ESTUDIANTES ===

  // Inscribir estudiante a curso
  async enrollStudentToCourse(courseId, studentData) {
    const response = await fetch(`${API_BASE}/api/courses/${courseId}/enroll-student`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(studentData)
    });
    return await handleResponse(response);
  },

  // Actualizar inscripción de estudiante
  async updateStudentEnrollment(enrollmentId, enrollmentData) {
    const response = await fetch(`${API_BASE}/api/admin/student-enrollments/${enrollmentId}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(enrollmentData)
    });
    return await handleResponse(response);
  },

  // Remover estudiante de curso
  async removeStudentFromCourse(enrollmentId) {
    const response = await fetch(`${API_BASE}/api/admin/student-enrollments/${enrollmentId}`, {
      method: 'DELETE',
      headers: getHeaders()
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error('Token expirado o inválido');
      if (response.status === 403) throw new Error('No tienes permisos para esta acción');
      if (response.status === 404) throw new Error('Inscripción no encontrada');
      throw new Error(`Error al remover inscripción: ${response.status}`);
    }

    return { success: true };
  },

  // Obtener cursos de un estudiante específico
  async getStudentCourses(studentId, { page = 1, limit = 20 } = {}) {
    const params = new URLSearchParams({ page, limit });
    const response = await fetch(`${API_BASE}/api/admin/students/${studentId}/courses?${params.toString()}`, {
      headers: getHeaders()
    });
    return await handleResponse(response);
  },

  // === NUEVAS FUNCIONES PARA GESTIÓN DE HORARIOS DE EXAMEN ===

  // Obtener horarios de examen con paginación
  async fetchExamSchedules(params = {}) {
    try {
      const queryParams = new URLSearchParams()

      // Agregar parámetros de paginación
      queryParams.append('page', params.page || 1)
      queryParams.append('limit', params.limit || 10)

      // Agregar filtros si existen
      if (params.search) queryParams.append('search', params.search)
      if (params.fecha) queryParams.append('fecha', params.fecha)
      if (params.status) queryParams.append('status', params.status)

      const response = await fetch(`${API_BASE}/api/admin/exam-schedules?${queryParams}`, {
        method: 'GET',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en fetchExamSchedules:', error)
      throw error
    }
  },

  // Obtener estadísticas de horarios de examen
  async fetchExamStats() {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/stats`, {
        method: 'GET',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en fetchExamStats:', error)
      throw error
    }
  },

  // Crear nuevo horario de examen
  async createExamSchedule(scheduleData) {
    console.log(scheduleData)
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(scheduleData)
      })

      console.log(response)

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en createExamSchedule:', error)
      throw error
    }
  },

  // Actualizar horario de examen
  async updateExamSchedule(scheduleId, updateData) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(updateData)
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en updateExamSchedule:', error)
      throw error
    }
  },

  // Eliminar horario de examen
  async deleteExamSchedule(scheduleId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en deleteExamSchedule:', error)
      throw error
    }
  },

  // === FUNCIONES PARA GESTIÓN DE ESTUDIANTES EN EXÁMENES ===

  // Obtener estudiantes agendados para un horario específico
  async fetchExamStudents(scheduleId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}/students`, {
        method: 'GET',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en fetchExamStudents:', error)
      throw error
    }
  },

  // Obtener estudiantes disponibles para agendar en un horario
  async fetchAvailableStudents(scheduleId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}/available-students`, {
        method: 'GET',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en fetchAvailableStudents:', error)
      throw error
    }
  },

  // Agregar estudiante a un horario de examen
  async addStudentToExam(scheduleId, studentId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}/students`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({ estudiante_id: studentId })
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en addStudentToExam:', error)
      throw error
    }
  },

  // Remover estudiante de un horario de examen
  async removeStudentFromExam(scheduleId, studentId) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}/students/${studentId}`, {
        method: 'DELETE',
        headers: getHeaders()
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en removeStudentFromExam:', error)
      throw error
    }
  },

  // Actualizar estado de agendamiento de un estudiante
  async updateStudentExamStatus(scheduleId, studentId, newStatus) {
    try {
      const response = await fetch(`${API_BASE}/api/admin/exam-schedules/${scheduleId}/students/${studentId}/status`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify({ estado: newStatus })
      })

      return await handleResponse(response);
    } catch (error) {
      console.error('Error en updateStudentExamStatus:', error)
      throw error
    }
  }

};