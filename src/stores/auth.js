import { defineStore } from 'pinia'
import http from '../services/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    // Se hidrata desde localStorage al arrancar la app
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    roles: JSON.parse(localStorage.getItem('roles') || '[]'),
  }),

  getters: {
    // Hay sesión activa si existe token
    isAuthenticated: (state) => !!state.token,

    // El usuario tiene rol admin
    isAdmin: (state) => state.roles.includes('admin'),

    // Nombre para mostrar en el menú
    displayName: (state) => state.user?.name || '',

    // Inicial para el avatar discreto
    avatarInitial: (state) => {
      const name = state.user?.name || ''
      return name.charAt(0).toUpperCase() || 'U'
    },
  },

  actions: {
    // Persiste token + user + roles en el estado y en localStorage
    setSession(token, user, roles = []) {
      this.token = token
      this.user = user
      this.roles = roles
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('roles', JSON.stringify(roles))
    },

    // Registro de un nuevo miembro (token inmediato)
    async register(payload) {
      const { data } = await http.post('/register', payload)
      this.setSession(data.token, data.user, data.roles || [])
      return data
    },

    // Login con email/contraseña
    async login(credentials) {
      const { data } = await http.post('/login', credentials)
      this.setSession(data.token, data.user, data.roles || [])
      return data
    },

    // Cierra sesión: intenta invalidar el token en el servidor y limpia local
    async logout() {
      try {
        await http.post('/logout')
      } catch {
        // Si falla (token ya inválido), se limpia igual la sesión local
      } finally {
        this.token = null
        this.user = null
        this.roles = []
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('roles')
      }
    },
  },
})
