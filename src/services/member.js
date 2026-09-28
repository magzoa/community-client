import http from './http'

// Servicios del perfil propio del miembro autenticado
export default {
  // Obtiene el perfil propio (con redes)
  getProfile() {
    return http.get('/member/profile')
  },

  // Actualiza los datos del perfil propio
  updateProfile(payload) {
    return http.put('/member/profile', payload)
  },

  // Agrega una red social
  addLink(payload) {
    return http.post('/member/social-links', payload)
  },

  // Actualiza una red social propia
  updateLink(id, payload) {
    return http.put(`/member/social-links/${id}`, payload)
  },

  // Elimina una red social propia
  deleteLink(id) {
    return http.delete(`/member/social-links/${id}`)
  },

  // Sube/reemplaza la foto de perfil (multipart)
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('avatar', file)
    return http.post('/member/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Elimina la foto de perfil
  deleteAvatar() {
    return http.delete('/member/avatar')
  },
}
