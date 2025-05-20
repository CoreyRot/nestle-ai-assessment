import axios from 'axios';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Azure OpenAI configuration
const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
const openaiApiKey = process.env.AZURE_OPENAI_API_KEY;
const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'nestle-chatbot-model';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

// Log configuration (without exposing sensitive values)
console.log('OpenAI Service - Configuration:');
console.log(`Endpoint configured: ${openaiEndpoint ? 'Yes' : 'No'}`);
console.log(`API Key configured: ${openaiApiKey ? 'Yes' : 'No'}`);
console.log(`Deployment: ${openaiDeployment}`);
console.log(`API Version: ${apiVersion}`);

/**
 * Generate a response from Azure OpenAI
 * @param prompt The prompt to send to OpenAI
 * @param contextInfo Optional context information
 * @returns The generated response
 */
export const generateResponse = async (prompt: string, contextInfo?: string): Promise<string> => {
  try {
    // Make sure we have an endpoint configured
    if (!openaiEndpoint || !openaiApiKey) {
      console.error('Azure OpenAI credentials not properly configured');
      return 'I apologize, but I encountered an issue while processing your request. The Azure OpenAI service is not properly configured.';
    }

    // Ensure the endpoint has the correct format
    const baseEndpoint = openaiEndpoint.endsWith('/') 
      ? openaiEndpoint.slice(0, -1) 
      : openaiEndpoint;

    // Create the complete prompt with context if provided
    const completePrompt = contextInfo 
      ? `Context information about Nestlé products:\n${contextInfo}\n\nQuestion: ${prompt}\n\nAnswer:`
      : prompt;

    // Build the request URL
    const url = `${baseEndpoint}/openai/deployments/${openaiDeployment}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Making OpenAI request to: ${url}`);
    
    // Make the request to Azure OpenAI
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: 'You are Smartie, a helpful assistant for Made with Nestlé Canada. You provide information about Nestlé products, recipes, and nutritional information. Keep your answers focused on Nestlé products and be friendly and concise.' },
          { role: 'user', content: completePrompt }
        ],
        max_tokens: 800,
        temperature: 0.7,
        top_p: 0.95,
        model: "gpt-4.1", // Specify the model name explicitly
        frequency_penalty: 0,
        presence_penalty: 0,
        stop: null
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': openaiApiKey
        }
      }
    );

    console.log('Response received from Azure OpenAI');
    // Extract and return the generated text
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error generating response from Azure OpenAI:', error);
    
    // More detailed error information
    if (axios.isAxiosError(error)) {
      console.error('Axios Error Details:');
      console.error(`Status: ${error.response?.status}`);
      console.error(`Status Text: ${error.response?.statusText}`);
      console.error(`Response Data:`, error.response?.data);
    }
    
    // Provide a fallback response if the API call fails
    return 'I apologize, but I encountered an issue while processing your request. Please try again later or contact Nestlé customer support for assistance.';
  }
};

/**
 * Generate embeddings for text using Azure OpenAI
 * @param text The text to generate embeddings for
 * @returns The embeddings
 */
export const generateEmbeddings = async (text: string): Promise<number[]> => {
  try {
    // Currently, we will use a mock embedding function since you may not have
    // the embedding model deployed yet
    console.log(`Generating embeddings for text: ${text.substring(0, 50)}...`);
    
    // Create a mock embedding vector with 1536 dimensions (standard for OpenAI embeddings)
    const dimensions = 1536;
    const mockEmbedding = Array(dimensions).fill(0).map(() => Math.random() * 2 - 1);
    
    return mockEmbedding;
    
    /* Uncomment this when you have the embedding model deployed
    // Use the embedding model endpoint
    const embeddingDeployment = process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT || 'text-embedding-ada-002';
    
    // Build the request URL for embeddings
    const url = `${openaiEndpoint}/openai/deployments/${embeddingDeployment}/embeddings?api-version=${apiVersion}`;
    
    // Make the request to Azure OpenAI
    const response = await axios.post(
      url,
      {
        input: text,
        model: embeddingDeployment
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': openaiApiKey
        }
      }
    );

    // Extract and return the embeddings
    return response.data.data[0].embedding;
    */
  } catch (error) {
    console.error('Error generating embeddings:', error);
    throw error;
  }
};

// Check if configuration is complete
const validateConfig = () => {
  const missingVars = [];
  if (!openaiEndpoint) missingVars.push('AZURE_OPENAI_ENDPOINT');
  if (!openaiApiKey) missingVars.push('AZURE_OPENAI_API_KEY');
  if (!openaiDeployment) missingVars.push('AZURE_OPENAI_DEPLOYMENT');
  
  if (missingVars.length > 0) {
    console.warn(`Warning: Missing environment variables: ${missingVars.join(', ')}`);
    console.warn('Make sure your .env file is properly configured.');
  } else {
    console.log('OpenAI service configuration validated successfully');
  }
};

// Run the validation when this module is loaded
validateConfig();

export default {
  generateResponse,
  generateEmbeddings,
  validateConfig
};