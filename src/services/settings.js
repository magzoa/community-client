import http from './http'

// Configuración del sitio / banner del home
export default {
  // Público: textos + members_count + redes activas (una sola petición)
  getPublic() {
    return http.get('/public/site-settings')
  },

  // Admin: actualizar textos del banner
  update(payload) {
    return http.put('/admin/site-settings', payload)
  },

  // ── Redes del banner (admin) ───────────────────────────────
  listLinks() {
    return http.get('/admin/banner-social-links')
  },
  createLink(payload) {
    return http.post('/admin/banner-social-links', payload)
  },
  updateLink(id, payload) {
    return http.put(`/admin/banner-social-links/${id}`, payload)
  },
  deleteLink(id) {
    return http.delete(`/admin/banner-social-links/${id}`)
  },
  uploadLinkImage(id, file) {
    const formData = new FormData()
    formData.append('image', file)
    return http.post(`/admin/banner-social-links/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  deleteLinkImage(id) {
    return http.delete(`/admin/banner-social-links/${id}/image`)
  },
}
