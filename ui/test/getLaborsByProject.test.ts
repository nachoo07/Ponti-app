import { beforeEach, expect, test, vi } from 'vitest'
import { getLaborsByProject } from '../src/entities/labor/api/getLaborsByProject'
import { apiJson } from '../src/shared/api/http'

vi.mock('../src/shared/api/http', () => ({
  apiJson: vi.fn(),
}))

const mockedApiJson = vi.mocked(apiJson)

beforeEach(() => {
  mockedApiJson.mockReset()
})

test('getLaborsByProject requests the project labor catalog', async () => {
  mockedApiJson.mockResolvedValueOnce({
    data: [
      {
        id: 86,
        name: 'Siembra',
        category_id: null,
        price: '0',
        is_partial_price: false,
        contractor_name: '',
        category_name: '',
        updated_at: '2026-06-08T00:00:00Z',
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

  const labors = await getLaborsByProject({ projectId: 30 })

  expect(mockedApiJson).toHaveBeenCalledWith('/projects/30/labors')
  expect(labors).toHaveLength(1)
  expect(labors[0]).toMatchObject({
    id: 86,
    name: 'Siembra',
    is_pending: true,
  })
})

test('getLaborsByProject returns an empty list for malformed envelopes', async () => {
  mockedApiJson.mockResolvedValueOnce({
    data: null,
    page_info: {
      per_page: 0,
      page: 1,
      max_page: 0,
      total: 0,
    },
  })

  await expect(getLaborsByProject({ projectId: 30 })).resolves.toEqual([])
})
