import http from './http'

// Servicios de autenticación públicos
export default {
  // Verifica disponibilidad de un nickname (aviso en vivo)
  checkNickname(nickname) {
    return http.get('/check-nickname', { params: { nickname } })
  },
}
