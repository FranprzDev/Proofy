// Hand-written smoke tests for the landing. Generated suites live in tests/generated/ (written by Agent 1).
import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('hero shows the pitch and the main navigation', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', { name: /ENTREGÁ CÓDIGO/ })).toBeVisible();
  await expect(screen.getByText('Vos construís. La IA verifica. Solana paga.', { exact: false })).toBeVisible();
  const nav = screen.getByRole('navigation').first();
  for (const name of ['Cómo funciona', 'Beneficios', 'Para quién', 'FAQ', 'Analizar contrato']) {
    await expect(nav.getByRole('link', { name })).toBeVisible();
  }
});

test('hero demo walks through agreement, verification and payment', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('button', { name: 'Acuerdo' }).click();
  await expect(screen.getByRole('heading', { name: 'Todo empieza con reglas claras.' })).toBeVisible();
  await screen.getByRole('button', { name: 'Pago' }).click();
  await expect(screen.getByRole('heading', { name: 'Entregaste. Verificaste. Cobraste.' })).toBeVisible();
  await expect(screen.getByRole('button', { name: 'Pago' })).toHaveAttribute('aria-pressed', 'true');
});

test('the how-it-works section lists the four steps', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('navigation').first().getByRole('link', { name: 'Cómo funciona' }).click();
  await expect(screen.getByRole('heading', { name: 'CÓMO FUNCIONA' })).toBeVisible();
  for (const name of ['Acuerdo bilateral', 'Desarrollo con pipeline', 'Verificación del Frontier Agent', 'Pago automático en Solana']) {
    await expect(screen.getByRole('heading', { name })).toBeAttached();
  }
});

test('joining the waitlist confirms the sign-up', async ({ app, screen }) => {
  await app.open('/');
  await screen.getByRole('textbox', { name: /correo/i }).fill('qa@proofy.dev');
  await screen.getByRole('button', { name: /Unirme a la lista/i }).click();
  await expect(screen.getByText('Te notificaremos', { exact: false })).toBeVisible();
});

test('"Analizar contrato" opens the contract analyzer', async ({ app, browser, screen }) => {
  await app.open('/');
  await screen.getByRole('navigation').first().getByRole('link', { name: 'Analizar contrato' }).click();
  await expect(browser).toHaveURL('/contrato');
  await expect(screen.getByRole('heading', { name: 'Analizá tu contrato.' })).toBeVisible();
});
