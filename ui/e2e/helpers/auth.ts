import type { Page } from '@playwright/test'
import { Buffer } from 'node:buffer'

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
      exp,
    }),
    '',
  ].join('.')
}

export async function installAuthenticatedSession(page: Page) {
  const token = createE2EToken()
  const expiresAt = (Math.floor(Date.now() / 1000) + 24 * 60 * 60) * 1000

  await page.addInitScript(
    ({ e2eToken, e2eExpiresAt }) => {
      localStorage.setItem(
        `ponti.session.${window.location.host}`,
        JSON.stringify({
          accessToken: e2eToken,
          refreshToken: e2eToken,
          user: {
            id: 'codex-e2e',
            email: 'codex-e2e@ponti.local',
            name: 'codex-e2e',
          },
          expiresAt: e2eExpiresAt,
        }),
      )
    },
    { e2eToken: token, e2eExpiresAt: expiresAt },
  )
}
