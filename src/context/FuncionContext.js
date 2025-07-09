// src/context/FuncionContext.jsx
import React, { createContext, useContext } from 'react';
import { funcionService } from '../services/FuncionService';

const FuncionContext = createContext();

export const FuncionProvider = ({ children }) => {
  // === FUNCIONES EXISTENTES ===

  // Admin: todos los cursos
  const fetchCourses = async (params) => {
    return await funcionService.fetchCourses(params);
  };

  // Estudiante: solo cursos inscritos
  const fetchStudentCourses = async (params) => {
    return await funcionService.fetchStudentCourses(params);
  };

  // Docente: solo cursos asignados
  const fetchTeacherCourses = async (params) => {
    return await funcionService.fetchTeacherCourses(params);
  };

  // Obtener curso específico
  const getCourse = async (id) => {
    return await funcionService.getCourse(id);
  };

  // Crear curso (admin/docente)
  const createCourse = async (courseData) => {
    return await funcionService.createCourse(courseData);
  };

  // Actualizar curso (admin/docente)
  const updateCourse = async (id, courseData) => {
    return await funcionService.updateCourse(id, courseData);
  };

  // Eliminar curso (admin)
  const deleteCourse = async (id) => {
    return await funcionService.deleteCourse(id);
  };

  // Obtener estudiantes de un curso
  const getCourseStudents = async (courseId, params) => {
    return await funcionService.getCourseStudents(courseId, params);
  };

  // Asignar docente a curso (admin)
  const assignTeacherToCourse = async (courseId, teacherData) => {
    return await funcionService.assignTeacherToCourse(courseId, teacherData);
  };

  // Obtener niveles de un curso
  const getCourseLevels = async (courseId) => {
    return await funcionService.getCourseLevels(courseId);
  };

  // === NUEVAS FUNCIONES PARA ADMIN DASHBOARD ===

  // Obtener estadísticas generales del dashboard
  const fetchDashboardStats = async () => {
    return await funcionService.fetchDashboardStats();
  };

  // Obtener todos los usuarios (admin)
  const fetchUsers = async (params) => {
    return await funcionService.fetchUsers(params);
  };

  // Obtener estadísticas de usuarios
  const fetchUserStats = async () => {
    return await funcionService.fetchUserStats();
  };

  // Obtener todos los estudiantes (admin)
  const fetchStudents = async (params) => {
    return await funcionService.fetchStudents(params);
  };

  // Obtener todos los docentes (admin)
  const fetchTeachers = async (params) => {
    return await funcionService.fetchTeachers(params);
  };

  // Obtener estadísticas de cursos
  const fetchCourseStats = async () => {
    return await funcionService.fetchCourseStats();
  };

  // Obtener actividad reciente del sistema
  const fetchRecentActivity = async (params) => {
    return await funcionService.fetchRecentActivity(params);
  };

  // Obtener registros recientes
  const fetchRecentRegistrations = async (params) => {
    return await funcionService.fetchRecentRegistrations(params);
  };

  // Crear usuario (admin)
  const createUser = async (userData) => {
    return await funcionService.createUser(userData);
  };

  // Actualizar usuario (admin)
  const updateUser = async (id, userData) => {
    return await funcionService.updateUser(id, userData);
  };

  // Eliminar usuario (admin)
  const deleteUser = async (id) => {
    return await funcionService.deleteUser(id);
  };

  // Cambiar rol de usuario (admin)
  const changeUserRole = async (userId, roleData) => {
    return await funcionService.changeUserRole(userId, roleData);
  };

  // Activar/Desactivar usuario (admin)
  const toggleUserStatus = async (userId, status) => {
    return await funcionService.toggleUserStatus(userId, status);
  };

  // Obtener reportes del sistema
  const fetchSystemReports = async (params) => {
    return await funcionService.fetchSystemReports(params);
  };

  // Generar reporte específico
  const generateReport = async (reportType, params) => {
    return await funcionService.generateReport(reportType, params);
  };

  const addUserRole = async (userId, role) => {
    return await funcionService.addUserRole(userId, role);
  };

  // Remover rol de usuario
  const removeUserRole = async (userId, role) => {
    return await funcionService.removeUserRole(userId, role);
  };

  // Obtener roles de un usuario específico
  const getUserRoles = async (userId) => {
    return await funcionService.getUserRoles(userId);
  };

  // === FUNCIONES PARA GESTIÓN DE DOCENTES ===

  // Actualizar asignación de docente
  const updateTeacherAssignment = async (assignmentId, assignmentData) => {
    return await funcionService.updateTeacherAssignment(assignmentId, assignmentData);
  };

  // Remover docente de curso
  const removeTeacherFromCourse = async (assignmentId) => {
    return await funcionService.removeTeacherFromCourse(assignmentId);
  };

  // Obtener cursos de un docente específico
  const getTeacherCourses = async (teacherId, params) => {
    return await funcionService.getTeacherCourses(teacherId, params);
  };

  // === NUEVAS FUNCIONES PARA GESTIÓN DE ESTUDIANTES ===

  // Inscribir estudiante a curso
  const enrollStudentToCourse = async (courseId, studentData) => {
    return await funcionService.enrollStudentToCourse(courseId, studentData);
  };

  // Actualizar inscripción de estudiante
  const updateStudentEnrollment = async (enrollmentId, enrollmentData) => {
    return await funcionService.updateStudentEnrollment(enrollmentId, enrollmentData);
  };

  // Remover estudiante de curso
  const removeStudentFromCourse = async (enrollmentId) => {
    return await funcionService.removeStudentFromCourse(enrollmentId);
  };

  // Obtener cursos de un estudiante específico
  const getStudentCourses = async (studentId, params) => {
    return await funcionService.getStudentCourses(studentId, params);
  };

  // === NUEVAS FUNCIONES PARA GESTIÓN DE HORARIOS DE EXAMEN ===

  // Obtener horarios de examen
  const fetchExamSchedules = async (params) => {
    return await funcionService.fetchExamSchedules(params);
  };

  // Obtener estadísticas de horarios de examen
  const fetchExamStats = async () => {
    return await funcionService.fetchExamStats();
  };

  // Crear nuevo horario de examen
  const createExamSchedule = async (scheduleData) => {
    return await funcionService.createExamSchedule(scheduleData);
  };

  // Actualizar horario de examen
  const updateExamSchedule = async (scheduleId, updateData) => {
    return await funcionService.updateExamSchedule(scheduleId, updateData);
  };

  // Eliminar horario de examen
  const deleteExamSchedule = async (scheduleId) => {
    return await funcionService.deleteExamSchedule(scheduleId);
  };

  // === FUNCIONES PARA GESTIÓN DE ESTUDIANTES EN EXÁMENES ===

  // Obtener estudiantes agendados para un horario específico
  const fetchExamStudents = async (scheduleId) => {
    return await funcionService.fetchExamStudents(scheduleId);
  };

  // Obtener estudiantes disponibles para agendar
  const fetchAvailableStudents = async (scheduleId) => {
    return await funcionService.fetchAvailableStudents(scheduleId);
  };

  // Agregar estudiante a un horario de examen
  const addStudentToExam = async (scheduleId, studentId) => {
    return await funcionService.addStudentToExam(scheduleId, studentId);
  };

  // Remover estudiante de un horario de examen
  const removeStudentFromExam = async (scheduleId, studentId) => {
    return await funcionService.removeStudentFromExam(scheduleId, studentId);
  };

  // Actualizar estado de agendamiento de un estudiante
  const updateStudentExamStatus = async (scheduleId, studentId, newStatus) => {
    return await funcionService.updateStudentExamStatus(scheduleId, studentId, newStatus);
  };

  return (
    <FuncionContext.Provider value={{
      // Funciones existentes
      fetchCourses,
      fetchStudentCourses,
      fetchTeacherCourses,
      getCourse,
      createCourse,
      updateCourse,
      deleteCourse,
      getCourseStudents,
      assignTeacherToCourse,
      getCourseLevels,

      // Nuevas funciones para admin
      fetchDashboardStats,
      fetchUsers,
      fetchUserStats,
      fetchStudents,
      fetchTeachers,
      fetchCourseStats,
      fetchRecentActivity,
      fetchRecentRegistrations,
      createUser,
      updateUser,
      deleteUser,
      changeUserRole,
      toggleUserStatus,
      fetchSystemReports,
      generateReport,
      addUserRole,
      removeUserRole,
      getUserRoles,

      // Funciones para docentes
      updateTeacherAssignment,
      removeTeacherFromCourse,
      getTeacherCourses,

      // Funciones para estudiantes
      enrollStudentToCourse,
      updateStudentEnrollment,
      removeStudentFromCourse,
      getStudentCourses,

      // Funciones para horarios de examen
      fetchExamSchedules,
      fetchExamStats,
      createExamSchedule,
      updateExamSchedule,
      deleteExamSchedule,

      // Funciones para estudiantes en exámenes
      fetchExamStudents,
      fetchAvailableStudents,
      addStudentToExam,
      removeStudentFromExam,
      updateStudentExamStatus,
    }}>
      {children}
    </FuncionContext.Provider>
  );
};

export const useFuncion = () => useContext(FuncionContext);