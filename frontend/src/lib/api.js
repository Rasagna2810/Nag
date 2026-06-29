import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Auto-redirect to login on 401
api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nba-auth')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

export default api

/**
 * Creates a WebSocket connection to the analysis streaming endpoint.
 * The first message sent must be { token: "<JWT>" }.
 *
 * @param {string} customerId
 * @param {string} token  JWT access token
 * @param {function} onEvent  called with each parsed event object
 * @returns WebSocket instance
 */
export function createAnalysisWS(customerId, token, onEvent) {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  const host     = window.location.hostname
  const wsUrl    = `${protocol}://${host}:8000/api/analysis/ws/${customerId}`
  const ws       = new WebSocket(wsUrl)

  ws.onopen = () => {
    ws.send(JSON.stringify({ token }))
  }

  ws.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data))
    } catch {
      // ignore malformed frames
    }
  }

  ws.onerror = () => onEvent({ type: 'error', message: 'WebSocket connection error' })
  ws.onclose = () => onEvent({ type: 'ws_closed' })

  return ws
}