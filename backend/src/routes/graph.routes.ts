// src/routes/graph.routes.ts
import { Router } from 'express';

const router = Router();

// Placeholder route handlers
router.post('/load', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Graph load functionality is being implemented'
  });
});

router.post('/query', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Graph query functionality is being implemented'
  });
});

export default router;