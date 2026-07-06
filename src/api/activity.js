import http from './request'

export function getActivityState(params) {
  return http.get('/open/balance-activity/state', { params })
}

export function checkin(data) {
  return http.post('/open/balance-activity/checkin', data)
}

export function drawPrize(data) {
  return http.post('/open/balance-activity/draw', data)
}

export function claimPrize(data) {
  return http.post('/open/balance-activity/claim', data)
}
