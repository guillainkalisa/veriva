import client from './client'

export const getDirectorates = () => client.get('/campus/directorates/')

export const getGates = (params) => client.get('/campus/gates/', { params })
export const createGate = (data) => client.post('/campus/gates/', data)
export const updateGate = (id, data) => client.patch(`/campus/gates/${id}/`, data)
export const deleteGate = (id) => client.delete(`/campus/gates/${id}/`)
