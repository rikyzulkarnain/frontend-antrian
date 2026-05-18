import { test, expect } from '@playwright/test';
import { callNext, createQueue, loginAsAdmin, oldestWaiting, waitForSSE } from './helpers/api';

// Mobile visitor opens /m/{ticketId} while waiting, then sees their status
// flip to "calling" once a staff member calls the queue. This exercises
// the SSE pipeline end-to-end: backend Publish → broker → /sse/queues →
// useQueueEvents → MobileContent setOverride.
test('mobile: status flips from waiting to calling via SSE', async ({ page, request }) => {
  // Ensure there's at least one UMUM ticket waiting, then take whichever
  // one CallNext will pick (oldest). The mobile page only updates state
  // when the SSE event id matches the ticket we're viewing, so we must
  // open the URL for the SAME ticket we'll call.
  await createQueue(request, 'UMUM');
  const target = await oldestWaiting(request, 'UMUM');
  if (!target) throw new Error('no waiting UMUM ticket after create');

  // Open the mobile page and wait for SSE to fully connect — events
  // published before the browser opens its stream are dropped (no
  // replay), so CallNext must not fire until subscription is established.
  await page.goto(`/m/${target.id}`);
  await expect(page.getByText('Menunggu giliran')).toBeVisible({ timeout: 5_000 });
  await waitForSSE(page);

  // Trigger the call from the backend, bypassing the staff UI.
  const token = await loginAsAdmin(request);
  await callNext(request, token, /* counterID */ 1, 'UMUM');

  // The status banner flips from "Menunggu giliran" → "Anda sedang dipanggil!".
  await expect(page.getByText('Anda sedang dipanggil!')).toBeVisible({ timeout: 10_000 });
});
