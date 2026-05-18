import { test, expect } from '@playwright/test';
import {
  callNext,
  completeQueue,
  createQueue,
  loginAsAdmin,
  oldestWaiting,
} from './helpers/api';

// Full PRD §7 customer journey: take ticket → called → served → rated.
// We drive the lifecycle via API (so we know which ticket reaches the
// completed state) then verify the mobile page auto-switches to the
// SKMView and the form submits.
test('rating: mobile shows SKMView when completed, submits rating', async ({ page, request }) => {
  // Create a fresh UMUM ticket, drive it through the full state machine.
  await createQueue(request, 'UMUM');
  const target = await oldestWaiting(request, 'UMUM');
  if (!target) throw new Error('no waiting UMUM ticket after create');

  const token = await loginAsAdmin(request);
  const called = await callNext(request, token, 1, 'UMUM');
  // Complete the ticket BEFORE the mobile page opens — MobileContent
  // routes to SKMView when ticket.status === 'completed' on initial
  // load, which is the simpler path. (The SSE-driven transition from
  // calling → completed is exercised in mobile-flow.spec.ts.)
  await completeQueue(request, token, called.id);

  await page.goto(`/m/${called.id}`);

  // SKMView heading appears in place of StatusView.
  await expect(page.getByRole('heading', { name: /survei kepuasan masyarakat/i })).toBeVisible({
    timeout: 5_000,
  });

  // Submit button starts disabled, enables after picking a star.
  const submitBtn = page.getByRole('button', { name: /kirim penilaian/i });
  await expect(submitBtn).toBeDisabled();

  await page.getByRole('button', { name: /beri 5 bintang/i }).click();
  await expect(submitBtn).toBeEnabled();

  await submitBtn.click();

  // After submit, the form is replaced with a thank-you message.
  await expect(page.getByRole('heading', { name: /terima kasih!/i })).toBeVisible({
    timeout: 5_000,
  });
  await expect(submitBtn).toHaveCount(0);
});
