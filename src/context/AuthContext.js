import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showExpiryWarning, setShowExpiryWarning] = useState(false);

  // 🆕 NUEVO: Estado para manejo de roles
  const [currentRole, setCurrentRole] = useState(null);

  // Referencias para manejar timeouts
  const warningTimeoutRef = useRef(null);
  const expirationTimeoutRef = useRef(null);
  const isRenewingRef = useRef(false);

  // Obtener duración del token desde localStorage o usar default
  const getStoredTokenDuration = () => {
    const stored = localStorage.getItem('tokenDuration');
    return stored ? parseInt(stored, 10) : 15 * 1000;
  };

  const [tokenDuration, setTokenDuration] = useState(getStoredTokenDuration());

  const logout = useCallback(() => {
    clearTokenTimers();
    clearStoredTokenData();
    setUser(null);
    setIsAuthenticated(false);
    setShowExpiryWarning(false);
    // 🆕 NUEVO: Limpiar rol actual al hacer logout
    setCurrentRole(null);
    localStorage.removeItem('currentRole');
    isRenewingRef.current = false;
  }, []);

  const handleSessionExpiry = useCallback(() => {
    setShowExpiryWarning(false);
    logout();
  }, [logout]);

  // Warning time dinámico - configurable
  const getWarningTime = useCallback(() => {
    return Math.min(tokenDuration * 0.4, 60 * 1000);
  }, [tokenDuration]);

  // Función para calcular tiempo restante del token
  const getTokenRemainingTime = () => {
    const tokenExpiry = localStorage.getItem('tokenExpiry');
    if (!tokenExpiry) return 0;

    const now = Date.now();
    const expiryTime = parseInt(tokenExpiry, 10);
    return Math.max(0, expiryTime - now);
  };

  // Iniciar timer del token con duración específica
  const startTokenTimerWithDuration = useCallback((duration) => {
    clearTokenTimers();

    const warningTime = getWarningTime();

    if (duration > warningTime) {
      warningTimeoutRef.current = setTimeout(() => {
        setShowExpiryWarning(true);
      }, duration - warningTime);
    } else {
      setShowExpiryWarning(true);
    }

    expirationTimeoutRef.current = setTimeout(() => {
      handleSessionExpiry();
    }, duration);
  }, [getWarningTime, handleSessionExpiry]);

  // Iniciar timer del token (usa duración del estado)
  const startTokenTimer = useCallback(() => {
    startTokenTimerWithDuration(tokenDuration);
  }, [startTokenTimerWithDuration, tokenDuration]);

  // 🆕 NUEVO: Funciones para manejo de roles

  // Función para cambiar de rol
  const switchRole = useCallback((roleId, roleName) => {

    try {
      if (!user?.roles) {
        console.error('❌ Usuario no tiene roles disponibles');
        return false;
      }

      // Verificar que el usuario tenga este rol - Lógica flexible
      const hasRole = user.roles.some(role => {

        // Diferentes formas de verificar el rol
        const roleNameToCheck = role.nombre || role.name || role;
        const roleIdToCheck = role.id || role;

        // Comparaciones case-insensitive y flexibles
        const nameMatch = roleNameToCheck &&
          roleNameToCheck.toString().toLowerCase() === roleName.toString().toLowerCase();
        const idMatch = roleIdToCheck &&
          roleIdToCheck.toString() === roleId.toString();

        return nameMatch || idMatch;
      });

      if (!hasRole) {
        console.error('❌ Usuario no tiene acceso a este rol:', roleName);
        return false;
      }

      // Actualizar el rol actual
      setCurrentRole(roleName);

      // Guardar en localStorage para persistencia
      localStorage.setItem('currentRole', roleName);

      return true;
    } catch (error) {
      console.error('❌ Error al cambiar rol:', error);
      return false;
    }
  }, [user]);

  // Función para obtener el rol actual
  const getCurrentRole = useCallback(() => {
    if (currentRole) {
      return currentRole;
    }

    if (!user?.roles || user.roles.length === 0) {
      return null;
    }

    // Intentar obtener del localStorage
    const savedRole = localStorage.getItem('currentRole');
    if (savedRole && user.roles.some(role => {
      const roleName = role.nombre || role.name || role;
      return roleName === savedRole;
    })) {
      setCurrentRole(savedRole);
      return savedRole;
    }

    // Si no hay rol guardado, usar el primer rol disponible
    const firstRole = user.roles[0].nombre || user.roles[0].name || user.roles[0];
    setCurrentRole(firstRole);
    localStorage.setItem('currentRole', firstRole);
    return firstRole;
  }, [currentRole, user]);

  // Función para verificar si el usuario tiene un rol específico
  const hasRole = useCallback((targetRole) => {
    if (!user?.roles) return false;

    return user.roles.some(role => {
      const roleName = role.nombre || role.name || role;
      return roleName.toLowerCase() === targetRole.toLowerCase();
    });
  }, [user]);

  // Función para verificar permisos basados en el rol actual
  const hasPermission = useCallback((permission) => {
    const role = getCurrentRole();

    if (!role) return false;

    // Definir permisos por rol
    const rolePermissions = {
      'administrador': ['all'],
      'docente': ['manage_courses', 'view_students', 'grade_assignments', 'create_assignments'],
      'estudiante': ['view_courses', 'submit_assignments', 'view_grades', 'view_progress'],
    };

    const userPermissions = rolePermissions[role.toLowerCase()] || [];

    return userPermissions.includes('all') || userPermissions.includes(permission);
  }, [getCurrentRole]);


  // Verificar si hay un token guardado al iniciar la app
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Verificar si el token aún es válido
          const remainingTime = getTokenRemainingTime();

          if (remainingTime <= 0) {
            // Token expirado, intentar refresh
            throw new Error('Token expirado');
          }

          const userData = await authService.verifyToken();
          setUser(userData.usuario);
          setIsAuthenticated(true);

          // Iniciar timer con el tiempo restante real
          startTokenTimerWithDuration(remainingTime);
        } catch (error) {
          // Intentar refresh token
          try {
            const refreshResponse = await authService.refreshToken();

            // Si el refresh devuelve nueva duración, actualizarla
            if (refreshResponse && refreshResponse.tokenDurationMs) {
              updateTokenDuration(refreshResponse.tokenDurationMs);
            }

            const userData = await authService.verifyToken();
            setUser(userData);
            setIsAuthenticated(true);
            startTokenTimer();
          } catch (refreshError) {
            // Limpiar todo si no se puede renovar
            clearStoredTokenData();
            setIsAuthenticated(false);
          }
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [startTokenTimer, startTokenTimerWithDuration]);

  // 🆕 NUEVO: Inicializar rol cuando el usuario cambia
  useEffect(() => {
    if (user && user.roles && user.roles.length > 0 && !currentRole) {
      getCurrentRole();
    }
  }, [user, currentRole, getCurrentRole]);

  // Actualizar duración del token y persistirla
  const updateTokenDuration = (newDuration) => {
    setTokenDuration(newDuration);
    localStorage.setItem('tokenDuration', newDuration.toString());

    // Calcular y guardar tiempo de expiración
    const expiryTime = Date.now() + newDuration;
    localStorage.setItem('tokenExpiry', expiryTime.toString());
  };

  // Limpiar datos del token almacenados
  const clearStoredTokenData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('tokenDuration');
    localStorage.removeItem('tokenExpiry');
    localStorage.removeItem('currentRole'); // 🆕 NUEVO: Limpiar rol
  };

  // Limpiar todos los timers
  const clearTokenTimers = () => {
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
      warningTimeoutRef.current = null;
    }
    if (expirationTimeoutRef.current) {
      clearTimeout(expirationTimeoutRef.current);
      expirationTimeoutRef.current = null;
    }
  };

  // Limpiar timers al desmontar
  useEffect(() => {
    return () => {
      clearTokenTimers();
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await authService.login(email, password);

      const { token, refreshToken, tokenDurationMs, usuario } = response;

      localStorage.setItem('token', token);
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken);
      }

      setUser(usuario);
      setIsAuthenticated(true);
      setShowExpiryWarning(false);

      // Actualizar duración del token dinámicamente ANTES de iniciar timer
      if (tokenDurationMs) {
        updateTokenDuration(tokenDurationMs);

        // Iniciar timer después de actualizar la duración
        setTimeout(() => {
          startTokenTimerWithDuration(tokenDurationMs);
        }, 0);
      } else {
        // Usar duración por defecto si no viene en la respuesta
        const defaultDuration = 15 * 1000;
        updateTokenDuration(defaultDuration);
        startTokenTimer();
      }

      return response;
    } catch (error) {
      throw error;
    }
  };

  // Manejar cuando el usuario elige continuar
  const handleContinueSession = async () => {
    if (isRenewingRef.current) return;

    try {
      isRenewingRef.current = true;
      setShowExpiryWarning(false);

      const refreshResponse = await authService.refreshToken();

      // Si el refresh devuelve nueva duración, actualizarla
      if (refreshResponse && refreshResponse.tokenDurationMs) {
        updateTokenDuration(refreshResponse.tokenDurationMs);
        startTokenTimerWithDuration(refreshResponse.tokenDurationMs);
      } else {
        // Usar la duración actual del token
        updateTokenDuration(tokenDuration);
        startTokenTimer();
      }

    } catch (error) {
      handleSessionExpiry();
    } finally {
      isRenewingRef.current = false;
    }
  };

  // 🆕 NUEVO: Agregar función de debugging global
  useEffect(() => {
    window.debugAuth = () => {
      console.log('=== AUTH DEBUG ===');
      console.log('user:', user);
      console.log('currentRole:', currentRole);
      console.log('isAuthenticated:', isAuthenticated);
    };

    return () => {
      delete window.debugAuth;
    };
  }, [user, currentRole, isAuthenticated]);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    showExpiryWarning,
    handleContinueSession,
    handleSessionExpiry,
    getWarningTime,
    tokenDuration,
    getTokenRemainingTime,
    // 🆕 NUEVO: Funciones de roles
    currentRole: getCurrentRole(),
    switchRole,
    hasPermission,
    hasRole,
    getCurrentRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};