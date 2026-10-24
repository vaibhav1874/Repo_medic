import dotenv from 'dotenv';
import path from 'path';

// Load .env from root or local
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || 'localhost',
  demoMode: process.env.DEMO_MODE === 'true',

  nebius: {
    apiKey: process.env.NEBIUS_API_KEY || '',
    baseUrl: process.env.NEBIUS_BASE_URL || 'https://api.tokenfactory.nebius.com/v1',
    modelId: process.env.NEBIUS_MODEL_ID || 'nvidia/Llama-3.1-Nemotron-70B-Instruct-HF',
  },

  limits: {
    maxRepoFiles: parseInt(process.env.MAX_REPO_FILES || '500', 10),
    maxRepoSizeMb: parseInt(process.env.MAX_REPO_SIZE_MB || '50', 10),
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '5', 10),
    analysisTimeoutMs: parseInt(process.env.ANALYSIS_TIMEOUT_MS || '60000', 10),
    testExecutionTimeoutMs: parseInt(process.env.TEST_EXECUTION_TIMEOUT_MS || '60000', 10),
  },

  allowedCommands: [
    'npm test',
    'npx vitest run',
    'npx jest --no-coverage',
    'npx mocha',
  ],
};
