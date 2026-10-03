// TesterArmy e2e project for apps/web. Agent 1 writes generated suites into tests/generated/;
// Agent 2 reads .e2e/report.json and .e2e/junit.xml as PR evidence.
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { google } from '@ai-sdk/google';

// Local secrets (gitignored): GOOGLE_GENERATIVE_AI_API_KEY, optional E2E_MODEL. CI passes them as env.
try {
  process.loadEnvFile('.env');
} catch {
  // No .env: rely on the environment.
}

export default {
  tests: 'tests/**/*.e2e.ts',
  targets: [
    {
      engine: web(),
      app: {
        url: process.env.APP_URL ?? 'http://127.0.0.1:3000',
        command: { executable: 'pnpm', args: ['--dir', '../apps/web', 'dev'], log: '.e2e/logs/app.log' },
      },
    },
  ],
  // Model behind every agent.* step: Gemini via @ai-sdk/google (GOOGLE_GENERATIVE_AI_API_KEY).
  agents: {
    default: {
      model: google(process.env.E2E_MODEL ?? 'gemini-3.8-flash'),
      system:
        'You are a thorough QA agent for Proofy, a milestone escrow marketplace on Solana. ' +
        'Verify every outcome on screen and never assume a step succeeded without evidence.',
    },
  },
  reporters: ['list', 'junit'], // report.json is always written under .e2e/
} satisfies E2EConfig;
