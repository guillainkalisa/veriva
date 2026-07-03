import client from './client'

export const getDevices = (params) => client.get('/devices/', { params })
export const getDevice = (id) => client.get(`/devices/${id}/`)
export const createDevice = (data) => client.post('/devices/', data)
export const updateDevice = (id, data) => client.patch(`/devices/${id}/`, data)
export const deleteDevice = (id) => client.delete(`/devices/${id}/`)
export const regenerateQR = (id) => client.post(`/devices/${id}/regenerate-qr/`)
export const verifyDevice = (qr_data) => client.post('/devices/verify/', { qr_data })

export const getLoans = (params) => client.get('/devices/loans/', { params })
export const createLoan = (data) => client.post('/devices/loans/', data)
export const closeLoan = (id) => client.post(`/devices/loans/${id}/close/`)
