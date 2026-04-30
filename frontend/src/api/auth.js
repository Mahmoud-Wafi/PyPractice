import api from './client'
export const register = d => api.post('/auth/register/', d)
export const login = d => api.post('/auth/login/', d)
export const logout = r => api.post('/auth/logout/', { refresh: r })
export const getMe = () => api.get('/auth/me/')
export const getLeaderboard = () => api.get('/auth/leaderboard/')
