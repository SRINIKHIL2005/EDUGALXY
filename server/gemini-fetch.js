import fetch from 'node-fetch';

const API_ENDPOINT_PREFIX = 'https://generativelanguage.googleapis.com/v1beta/models';

export async function fetchGeminiAPI(model, prompt, maxRetries = 3, initialDelay = 1000, timeout = 30000) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY; // Define and read it here
  if (!GEMINI_API_KEY) {
    console.error("Error: GEMINI_API_KEY is not set in environment variables at the time of function call.");
    throw new Error("GEMINI_API_KEY is not set.");
  }

  const url = `${API_ENDPOINT_PREFIX}/${model}:generateContent?key=${GEMINI_API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    // Add any other generationConfig parameters here if needed, e.g.,
    // generationConfig: {
    //   temperature: 0.7,
    //   maxOutputTokens: 1000,
    // }
  };

  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
          return data.candidates[0].content.parts[0].text;
        } else {
          // Handle cases where the response structure is not as expected
          console.warn('Gemini API response structure unexpected:', data);
          lastError = new Error('Unexpected response structure from Gemini API');
          // Potentially retry for this as well, or handle as a specific error
          // For now, we'll let it fall through to retry or final error
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
        console.error(`Gemini API Error (Attempt ${attempt + 1}/${maxRetries}): ${response.status} ${response.statusText}`, errorData);
        lastError = new Error(`API request failed with status ${response.status}: ${errorData?.error?.message || response.statusText}`);
        
        // Specific handling for rate limits (429) or server errors (5xx)
        if (response.status === 429 || response.status >= 500) {
          if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue; // Retry
          }
        } else {
          // For other client-side errors (4xx, excluding 429), don't retry
          throw lastError;
        }
      }
    } catch (error) {
      console.error(`Fetch Error (Attempt ${attempt + 1}/${maxRetries}):`, error.name, error.message);
      lastError = error;
      if (error.name === 'AbortError') { // Timeout
        console.error('Request timed out.');
        // Retry on timeout
        if (attempt < maxRetries - 1) {
            const delay = initialDelay * Math.pow(2, attempt);
            console.log(`Retrying in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
        }
      } else if (attempt < maxRetries - 1) { // Other fetch-related errors (network, etc.)
        const delay = initialDelay * Math.pow(2, attempt);
        console.log(`Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }

  console.error("Gemini API call failed after multiple retries.");
  throw lastError || new Error("Gemini API call failed after multiple retries.");
}
