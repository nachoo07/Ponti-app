import assert from 'node:assert/strict'
import test from 'node:test'

import { buildLaborCatalogResponse } from '../dist/routes/laborCatalog.js'

test('buildLaborCatalogResponse preserves Core catalog envelope', () => {
  const response = buildLaborCatalogResponse({
    data: [
      {
        id: 86,
        name: 'Siembra',
        category_id: null,
        is_pending: true,
      },
    ],
    page_info: {
      per_page: 100,
      page: 1,
      max_page: 1,
      total: 1,
    },
  })

  assert.deepEqual(response, {
    data: [
      {
        id: 86,
        name: 'Siembra',
        category_id: null,
        is_pending: true,
      },
    ],
    page_info: {
      per_page: 100,
      page: 1,
      max_page: 1,
      total: 1,
    },
  })
})

test('buildLaborCatalogResponse normalizes the legacy direct array alias', () => {
  const response = buildLaborCatalogResponse([
    {
      id: 87,
      name: 'Pulverizacion',
    },
  ])

  assert.deepEqual(response, {
    data: [
      {
        id: 87,
        name: 'Pulverizacion',
      },
    ],
    page_info: {
      per_page: 1,
      page: 1,
      max_page: 1,
      total: 1,
    },
  })
})

test('buildLaborCatalogResponse supports nested data envelopes from proxy clients', () => {
  const response = buildLaborCatalogResponse({
    data: {
      data: [
        {
          id: 88,
          name: 'Cosecha',
        },
      ],
      page_info: {
        per_page: 50,
        page: 1,
        max_page: 1,
        total: 1,
      },
    },
  })

  assert.deepEqual(response, {
    data: [
      {
        id: 88,
        name: 'Cosecha',
      },
    ],
    page_info: {
      per_page: 50,
      page: 1,
      max_page: 1,
      total: 1,
    },
  })
})
