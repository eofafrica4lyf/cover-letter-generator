import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Dynamically import API handlers
const apiDir = join(__dirname, '../api');

// Wrapper to convert Vercel handler to Express handler
const wrapVercelHandler = (handler: any) => {
  return async (req: express.Request, res: express.Response) => {
    try {
      // Create Vercel-compatible request/response objects
      const vercelReq: any = {
        method: req.method,
        body: req.body,
        query: req.query,
        headers: req.headers,
      };

      const vercelRes: any = {
        status: (code: number) => {
          res.status(code);
          return vercelRes;
        },
        json: (data: any) => {
          res.json(data);
        },
        send: (data: any) => {
          res.send(data);
        },
      };

      await handler(vercelReq, vercelRes);
    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
};

// Fallback when API handlers fail to load (e.g. missing deps)
function apiUnavailable(_req: express.Request, res: express.Response) {
  res.status(503).json({
    error: 'API temporarily unavailable',
    message: 'Restart the dev server after running: npm install',
  });
}

// Register API routes dynamically
async function setupRoutes() {
  try {
    const { default: generateHandler } = await import('../api/generate.ts');
    const { default: parseHandler } = await import('../api/parse.ts');
    const { default: translateHandler } = await import('../api/translate.ts');

    app.post('/api/generate', wrapVercelHandler(generateHandler));
    app.post('/api/parse', wrapVercelHandler(parseHandler));
    app.post('/api/translate', wrapVercelHandler(translateHandler));

    app.listen(PORT, () => {
      console.log(`\n🚀 Dev API server running on http://localhost:${PORT}`);
      console.log(`📝 API endpoints:`);
      console.log(`   POST http://localhost:${PORT}/api/generate`);
      console.log(`   POST http://localhost:${PORT}/api/parse`);
      console.log(`   POST http://localhost:${PORT}/api/translate`);
      console.log(`\n✅ Ready to accept requests!\n`);
    });
  } catch (error) {
    console.error('Failed to load API handlers:', error);
    // Still start the server so Vite can run and the app loads; /api/* returns 503
    app.post('/api/generate', apiUnavailable);
    app.post('/api/parse', apiUnavailable);
    app.post('/api/translate', apiUnavailable);
    app.listen(PORT, () => {
      console.log(`\n⚠️  Dev API server running on http://localhost:${PORT} (handlers failed to load)`);
      console.log(`   Fix the error above and restart. Frontend: http://localhost:5173\n`);
    });
  }
}

setupRoutes();
