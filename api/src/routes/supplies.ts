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

  const projectId =
    typeof req.query.project_id === 'string' ? Number(req.query.project_id) : undefined
  const page = Number(req.query.page ?? 1)
  const perPage = Number(req.query.per_page ?? 100)

  if (!projectId) {
    res.status(400).json({ message: 'project_id es obligatorio' })
    return
  }

  try {
    const response = await managerApi.get('/supplies', {
      params: {
        project_id: projectId,
        page,
        per_page: perPage,
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener los insumos',
      },
    )
  }
})

router.post('/pending', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post('/supplies/pending', req.body, {
      headers,
    })

    res.status(201).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo crear el insumo pendiente',
      },
    )
  }
})

export default router
