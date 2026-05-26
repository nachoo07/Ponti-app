import { Router } from 'express'
import { managerApi } from '../services/http.js'
import { getManagerHeaders } from './managerHeaders.js'

const router = Router()

router.get('/:projectId', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  const projectId = Number(req.params.projectId)
  const cutoffDate =
    typeof req.query.cutoff_date === 'string' ? req.query.cutoff_date : ''

  if (!Number.isFinite(projectId) || projectId <= 0) {
    res.status(400).json({ message: 'projectId inválido' })
    return
  }

  try {
    const response = await managerApi.get(`/projects/${projectId}/stocks/summary`, {
      params: {
        cutoff_date: cutoffDate,
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener el stock del proyecto',
      },
    )
  }
})

export default router
