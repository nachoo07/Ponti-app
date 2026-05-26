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

  if (!projectId) {
    res.status(400).json({ message: 'project_id es obligatorio' })
    return
  }

  try {
    const response = await managerApi.get(`/projects/${projectId}/labors`, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener las labores',
      },
    )
  }
})

export default router
