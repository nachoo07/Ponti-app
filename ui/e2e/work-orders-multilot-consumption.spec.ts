import { expect, test, type APIRequestContext } from '@playwright/test'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

const PROJECT_ID = 30
const FALLBACK_CUSTOMER_ID = 17
const EXPECTED_TOTAL_USED = 200
const LOT_AREA = '50'

type ProjectDetail = {
  id: number
  name?: string
  customer?: { id?: number }
  campaign?: { id?: number }
  investors?: Array<{ id: number; name: string }> | null
  fields?: Array<{
    id: number
    name: string
    lots?: Array<{
      id: number
      name: string
      current_crop_id?: number | null
    }> | null
  }> | null
}

type Labor = {
  id: number
  name: string
  contractor_name?: string
  is_pending?: boolean
}

type Supply = {
  id: number
  name: string
  is_pending?: boolean
}

type BatchCreateItem = {
  id: number
  number: string
  lot_id: number
}

type DraftDetail = {
  id: number
  number: string
  items?: Array<{
    supply_id: number
    total_used: string | number
    final_dose: string | number
  }>
}

function base64Url(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url')
}

function createE2EToken(): string {
  const exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60

  return [
    base64Url({ alg: 'none', typ: 'JWT' }),
    base64Url({
      sub: 'codex-e2e',
      email: 'codex-e2e@ponti.local',
      ID: 1,
      Rol: 1,
      Hash: 'e2e',
      exp,
    }),
    '',
  ].join('.')
}

