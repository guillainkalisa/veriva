import client from './client'

export const getDirectorates = () => client.get('/campus/directorates/')
