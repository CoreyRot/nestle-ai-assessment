// src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import routes from './routes';

// Try to load from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Set environment variables manually if they're not loaded from .env
if (!process.env.AZURE_OPENAI_ENDPOINT) {
  console.log('Warning: Environment variables not found. Please make sure your .env file is properly configured.');
  
  // Use placeholders instead of actual keys
  process.env.AZURE_OPENAI_ENDPOINT = 'YOUR_OPENAI_ENDPOINT_HERE';
  process.env.AZURE_OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'YOUR_OPENAI_DEPLOYMENT_NAME_HERE';
  process.env.AZURE_OPENAI_API_VERSION = '2024-12-01-preview';
  
  process.env.AZURE_SEARCH_ENDPOINT = 'YOUR_SEARCH_ENDPOINT_HERE';
  process.env.AZURE_SEARCH_API_KEY = 'YOUR_SEARCH_API_KEY_HERE';
  process.env.AZURE_SEARCH_INDEX_NAME = 'nestle-products-index';
  
  process.env.AZURE_COSMOS_ENDPOINT = 'YOUR_COSMOS_ENDPOINT_HERE';
  process.env.AZURE_COSMOS_GREMLIN_ENDPOINT = 'YOUR_GREMLIN_ENDPOINT_HERE';
  process.env.AZURE_COSMOS_KEY = 'YOUR_COSMOS_KEY_HERE';
  process.env.AZURE_COSMOS_DATABASE = 'NestleProductsDB';
  process.env.AZURE_COSMOS_GRAPH = 'ProductGraph';
}

// Log environment variables to verify they're loaded
console.log('Environment variables:');
console.log(`AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT}`);
console.log(`AZURE_SEARCH_ENDPOINT: ${process.env.AZURE_SEARCH_ENDPOINT}`);
console.log(`AZURE_COSMOS_ENDPOINT: ${process.env.AZURE_COSMOS_ENDPOINT}`);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
// Add these two lines to parse JSON request bodies
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