function parseEnvFile(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {}

  return fs.readFileSync(filePath, 'utf8').split(/\r?\n/).reduce<Record<string, string>>(
    (env, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) return env

      const separatorIndex = trimmed.indexOf('=')
      if (separatorIndex < 1) return env

      const key = trimmed.slice(0, separatorIndex).trim()
      const rawValue = trimmed.slice(separatorIndex + 1).trim()
      env[key] = rawValue.replace(/^['"]|['"]$/g, '')
      return env
    },
    {},
  )
}

function getLocalEnv(name: string): string {
  const envFile = parseEnvFile(path.resolve(process.cwd(), '../api/.env'))
  return process.env[name] ?? envFile[name] ?? ''
}

function getManagerApiConfig() {
  const baseURL = getLocalEnv('BASE_MANAGER_API')
    .replace('host.docker.internal', '127.0.0.1')
    .replace(/\/+$/, '')
  const apiKey = getLocalEnv('X_API_KEY')

  if (!baseURL || !apiKey) {
    return null
  }

  return { baseURL, apiKey }
}

function authHeaders(token: string): Record<string, string> {
  return { Authorization: `Bearer ${token}` }
}

function coreHeaders(token: string, apiKey: string): Record<string, string> {
  return {
    ...authHeaders(token),
    'X-API-KEY': apiKey,
  }
}

function unwrapPayload<T>(payload: unknown): T {
  const candidate = payload as { data?: unknown }
  return (candidate?.data ?? payload) as T
}

function extractRows<T>(payload: unknown): T[] {
  const candidate = payload as { data?: unknown; items?: unknown }
  const data = candidate?.data as { data?: unknown; items?: unknown } | undefined
  const rows = data?.data ?? data?.items ?? candidate?.items ?? candidate?.data
  return Array.isArray(rows) ? (rows as T[]) : []
}

async function getJson<T>(request: APIRequestContext, pathName: string, token: string): Promise<T> {
  const response = await request.get(`/api/v1${pathName}`, {
    headers: authHeaders(token),
  })

  expect(response.ok(), `GET ${pathName} respondio ${response.status()}`).toBeTruthy()
  return response.json() as Promise<T>
}

async function deleteDrafts(
  request: APIRequestContext,
  draftIds: number[],
  token: string,
) {
  const config = getManagerApiConfig()
  if (!config) return

  await Promise.allSettled(
    draftIds.map((id) =>
      request.delete(`${config.baseURL}/work-order-drafts/${id}`, {
        headers: coreHeaders(token, config.apiKey),
      }),
    ),
  )
}

async function resolveFixture(request: APIRequestContext, token: string) {
  const projectPayload = await getJson<unknown>(request, `/projects/${PROJECT_ID}`, token)
  const project = unwrapPayload<ProjectDetail>(projectPayload)
  const fields = Array.isArray(project.fields) ? project.fields : []
  const field = fields.find(
    (candidate) =>
      Array.isArray(candidate.lots) &&
      candidate.lots.filter((lot) => Number(lot.current_crop_id) > 0).length >= 2,
  )
  const lots = (field?.lots ?? []).filter((lot) => Number(lot.current_crop_id) > 0).slice(0, 2)

  const laborsPayload = await getJson<unknown>(request, `/projects/${PROJECT_ID}/labors`, token)
  const labor = extractRows<Labor>(laborsPayload).find((item) => !item.is_pending)

  const suppliesPayload = await getJson<unknown>(
    request,
    `/supplies?project_id=${PROJECT_ID}&page=1&per_page=100`,
    token,
  )
  const supply = extractRows<Supply>(suppliesPayload).find((item) => !item.is_pending)
  const investor = Array.isArray(project.investors) ? project.investors[0] : null

  return {
    project,
    field,
    lots,
    labor,
    supply,
    investor,
  }
}

test('batch multi-lote guarda consumo total una sola vez', async ({ request }) => {
  const token = createE2EToken()
  const fixture = await resolveFixture(request, token)

  test.skip(!fixture.field, `project ${PROJECT_ID} no tiene un campo con al menos 2 lotes con cultivo`)
  test.skip(fixture.lots.length < 2, `project ${PROJECT_ID} no tiene 2 lotes validos`)
  test.skip(!fixture.labor, `project ${PROJECT_ID} no tiene labores disponibles`)
  test.skip(!fixture.supply, `project ${PROJECT_ID} no tiene insumos disponibles`)
  test.skip(!fixture.investor, `project ${PROJECT_ID} no tiene inversores disponibles`)

  const baseNumber = `D-${Date.now()}`
  const createdDraftIds: number[] = []

  try {
    const response = await request.post('/api/v1/work-order-drafts/digital/batch', {
      headers: authHeaders(token),
      data: {
        number: baseNumber,
        date: new Date().toISOString().slice(0, 10),
        customer_id: fixture.project.customer?.id ?? FALLBACK_CUSTOMER_ID,
        project_id: PROJECT_ID,
        campaign_id: fixture.project.campaign?.id ?? null,
        field_id: fixture.field!.id,
        crop_id: Number(fixture.lots[0].current_crop_id),
        labor_id: fixture.labor!.id,
        contractor: fixture.labor!.contractor_name ?? '',
        observations: 'E2E multi-lote consumo total',
        investor_id: fixture.investor!.id,
        lots: fixture.lots.map((lot) => ({
          lot_id: lot.id,
          effective_area: LOT_AREA,
          items: [
            {
              supply_id: fixture.supply!.id,
              total_used: String(EXPECTED_TOTAL_USED),
            },
          ],
        })),
      },
    })

    const createBody = await response.text()
    expect(
      response.ok(),
      `POST batch respondio ${response.status()}: ${createBody}`,
    ).toBeTruthy()

    const createPayload = JSON.parse(createBody) as { items?: BatchCreateItem[] }
    const createdItems = createPayload.items ?? []
    expect(createdItems).toHaveLength(2)
    createdDraftIds.push(...createdItems.map((item) => item.id))

    const details = await Promise.all(
      createdItems.map((item) =>
        getJson<DraftDetail>(request, `/work-order-drafts/${item.id}`, token),
      ),
    )

    const observedTotalUsed = details.reduce((total, draft) => {
      const matchingItem = draft.items?.find((item) => item.supply_id === fixture.supply!.id)
      return total + Number(matchingItem?.total_used ?? 0)
    }, 0)

    expect(observedTotalUsed).toBeCloseTo(EXPECTED_TOTAL_USED, 5)
  } finally {
    await deleteDrafts(request, createdDraftIds, token)
  }
})
