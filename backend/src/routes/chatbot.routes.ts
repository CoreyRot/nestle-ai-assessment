import express from 'express';
import * as controller from '../controllers/chatbot.controller';

// Create a new router
const router = express.Router();

// Define routes
router.post('/query', (req, res, next) => controller.processQuery(req, res, next));

export default router;