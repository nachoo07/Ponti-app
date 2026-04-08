import axios from 'axios'
import { config } from '../config'

export const managerApi = axios.create({
  baseURL: config.baseManagerApi,
  timeout: 15000,
})

export const identityApi = axios.create({
  baseURL: 'https://identitytoolkit.googleapis.com/v1',
  timeout: 15000,
})

export const secureTokenApi = axios.create({
  baseURL: 'https://securetoken.googleapis.com/v1',
  timeout: 15000,
})
