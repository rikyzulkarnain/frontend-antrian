import { test, expect } from '@playwright/test';

// Smoke test: a visitor walks up to the kiosk, picks UMUM, reads the SOP, and
// reaches the intake step (QR + name/purpose form). Every service now requires
// the visitor to register on their phone before a number is issued, so the
// kiosk hands off to the mobile form here rather than printing a ticket
// directly. See prd.md §7 ("Perjalanan Pengunjung").
test('kiosk: UMUM flow reaches the intake registration step', async ({ page }) => {
  await page.goto('/kiosk');

  // Idle screensaver is the outer kiosk wrapper. Any click inside advances
  // to the service selector. We aim at the "Sentuh layar" hint area to
  // mirror what a real visitor would do.
  await page.getByText(/sentuh layar/i).click();

  // Service grid uses data-key for each ServiceCard.
  await page.locator('[data-key="UMUM"]').click();

  // SOP step — confirmation button now reads "Lanjut isi formulir".
  await page.getByRole('button', { name: /lanjut isi formulir/i }).click();

  // Intake step shows the registration QR and instructions. The visitor would
  // scan this and complete name + purpose on their phone; the kiosk then picks
  // up the issued number by polling.
  await expect(page.getByText(/isi formulir/i).first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/pindai qr/i)).toBeVisible();
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
