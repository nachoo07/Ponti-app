import { Router } from 'express'
import { managerApi } from '../services/http.js'
import { getManagerHeaders } from './managerHeaders.js'

const router = Router()

router.get('', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  const customerId =
    typeof req.query.customer_id === 'string' ? Number(req.query.customer_id) : undefined
  const projectName =
    typeof req.query.project_name === 'string' ? req.query.project_name : undefined
  const page = Number(req.query.page ?? 1)
  const perPage = Number(req.query.per_page ?? 100)

  try {
    const response = await managerApi.get('/campaigns', {
      params: {
        page,
        per_page: perPage,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(projectName ? { project_name: projectName } : {}),
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener las campañas',
      },
    )
  }
})

export default router
