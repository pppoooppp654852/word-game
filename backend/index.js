// backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios'); 
const { generateStory } = require('./storyGenerator');
const gameStateConfigs = require('./data/gameStateConfigs.js');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允許前端連線 (React 開發環境)
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 3001;

const initialTeamsData = JSON.parse(JSON.stringify(require('./data/teamData.js')));
const initialStoryData = JSON.parse(JSON.stringify(require('./data/story.js')));

let teamsData = JSON.parse(JSON.stringify(initialTeamsData));
let storyData = JSON.parse(JSON.stringify(initialStoryData));
let currentGameState = {
  status: 'waiting',
  text: gameStateConfigs['waiting'].text,
  currentStep: 1
};

// 讀取 public/images 資料夾內所有 webp 格式的圖片，轉換為 base64 字串
function initImages() {
  let images = [];
  const imagesDir = path.join(__dirname, 'public/images');
  try {
    const imageFiles = fs.readdirSync(imagesDir);
    images = imageFiles
      .filter(file => file.endsWith('.webp'))
      .map(file => {
        const filePath = path.join(imagesDir, file);
        const imageBuffer = fs.readFileSync(filePath);
        const base64Image = imageBuffer.toString('base64');
        return `data:image/webp;base64,${base64Image}`;
      });
    console.log(`Loaded ${images.length} images.`);
  } catch (err) {
    console.error('Error reading images directory:', err);
  }
  return images;
}

// 初始化 images 陣列
let images = initImages();

// 啟用 CORS & 解析 JSON body
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ====================================
//  Socket.IO 連線事件
// ====================================
io.on('connection', (socket) => {
  console.log('A Dashboard connected:', socket.id);

  // 一連進來就先推一次最新狀態
  socket.emit('gameStateUpdated', { currentGameState, teamsData, storyData, images });

  socket.on('disconnect', () => {
    console.log('A Dashboard disconnected:', socket.id);
  });
});

// ====================================
//  API 路由
// ====================================
// (1) 取得陣營列表的 API
app.get('/teams', (req, res) => {
  const teamList = Object.entries(teamsData).map(([id, info]) => ({
    id, 
    name: info.teamName,
    description: info.description
  }));
  return res.json({ teams: teamList });
});

// 回傳遊戲狀態以及陣營資料，方便前端透過「刷新」取得最新進度
app.get('/game-state', (req, res) => {
  return res.json({
    currentGameState,
    teamsData
  });
});

// 接收玩家選擇的陣營
app.post('/choose-team', (req, res) => {
  const { teamId } = req.body;
  if (!teamsData[teamId]) {
    return res.status(400).json({ status: 'FAIL', message: '無效的 teamId' });
  }
  teamsData[teamId].population += 1;
  io.emit('gameStateUpdated', { currentGameState, teamsData });

  return res.json({ status: 'OK' });
});

// 提交行動投票
app.post('/submit-choice', (req, res) => {
  const { teamId, choice } = req.body;

  // 驗證 teamId
  if (!teamsData[teamId]) {
    return res.status(400).json({ status: 'FAIL', message: '無效的 teamId' });
  }
  teamsData[teamId].actions[choice].count += 1;
  io.emit('gameStateUpdated', { teamsData });
  return res.json({ status: 'OK' });
});

//  關鍵：下一步 (推進遊戲階段)
app.post('/next-step', async (req, res) => {

  if (currentGameState.status === 'waiting') { // 若目前為等待選擇陣營階段，則進入投票階段
    // console.log('進入投票階段...');
    currentGameState.status = 'voting';
    currentGameState.text = gameStateConfigs['voting'].text;
  }
  else if (currentGameState.status === 'voting') {   // 若目前為投票階段，則進入生成階段
    currentGameState.status = 'generating';
    currentGameState.text = gameStateConfigs['generating'].text;
    io.emit('gameStateUpdated', { currentGameState});
    
    // 2) 呼叫 LLM，依據各陣營多數投票行動來生成新的故事內容、更新陣營屬性
    attempt = 0;
    while (attempt < 5) {
      try {
        console.log('呼叫 LLM 生成新故事中...');
        await generateStory(currentGameState, teamsData, storyData, images);
        // 生成成功後，更新遊戲狀態
        currentGameState.status = 'voting';
        currentGameState.text = gameStateConfigs['voting'].text;
        currentGameState.currentStep += 1;
        console.log('新故事生成成功！');
        break;
      } catch (err) {
        console.error("呼叫 LLM 失敗，重新嘗試中...", err);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      attempt += 1;
    }
  }
  
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData, images });

  return res.json({ status: 'OK', currentGameState });
});

// 重置所有後端資料的 API
app.post('/reset-data', (req, res) => {
  teamsData = JSON.parse(JSON.stringify(initialTeamsData));
  storyData = JSON.parse(JSON.stringify(initialStoryData));
  currentGameState = {
    status: 'waiting',
    text: gameStateConfigs['waiting'].text,
    currentStep: 1
  };

  images = initImages();

  // 推播給所有連線中的 dashboard
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData, images });

  return res.json({ status: 'OK' });
});

// 讓 React 進行路由處理 (SPA)
// 這樣直接打開 `/` 會顯示 React 頁面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//  啟動server
server.listen(port, () => {
  console.log('Server running on port:' + port);
  // console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);
});