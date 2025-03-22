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
      throw error;
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
You must output a single, concise, and vivid English prompt for image generation suitable for Stable Diffusion.
The generated prompt must clearly evoke a Minecraft world, explicitly mentioning recognizable Minecraft elements such as blocks, tools, mobs, structures (e.g., creepers, diamond ores, redstone, villagers, netherite armor, ender dragons).
The style does NOT need to be explicitly blocky or pixelated, but the image must unmistakably represent the Minecraft universe through its iconic elements.
Clearly specify viewpoint and visual composition to avoid 2.5D or isometric perspectives.
Do not include explanations or additional instructions, only the prompt text.
            `.trim()
        },
        {
            role: "user",
            content: `
Generate a prompt based on the following content, ensuring the resulting image clearly depicts a Minecraft-themed world through recognizable Minecraft elements. Content: ${text}
            `.trim()
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