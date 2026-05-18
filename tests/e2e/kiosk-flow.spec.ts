import { test, expect } from '@playwright/test';

// Smoke test: a visitor walks up to the kiosk, picks UMUM, accepts SOP, and
// receives a queue ticket. This is the load-bearing flow described in
// prd.md §7 ("Perjalanan Pengunjung") — if it works, the core happy path
// is intact.
test('kiosk: take a UMUM ticket end-to-end', async ({ page }) => {
  await page.goto('/kiosk');

  // Idle screensaver is the outer kiosk wrapper. Any click inside advances
  // to the service selector. We aim at the "Sentuh layar" hint area to
  // mirror what a real visitor would do.
  await page.getByText(/sentuh layar/i).click();

  // Service grid uses data-key for each ServiceCard.
  await page.locator('[data-key="UMUM"]').click();

  // SOP step — confirmation button reads "Ambil nomor antrian".
  await page.getByRole('button', { name: /ambil nomor antrian/i }).click();

  // Ticket screen renders the queue number in a dedicated data-testid.
  const ticket = page.getByTestId('ticket-number');
  await expect(ticket).toBeVisible({ timeout: 10_000 });
  await expect(ticket).toHaveText(/^A-\d{2,}$/);

  // The "Antrian di depan" cell starts as "—" until the count fetch
  // resolves, then becomes a number. Either is acceptable; just confirm
  // the layout is present.
  await expect(page.getByText(/antrian di depan/i)).toBeVisible();
});

test('kiosk: cancel from SOP returns to service selector', async ({ page }) => {
  await page.goto('/kiosk');
  await page.getByText(/sentuh layar/i).click();
  await page.locator('[data-key="LAB"]').click();

  // SOP shows the service name as h2.
  await expect(page.getByRole('heading', { name: /layanan lab/i })).toBeVisible();

  // "Pilih layanan lain" goes back. After clicking we should see the
  // service grid headline again.
  await page.getByRole('button', { name: /pilih layanan lain/i }).click();
  await expect(page.getByRole('heading', { name: /layanan apa yang/i })).toBeVisible();
});
