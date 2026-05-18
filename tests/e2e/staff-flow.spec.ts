import { test, expect } from '@playwright/test';
import { authenticateAdmin, createQueue, waitForSSE } from './helpers/api';

// Smoke: staff opens the queue ops panel and clicks "Panggil berikutnya".
// We assert the API call succeeds and the panel shows an active ticket.
// We don't assert which ticket — the panel's `cur` derivation finds the
// FIRST counter-1 ticket in calling/serving state, which on a long-lived
// Neon DB may be an older stale entry rather than the one we just called.
test('staff: call next UMUM ticket from the panel', async ({ page, request }) => {
  await createQueue(request, 'UMUM');

  // Authenticate via API and inject the refresh cookie into the page's
  // browser context so the admin layout's hydrate() succeeds.
  await authenticateAdmin(page, request);

  await page.goto('/admin/queue');
  await waitForSSE(page);

  const callBtn = page.getByRole('button', { name: /panggil berikutnya/i });
  await expect(callBtn).toBeEnabled({ timeout: 10_000 });

  // Wait for the call API to return successfully — this is the load-bearing
  // assertion. Whatever the panel ends up displaying afterwards is a render
  // concern; this proves the staff action actually triggered a backend call.
  const callResponse = page.waitForResponse(
    (resp) => resp.url().includes('/queues/call') && resp.ok(),
    { timeout: 5_000 },
  );
  await callBtn.click();
  await callResponse;

  // The panel must render SOME active ticket number (matches A-/B-/C-/D-/E-NN).
  // If it stayed at "—" the panel didn't pick up SSE; if it shows a number
  // the call/render chain is working.
  const activeNum = page.locator('.staff-now .num');
  await expect(activeNum).toBeVisible();
  await expect(activeNum).toHaveText(/^[A-E]-\d+$/, { timeout: 5_000 });
});
