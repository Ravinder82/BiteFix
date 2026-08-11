export default async function handler(req, res) {
  // 1. Enable CORS for preflight requests from the mobile app
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 2. Validate Request Type
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed. Use POST.' });
  }

  const { images } = req.body || {}; // Expecting an array of base64 strings

  if (!images || !Array.isArray(images) || images.length === 0) {
    return res.status(400).json({ error: 'No images provided in the request body.' });
  }

  // 3. Get the API Key securely from Vercel's encrypted environment variables
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server. Add it to Vercel Settings > Environment Variables.' });
  }

  try {
    // 4. Construct the prompt for Gemini Vision
    const promptText = `
      You are an expert nutritionist and food analyst. Analyze these images of a packaged food product (which may include the front of package, nutrition label, and ingredients list).
      Extract the following information and return ONLY a valid JSON object matching this structure exactly (do NOT wrap the response in markdown blocks like \`\`\`json):
      {
        "name": "Exact Product Name (e.g. Bourbon Biscuit)",
        "brand": "Brand Name (e.g. Britannia)",
        "calories": 0,
        "sugarGrams": 0,
        "carbsGrams": 0,
        "fatGrams": 0,
        "proteinGrams": 0,
        "ingredientsText": "The full ingredients string transcribed exactly",
        "additives": ["List of any E-numbers or chemical additive names found"],
        "allergens": ["List of allergens found"],
        "novaClass": 4, 
        "categoryTag": "en:biscuit"
      }
      If a value is not visible in the images, guess the most likely value based on the product type, or use 0 for numbers and empty arrays for lists.
    `;

    // 5. Map the base64 images into the format Gemini's REST API expects
    const parts = images.map((base64Str) => ({
      inlineData: {
        mimeType: 'image/jpeg', // We'll send JPEGs from the Expo app
        data: base64Str,
      },
    }));
    
    // Add the text prompt to the beginning of the parts array
    parts.unshift({ text: promptText });

    const requestBody = {
      contents: [{
        parts: parts
      }],
      generationConfig: {
        responseMimeType: "application/json" // Force JSON output
      }
    };

    // 6. Call the official Google Gemini API (REST Endpoint)
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to communicate with Gemini API', details: errorData });
    }

    const data = await response.json();
    
    // 7. Parse and return the response to the mobile app
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      return res.status(500).json({ error: 'No valid response from Gemini.' });
    }

    // Try parsing the JSON to ensure it's valid before sending to client
    let parsedData;
    try {
      parsedData = JSON.parse(candidateText);
    } catch (e) {
      return res.status(500).json({ error: 'Gemini returned invalid JSON', raw: candidateText });
    }

    return res.status(200).json({ success: true, data: parsedData });

  } catch (error) {
    console.error('Serverless Function Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
