import type { Request } from 'express'
import { Router } from 'express'
import { config } from '../config.js'
import { managerApi } from '../services/http.js'

const router = Router()

function getManagerHeaders(req: Request) {
  const authorization = req.header('Authorization')

  if (!authorization) {
    return null
  }

  return {
    Authorization: authorization,
    'X-API-KEY': config.xApiKey,
  }
}

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

router.post('/:id/labors', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post(`/projects/${req.params.id}/labors`, req.body, {
      headers,
    })

    res.status(response.status ?? 201).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo crear la labor',
      },
    )
  }
})

export default router
