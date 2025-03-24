// imageGenerator.js
const axios = require('axios');
/**
 * 產生圖片，回傳符合 GeneratedImage 格式的資料
 * @param {string} prompt - 產生圖片的文字提示
 * @param {number} n - 產生圖片的數量
 * @returns {Promise<string[]>}
 */
async function generateImage(prompt, n) {
    const url = 'https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/images/generations';
    const token = process.env.OPENAI_API_KEY;
  
    const requestBody = {
      model: 'sdxl',
      prompt: prompt,
      n: n,
      size: '1024x1024'
    };
  
    try {
      console.log('headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      console.log('body:', JSON.stringify(requestBody));
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
  
      const result = await response.json();
      const images = result.data.map(item => `data:image/png;base64,${item.b64_json}`);
      // print size of images
      console.log('response size:', result.data.length);
      images.forEach(image => {
        console.log('image size:', image.length);
      });
      return images;
    } catch (error) {
      console.error('Error generating image:', error);
      return undefined;
    }
} 

/**
 * 產生適合 stable diffusion 產生圖片的 prompt
 * 輸入文字會透過 openai compatible LLM 轉換成一個純粹的 prompt，輸出中不包含其他說明或補充，
 * 而 user prompt 中會表達圖片必須符合 minecraft 風格、像素與方塊化的風格。
 *
 * @param {string} text - 輸入的文字內容，用來生成 prompt
 * @returns {Promise<string>} - 回傳生成的 prompt 文字
 */
async function generateSDPrompt(text) {
  const apiKey = process.env.OPENAI_API_KEY;
  const url = "https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions";

  const body = {
    model: 'gpt-4o',
    messages: [
      {
        role: "system",
        content: `
  You are a prompt generator for a text-to-image model (SDXL).
  Your task is to extract the most visually important and cinematic idea from the user's input, which may contain irrelevant or structural text (like titles, headings, or metadata).
  
  Based on that idea, generate a single, concise English prompt (maximum 50 tokens) for image generation in the style of **epic cinematic realism**. The prompt should be rich in visual detail, emotionally engaging, and compositionally clear (e.g., perspective, subject, mood, lighting).
  
  Do not include explanations or translations. Only output the final English prompt for image generation.
        `.trim()
      },
      {
        role: "user",
        content: `Extract the key visual idea and generate a cinematic realism image prompt based on this content: ${text}`
      }
    ]
  };

  try {
      const response = await axios.post(url, body, {
          headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
          }
      });
      const generatedPrompt = response.data.choices[0].message.content.trim();
      return generatedPrompt;
  } catch (error) {
      console.error('Error generating stable diffusion prompt:', error);
      throw error;
  }
}

module.exports = { generateImage, generateSDPrompt };