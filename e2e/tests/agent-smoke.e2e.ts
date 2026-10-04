// Agentic smoke test: proves the Gemini-backed agent can drive and judge the app.
// Skipped when no model key is configured (e.g. CI without the GOOGLE_GENERATIVE_AI_API_KEY secret).
import { test } from '@e2e-dev/web';

const noKey = !process.env.GOOGLE_GENERATIVE_AI_API_KEY && 'GOOGLE_GENERATIVE_AI_API_KEY is not set';

test('agent explores the hero demo up to the payment step', { skip: noKey }, async ({ app, agent }) => {
  await app.open('/');
  await agent.act('In the hero demo card, open the payment step ("Pago").');
  await agent.assert('The demo card says the delivery was verified and the payment was collected ("Entregaste. Verificaste. Cobraste.").');
});
