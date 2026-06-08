import { expect, test } from '@playwright/test'
import { installAuthenticatedSession } from './helpers/auth'

test('work order labor selector loads project labors without lookup error', async ({ page }) => {
  await installAuthenticatedSession(page)

  await page.goto('/work-orders')

  const customerSelect = page.getByLabel('Cliente')
  const projectSelect = page.getByLabel('Proyecto')

  await expect(customerSelect.locator('option[value="17"]')).toHaveCount(1)
  await customerSelect.selectOption('17')

  await expect(projectSelect.locator('option[value="30"]')).toHaveCount(1)

  const laborsResponsePromise = page.waitForResponse(
    (response) => response.url().includes('/api/v1/projects/30/labors') && response.ok(),
  )

  await projectSelect.selectOption('30')

  const laborsResponse = await laborsResponsePromise
  const laborsPayload = (await laborsResponse.json()) as { data?: unknown }

  expect(Array.isArray(laborsPayload.data)).toBe(true)

  await page.getByRole('button', { name: 'Continuar' }).click()
  await expect(page.getByText('Campo y labor')).toBeVisible()

  const laborSelector = page.getByRole('button', { name: /Seleccionar labor/i })

  await expect(laborSelector).toBeEnabled()
  await laborSelector.click()

  await expect(page.getByText(/failed to list labor/i)).toHaveCount(0)
  await expect(page.locator('.wof-supplyOption').first()).toBeVisible()
})
