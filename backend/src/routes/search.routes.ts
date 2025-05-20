// src/routes/search.routes.ts
import { Router } from 'express';
import { indexContent, searchContent } from '../controllers/search.controller';

const router = Router();

router.post('/index', indexContent);
router.post('/query', searchContent);

export default router;