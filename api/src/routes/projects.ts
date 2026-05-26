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

  const page = Number(req.query.page ?? 1)
  const perPage = Number(req.query.per_page ?? 100)
  const customerId =
    typeof req.query.customer_id === 'string' ? Number(req.query.customer_id) : undefined
  const campaignId =
    typeof req.query.campaign_id === 'string' ? Number(req.query.campaign_id) : undefined
  const name = typeof req.query.name === 'string' ? req.query.name : undefined

  try {
    const response = await managerApi.get('/projects', {
      params: {
        page,
        per_page: perPage,
        ...(customerId ? { customer_id: customerId } : {}),
        ...(campaignId ? { campaign_id: campaignId } : {}),
        ...(name ? { name } : {}),
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener los proyectos',
      },
    )
  }
})

router.get('/:id', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get(`/projects/${req.params.id}`, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener el detalle del proyecto',
      },
    )
  }
})

router.get('/:id/labors', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get(`/projects/${req.params.id}/labors`, {
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
