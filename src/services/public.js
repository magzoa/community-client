import http from './http'

// Servicios públicos del home (funcionan con o sin sesión).
// Si hay token, el interceptor lo envía y el backend puede exponer más datos.
export default {
  // Miembros aprobados, filtrable por rol de comunidad y paginado
  listMembers(params = {}) {
    return http.get('/public/members', { params })
  },

  // Roles de comunidad activos (para los chips de filtro)
  listCommunityRoles() {
    return http.get('/public/community-roles')
  },
}
