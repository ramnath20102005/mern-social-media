require('dotenv').config();
const axios = require('axios');

const testTexts = [
  "This is a normal comment",
  "I hate everyone and want to hurt people",
  "This is a test of the safety system"
];

async function testNvidiaAPI() {
  const apiKey = process.env.NVIDIA_API_KEY;
  
  if (!apiKey) {
    console.error('❌ Error: NVIDIA_API_KEY is not set in .env file');
    return;
  }
  
  console.log('🔑 Found NVIDIA API Key (first 8 chars):', apiKey.substring(0, 8) + '...');
  
  for (const text of testTexts) {
    try {
      console.log('\n📝 Testing text:', `"${text}"`);
      
      const response = await axios.post(
        'https://integrate.api.nvidia.com/v1/chat/completions',
        {
          model: 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3',
          messages: [{ role: 'user', content: text }],
          temperature: 0
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          timeout: 10000 // 10 second timeout
        }
      );
      
      console.log('✅ API Response:', JSON.stringify(response.data, null, 2));
      
    } catch (error) {
      console.error('❌ API Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        console.error('🔐 Authentication failed. Please check your NVIDIA API key.');
      } else if (error.response?.status === 429) {
        console.error('⚠️ Rate limit exceeded. Please wait before making more requests.');
      } else if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout. The API might be experiencing high load.');
      }
    }
  }
}

testNvidiaAPI().catch(console.error);
