import { test, expect } from '@playwright/test';
import { callNext, createQueue, loginAsAdmin, oldestWaiting, waitForSSE } from './helpers/api';

// Display TV is the load-bearing screen for visitors in the waiting area —
// it must react to queue.called events in real time and surface the new
// number with the loket name. This covers PRD §6 "Pemutar Suara Otomatis"
// and the SSE → CurrentQueueBoard + QueueAnnouncement integration.
test('display: shows call banner when a queue is called', async ({ page, request }) => {
  // Make sure there is something callable.
  await createQueue(request, 'UMUM');
  const target = await oldestWaiting(request, 'UMUM');
  if (!target) throw new Error('no waiting UMUM ticket after create');

  // Open the Display TV. SSE subscribes on mount; we wait until it's open
  // before triggering the call so the event isn't dropped before
  // QueueAnnouncement's banner state can react.
  await page.goto('/display');
  await waitForSSE(page);

  // Trigger the call from the staff/admin side via API.
  const token = await loginAsAdmin(request);
  const called = await callNext(request, token, 1, 'UMUM');

  // The QueueAnnouncement banner ("Nomor antrian dipanggil") appears with
  // the called queue_number and loket name. AUTO_DISMISS_MS is 4.2s so we
  // race the banner's lifetime — assert quickly.
  await expect(page.getByText(/nomor antrian dipanggil/i)).toBeVisible({ timeout: 3_000 });
  await expect(page.locator('.card-call .num')).toHaveText(called.queue_number, { timeout: 3_000 });
});
