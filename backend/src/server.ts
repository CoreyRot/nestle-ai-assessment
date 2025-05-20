// src/server.ts
import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import routes from './routes';

// Load environment variables from .env file
dotenv.config();

// Log environment variables to verify they're loaded (without showing full values)
console.log('Environment variables loaded:');
console.log(`AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT ? '✓' : '✗'}`);
console.log(`AZURE_SEARCH_ENDPOINT: ${process.env.AZURE_SEARCH_ENDPOINT ? '✓' : '✗'}`);
console.log(`AZURE_COSMOS_ENDPOINT: ${process.env.AZURE_COSMOS_ENDPOINT ? '✓' : '✗'}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', routes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Default route
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Nestlé Chatbot API - Welcome!' });
});

// Error handling for 404 - route not found
app.use((req, res) => {
  console.log(`[404] Route not found: ${req.originalUrl}`);
  res.status(404).json({ 
    status: 'error', 
    message: `Route ${req.originalUrl} not found` 
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});