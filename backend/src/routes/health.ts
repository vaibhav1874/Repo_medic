import { Router } from 'express';
import { config } from '../config.js';

export const healthRouter = Router();

healthRouter.get('/', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    nebius: {
      modelId: config.nebius.modelId,
      baseUrl: config.nebius.baseUrl,
      hasApiKey: Boolean(config.nebius.apiKey),
    },
    demoMode: config.demoMode,
  });
});
