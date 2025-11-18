const fetch = require('node-fetch');

const NIM_MODEL = 'nvidia/llama-3.1-nemotron-safety-guard-8b-v3';
const NIM_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';

/**
 * Analyze a comment's safety using NVIDIA NIM Safety Guard.
 * Always returns a structured object and never throws.
 */
async function analyzeCommentSafety(content) {
  const apiKey = process.env.NVIDIA_API_KEY;

  if (!apiKey) {
    console.warn('NVIDIA_API_KEY is not configured. Skipping comment safety analysis.');
    return {
      userSafety: 'unknown',
      categories: [],
      raw: null,
    };
  }

  const text = (content || '').toString().trim();
  if (!text) {
    return {
      userSafety: 'unknown',
      categories: [],
      raw: null,
    };
  }

  try {
    const response = await fetch(NIM_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: NIM_MODEL,
        messages: [
          {
            role: 'user',
            content: text.slice(0, 500), // keep prompts short
          },
        ],
        temperature: 0,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      console.error('NVIDIA NIM safety API error:', response.status, errorText);
      return {
        userSafety: 'unknown',
        categories: [],
        raw: errorText.slice(0, 2000) || null,
      };
    }

    const data = await response.json();
    console.log('Raw API response:', JSON.stringify(data, null, 2));
    
    // Extract the content from the response
    const messageContent = data?.choices?.[0]?.message?.content;
    
    if (!messageContent) {
      console.log('No message content in response');
      return {
        userSafety: 'unknown',
        categories: [],
        raw: JSON.stringify(data, null, 2),
      };
    }
    
    console.log('Message content:', messageContent);
    
    // Clean and parse the content
    const cleanContent = messageContent.trim();
    
    try {
      // Try to parse as JSON first (the API returns JSON as a string)
      let parsed;
      try {
        parsed = JSON.parse(cleanContent);
      } catch (e) {
        // If parsing fails, try to extract the JSON part
        const jsonMatch = cleanContent.match(/\{.*\}/s);
        if (jsonMatch) {
          parsed = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No valid JSON found in response');
        }
      }
      
      console.log('Parsed content:', parsed);
      
      // Extract safety information
      const userSafety = parsed['User Safety'] || parsed.userSafety || 'unknown';
      let categories = [];
      
      // Handle categories whether they come as string or array
      const categoriesField = parsed['Safety Categories'] || parsed.categories || [];
      if (Array.isArray(categoriesField)) {
        categories = categoriesField;
      } else if (typeof categoriesField === 'string') {
        categories = categoriesField.split(',').map(cat => cat.trim()).filter(Boolean);
      }
      
      console.log('Extracted safety info:', { userSafety, categories });
      
      return {
        userSafety: userSafety.toLowerCase(),
        categories,
        raw: cleanContent,
      };
      
    } catch (error) {
      console.error('Error parsing safety response:', error);
      console.log('Falling back to text analysis');
      
      // Fallback to simple text analysis for safety
      const lowerContent = cleanContent.toLowerCase();
      let userSafety = 'unknown';
      
      if (lowerContent.includes('unsafe') || lowerContent.includes('harmful')) {
        userSafety = 'unsafe';
      } else if (lowerContent.includes('safe')) {
        userSafety = 'safe';
      }
      
      // Try to extract categories from text
      let categories = [];
      const categoriesMatch = lowerContent.match(/categories?:\s*([^\n\r]+)/i);
      if (categoriesMatch && categoriesMatch[1]) {
        categories = categoriesMatch[1]
          .split(',')
          .map(cat => cat.trim())
          .filter(Boolean);
      }
      
      return {
        userSafety,
        categories,
        raw: cleanContent,
      };
    }

    const rawUserSafety = parsed['User Safety'] || parsed.userSafety;
    const userSafety = typeof rawUserSafety === 'string'
      ? rawUserSafety.toLowerCase()
      : 'unknown';

    const categoriesField = parsed['Safety Categories'] || parsed.categories;
    let categories = [];
    if (Array.isArray(categoriesField)) {
      categories = categoriesField.filter(Boolean).map(String);
    } else if (typeof categoriesField === 'string') {
      categories = categoriesField
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }

    return {
      userSafety: ['safe', 'unsafe'].includes(userSafety) ? userSafety : 'unknown',
      categories,
      raw: messageContent,
    };
  } catch (err) {
    console.error('Error calling NVIDIA NIM safety API:', err);
    return {
      userSafety: 'unknown',
      categories: [],
      raw: null,
    };
  }
}

module.exports = {
  analyzeCommentSafety,
};
