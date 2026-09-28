import http from './http'

// Servicios de catálogos: roles de comunidad y perfiles profesionales.
// type: 'community-roles' | 'professional-profiles'
export default {
  // Listado para los selects del perfil (solo activos)
  listActive(type) {
    return http.get(`/catalogs/${type}`, { params: { only_active: 1 } })
  },

  // ── ABM admin ──────────────────────────────────────────────
  adminList(type) {
    return http.get(`/admin/catalogs/${type}`)
  },
  create(type, payload) {
    return http.post(`/admin/catalogs/${type}`, payload)
  },
  update(type, id, payload) {
    return http.put(`/admin/catalogs/${type}/${id}`, payload)
  },
  remove(type, id) {
    return http.delete(`/admin/catalogs/${type}/${id}`)
  },
}
