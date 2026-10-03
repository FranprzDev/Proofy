// Hand-written smoke tests. Generated suites live in tests/generated/ (written by Agent 1).
import { test } from '@e2e-dev/web';
import { expect } from 'e2e';

test('landing links to the marketplace', async ({ app, screen }) => {
  await app.open('/');
  await expect(screen.getByRole('heading', { name: 'Proofy' })).toBeVisible();
  await screen.getByRole('link', { name: 'Go to the marketplace' }).click();
});
