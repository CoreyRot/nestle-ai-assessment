import axios from 'axios';

// Set environment variables directly with the CORRECT values
process.env.AZURE_OPENAI_ENDPOINT = 'https://crots-mawlzwnu-eastus2.cognitiveservices.azure.com/';
process.env.AZURE_OPENAI_API_KEY = '6aq74HPSLokdu6atg7FCM6e7gPlCpgwzBP7cc5aNRzMusp4EHHnDJQQJ99BEACHYHv6XJ3w3AAAAACOGD5Hr';
process.env.AZURE_OPENAI_DEPLOYMENT = 'nestle-chatbot-model';

const testOpenAI = async () => {
  try {
    const openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    const openaiApiKey = process.env.AZURE_OPENAI_API_KEY;
    const openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT;
    const apiVersion = '2024-12-01-preview';

    console.log('Testing Azure OpenAI connection...');
    console.log(`Endpoint: ${openaiEndpoint}`);
    console.log(`Deployment: ${openaiDeployment}`);

    const url = `${openaiEndpoint}openai/deployments/${openaiDeployment}/chat/completions?api-version=${apiVersion}`;
    
    console.log(`Making request to URL: ${url}`);
    
    const response = await axios.post(
      url,
      {
        messages: [
          { role: 'system', content: 'You are a helpful assistant.' },
          { role: 'user', content: 'Say hello world' }
        ],
        max_tokens: 100,
        model: "gpt-4.1",
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'api-key': openaiApiKey
        }
      }
    );

    console.log('Azure OpenAI Response:');
    console.log(response.data.choices[0].message.content);
    console.log('Connection successful!');
  } catch (error) {
    console.error('Error testing Azure OpenAI:');
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Response data:', error.response.data);
    } else if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error('Unknown error occurred');
    }
  }
};

console.log('Starting OpenAI test...');
testOpenAI();