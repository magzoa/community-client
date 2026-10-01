import http from './http'

// Servicios de administración de miembros (requieren rol admin en el backend)
export default {
  // Lista miembros, filtrable por estado y paginado
  listMembers(params = {}) {
    return http.get('/admin/members', { params })
  },

  // Aprueba un miembro (suma rol member_active)
  approve(id) {
    return http.post(`/admin/members/${id}/approve`)
  },

  // Rechaza un miembro
  reject(id) {
    return http.post(`/admin/members/${id}/reject`)
  },

  // Lista los roles disponibles del sistema
  listRoles() {
    return http.get('/admin/roles')
  },

  // Sincroniza los roles de un miembro (lista final)
  updateRoles(id, roles) {
    return http.put(`/admin/members/${id}/roles`, { roles })
  },

  // Edita los catálogos del miembro (perfil profesional + roles de comunidad)
  updateCatalogs(id, payload) {
    return http.put(`/admin/members/${id}/catalogs`, payload)
  },

  // Trae un miembro completo (para precargar el modal de edición)
  getMember(id) {
    return http.get(`/admin/members/${id}`)
  },

  // Edición completa del miembro (datos + name/email; sin nickname)
  updateMember(id, payload) {
    return http.put(`/admin/members/${id}`, payload)
  },

  // Cambio de nickname (proceso sensible: mueve la carpeta de archivos)
  updateNickname(id, nickname) {
    return http.put(`/admin/members/${id}/nickname`, { nickname })
  },

  // Registra un nuevo miembro (alta por admin)
  createMember(payload) {
    return http.post('/admin/members', payload)
  },

  // Sube el avatar de un miembro (admin)
  uploadMemberAvatar(id, file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return http.post(`/admin/members/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Elimina definitivamente a un miembro y su usuario
  deleteMember(id) {
    return http.delete(`/admin/members/${id}`)
  },
}
