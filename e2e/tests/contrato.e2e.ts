// The contract analyzer without a wallet: the engine steps render and the page asks to connect Phantom.
import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('contract analyzer shows its steps and finishes loading the session', async ({ app, screen }) => {
  await app.open('/contrato');
  await expect(screen.getByRole('heading', { name: 'Analizá tu contrato.' })).toBeVisible();
  const steps = screen.getByRole('list', { name: 'Progreso del análisis' });
  await expect(steps.getByRole('listitem')).toHaveCount(3);
  await expect(screen.getByText('Cargando sesión…')).toBeHidden({ timeout: 15_000 });
});
