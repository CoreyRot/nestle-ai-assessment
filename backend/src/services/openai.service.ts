import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

// Diagnostic logging to help debug environment variable loading
console.log('OpenAI Service - Loading environment variables');
console.log(`Current AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT}`);

// Add fallback values if they're not set
if (!process.env.AZURE_OPENAI_ENDPOINT) {
  console.log('Setting fallback OpenAI endpoint in service file');
  process.env.AZURE_OPENAI_ENDPOINT = 'https://crots-mawlzwnu-eastus2.cognitiveservices.azure.com/';
  process.env.AZURE_OPENAI_API_KEY = '6aq74HPSLokdu6atg7FCM6e7gPlCpgwzBP7cc5aNRzMusp4EHHnDJQQJ99BEACHYHv6XJ3w3AAAAACOGD5Hr';
  process.env.AZURE_OPENAI_DEPLOYMENT = 'nestle-chatbot-model';
  process.env.AZURE_OPENAI_API_VERSION = '2024-12-01-preview';
}

// Log again to confirm they're set properly
console.log(`Updated AZURE_OPENAI_ENDPOINT: ${process.env.AZURE_OPENAI_ENDPOINT}`);

// Azure OpenAI configuration - using direct fallback values to ensure they're set
const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT || 'https://crots-mawlzwnu-eastus2.cognitiveservices.azure.com/';
const openaiApiKey = process.env.AZURE_OPENAI_API_KEY || '6aq74HPSLokdu6atg7FCM6e7gPlCpgwzBP7cc5aNRzMusp4EHHnDJQQJ99BEACHYHv6XJ3w3AAAAACOGD5Hr';
const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'nestle-chatbot-model';
const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-12-01-preview';

/**
 * Generate a response from Azure OpenAI
 * @param prompt The prompt to send to OpenAI
 * @param contextInfo Optional context information
 * @returns The generated response
 */
export const generateResponse = async (prompt: string, contextInfo?: string): Promise<string> => {
  try {
    // Make sure we have an endpoint configured
    if (!openaiEndpoint) {
      console.error('Azure OpenAI endpoint is not configured');
      return 'I apologize, but I encountered an issue while processing your request. The Azure OpenAI endpoint is not properly configured.';
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
    console.log(`Using API Key (first 5 chars): ${openaiApiKey.substring(0, 5)}...`);
    
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

// Test function to verify configuration
const testConfig = () => {
  console.log('Testing OpenAI service configuration:');
  console.log(`Endpoint: ${openaiEndpoint}`);
  console.log(`API Key: ${openaiApiKey ? 'Set (first 5 chars: ' + openaiApiKey.substring(0, 5) + '...)' : 'Not set'}`);
  console.log(`Deployment: ${openaiDeployment}`);
  console.log(`API Version: ${apiVersion}`);
};

// Run the test when this module is loaded
testConfig();

export default {
  generateResponse,
  generateEmbeddings,
  testConfig // Add this to exports
};