// backend/index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios'); 
const { generateNextStoryAndUpdate } = require('./storyGenerator');
const gameStateConfigs = require('./data/gameStateConfigs.js');

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
  socket.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

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

  console.log('User chose teamId:', teamId);
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
    while (true) {
      try {
        console.log('呼叫 LLM 生成新故事中...');
        await generateNextStoryAndUpdate(teamsData, storyData);
        // 生成成功後，更新遊戲狀態
        currentGameState.status = 'voting';
        currentGameState.text = gameStateConfigs['voting'].text;
        currentGameState.currentStep += 1;
        console.log('新故事生成成功！');
        break;  // 生成成功，跳出迴圈
      } catch (err) {
        console.error("呼叫 LLM 失敗，重新嘗試中...", err);
      }
    }
  }
  
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

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

  console.log(teamsData)

  // 推播給所有連線中的 dashboard
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

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