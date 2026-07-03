import client from './client'

export const login = (credentials) => client.post('/auth/login/', credentials)
export const logout = (refresh) => client.post('/auth/logout/', { refresh })
export const getMe = () => client.get('/auth/me/')
export const updateMe = (data) => client.patch('/auth/me/', data)
export const changePassword = (data) => client.post('/auth/change-password/', data)
export const getUsers = (params) => client.get('/auth/users/', { params })
export const createUser = (data) => client.post('/auth/users/', data)
export const updateUser = (id, data) => client.patch(`/auth/users/${id}/`, data)
export const deleteUser = (id) => client.delete(`/auth/users/${id}/`)
