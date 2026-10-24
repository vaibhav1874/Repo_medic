import express from 'express';
import cors from 'cors';
import { config } from './config.js';
import { healthRouter } from './routes/health.js';
import { analysisRouter } from './routes/analysis.js';
import { patchRouter } from './routes/patch.js';
import { verifyRouter } from './routes/verify.js';
import { reportRouter } from './routes/report.js';
import { errorHandler } from './middleware/error-handler.js';

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Increase JSON limit for zip uploads (50MB)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// API Routes
app.use('/api/health', healthRouter);
app.use('/api/analyze', analysisRouter);
app.use('/api/patch', patchRouter);
app.use('/api/verify', verifyRouter);
app.use('/api/report', reportRouter);

// Error Handler
app.use(errorHandler);

app.listen(config.port, config.host, () => {
  console.log(`[RepoMedic AI] Backend server running at http://${config.host}:${config.port}`);
  console.log(`[RepoMedic AI] Nebius Model: ${config.nebius.modelId}`);
  console.log(`[RepoMedic AI] API Key Configured: ${Boolean(config.nebius.apiKey)}`);
  console.log(`[RepoMedic AI] Demo Mode: ${config.demoMode}`);
});

export default app;
