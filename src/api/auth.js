import http from './request'

export function generateActivityToken(id) {
  const params = id ? { id } : {}
  return http.post('/open/generateTokenByUserId', {}, { params })
}
