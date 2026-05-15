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

router.get('/digital/groups', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  const number = typeof req.query.number === 'string' ? req.query.number : ''
  const page = typeof req.query.page === 'string' ? req.query.page : ''
  const perPage =
    typeof req.query.per_page === 'string'
      ? req.query.per_page
      : typeof req.query.page_size === 'string'
        ? req.query.page_size
        : ''

  try {
    const response = await managerApi.get('/work-order-drafts/digital/groups', {
      params: {
        ...(number ? { number } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { per_page: perPage } : {}),
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener las ordenes digitales agrupadas',
      },
    )
  }
})

router.get('/digital', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  const number = typeof req.query.number === 'string' ? req.query.number : ''
  const page = typeof req.query.page === 'string' ? req.query.page : ''
  const perPage =
    typeof req.query.per_page === 'string'
      ? req.query.per_page
      : typeof req.query.page_size === 'string'
        ? req.query.page_size
        : ''

  try {
    const response = await managerApi.get('/work-order-drafts/digital', {
      params: {
        ...(number ? { number } : {}),
        ...(page ? { page } : {}),
        ...(perPage ? { per_page: perPage } : {}),
      },
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudieron obtener las ordenes digitales',
      },
    )
  }
})

router.post('/digital/preview-number', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post('/work-order-drafts/digital/preview-number', req.body, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener el numero sugerido',
      },
    )
  }
})

router.post('/digital/batch/preview-number', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post(
      '/work-order-drafts/digital/batch/preview-number',
      req.body,
      {
        headers,
      },
    )

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener el numero base sugerido',
      },
    )
  }
})

router.post('/digital/batch', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post('/work-order-drafts/digital/batch', req.body, {
      headers,
    })

    res.status(201).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo crear el lote de ordenes digitales',
      },
    )
  }
})

router.post('/digital', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post('/work-order-drafts/digital', req.body, {
      headers,
    })

    res.status(201).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo crear la orden digital',
      },
    )
  }
})

router.get('/:id/pdf', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get(`/work-order-drafts/${req.params.id}/pdf`, {
      headers,
      responseType: 'arraybuffer',
    })

    const contentType = response.headers['content-type'] ?? 'application/pdf'
    const contentDisposition = response.headers['content-disposition']

    res.setHeader('Content-Type', contentType)

    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition)
    }

    res.status(200).send(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo descargar el PDF del borrador',
      },
    )
  }
})

router.get('/:id/group-pdf', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get(`/work-order-drafts/${req.params.id}/group-pdf`, {
      headers,
      responseType: 'arraybuffer',
    })

    const contentType = response.headers['content-type'] ?? 'application/pdf'
    const contentDisposition = response.headers['content-disposition']

    res.setHeader('Content-Type', contentType)

    if (contentDisposition) {
      res.setHeader('Content-Disposition', contentDisposition)
    }

    res.status(200).send(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo descargar el PDF grupal del borrador',
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
    const response = await managerApi.get(`/work-order-drafts/${req.params.id}`, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener la orden',
      },
    )
  }
})

router.get('/:id/group', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.get(`/work-order-drafts/${req.params.id}/group`, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo obtener la orden agrupada',
      },
    )
  }
})

router.put('/:id/group', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.put(`/work-order-drafts/${req.params.id}/group`, req.body, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo actualizar la orden agrupada',
      },
    )
  }
})

router.put('/:id', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    await managerApi.put(`/work-order-drafts/${req.params.id}`, req.body, {
      headers,
    })

    res.status(204).send()
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo actualizar la orden',
      },
    )
  }
})

router.post('/:id/publish', async (req, res) => {
  const headers = getManagerHeaders(req)

  if (!headers) {
    res.status(401).json({ message: 'Usuario no autenticado' })
    return
  }

  try {
    const response = await managerApi.post(`/work-order-drafts/${req.params.id}/publish`, {}, {
      headers,
    })

    res.status(200).json(response.data)
  } catch (error: any) {
    res.status(error?.response?.status ?? 500).json(
      error?.response?.data ?? {
        message: 'No se pudo publicar la orden',
      },
    )
  }
})

export default router
