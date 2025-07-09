const API_BASE_URL = process.env.REACT_APP_API_URL;
const API_KEY = process.env.REACT_APP_API_KEY;

class AuthService {
  // Hacer login
  async login(email, password) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el login');
      }

      // Obtener el texto crudo primero
      const responseText = await response.text();

      // Parsear el JSON
      const data = JSON.parse(responseText);

      // Guardar refresh token si viene
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  }

  // Verificar token actual
  async verifyToken() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No hay token');
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
      });

      if (!response.ok) {
        const error = new Error('Token inválido');
        error.status = response.status;
        throw error;
      }

      const data = await response.json();
      return data;

    } catch (error) {
      console.error('Error verificando token:', error);
      throw error;
    }
  }

  // Renovar token usando refresh token
  async refreshToken() {
    const refreshToken = localStorage.getItem('refreshToken');

    if (!refreshToken) {
      const error = new Error('No hay refresh token disponible');
      error.status = 401;
      error.isAuthError = true;
      throw error;
    }

    try {

      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY,
        },
        body: JSON.stringify({ refreshToken })
      });


      if (!response.ok) {
        const error = new Error(`Error renovando token: ${response.status} ${response.statusText}`);
        error.status = response.status;

        if (response.status === 401) {
          error.isAuthError = true;
          localStorage.removeItem('refreshToken');
        }

        throw error;
      }

      const data = await response.json();

      // Actualizar access token
      localStorage.setItem('token', data.token);

      // Actualizar refresh token si viene uno nuevo
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data;
    } catch (error) {
      console.error('Error renovando token:', error);

      if (error.status === 401 || error.isAuthError) {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }

      throw error;
    }
  }

  // Hacer peticiones autenticadas
  async authenticatedRequest(url, options = {}) {
    const token = localStorage.getItem('token');

    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        ...options.headers,
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${url}`, config);

      if (response.status === 401) {
        try {
          await this.refreshToken();
          const newToken = localStorage.getItem('token');
          config.headers.Authorization = `Bearer ${newToken}`;
          return await fetch(`${API_BASE_URL}${url}`, config);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
          throw refreshError;
        }
      }

      return response;
    } catch (error) {
      console.error('Error en petición autenticada:', error);
      throw error;
    }
  }

  // Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
  }
}

const authService = new AuthService();
export default authService;