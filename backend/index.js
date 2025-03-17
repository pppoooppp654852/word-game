// backend/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允許前端連線 (React 開發環境)
    methods: ["GET", "POST"]
  }
});
const port = process.env.PORT || 3001;

// 匯入四個陣營資料
const teamsData = require('./data/teamData.js');

// 遊戲故事情節
let storyData = {
  text: "在一片廣闊無垠的 Minecraft 世界裡，四個強大的陣營爭奪著對世界的控制權。這個世界充滿著神秘的遺跡、深不可測的地底洞窟、以及不斷變換的生態環境。每個陣營都有著獨特的文化、資源和戰略，他們之間既有合作，也有競爭，而你的選擇將影響這場大戰的走向。"
}

// 遊戲流程控制變數
let gameStates = {
  waitingTeam: {
    status: 'waiting-team',
    text: '等待玩家選擇陣營',
    currentStep: 0,
  },
  voting: {
    status: 'voting',
    text: '請為你的陣營選擇行動',
    currentStep: 1,
  },
};

let currentGameState = gameStates['waitingTeam'];

// 啟用 CORS & 解析 JSON body
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 當前端連線進來時
io.on('connection', (socket) => {
  console.log('A Dashboard connected:', socket.id);

  // 一連進來就先推一次最新狀態
  socket.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

  socket.on('disconnect', () => {
    console.log('A Dashboard disconnected:', socket.id);
  });
});

// (1) 取得陣營列表的 API (前端拿來顯示下拉選單等)
app.get('/teams', (req, res) => {
  // 這裡若只想回傳「id 與名稱」，可從 teamsData 轉成一個陣列
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

app.post('/submit-choice', (req, res) => {
  const { teamId, choice } = req.body;

  // 驗證 teamId
  if (!teamsData[teamId]) {
    return res.status(400).json({ status: 'FAIL', message: '無效的 teamId' });
  }
  console.log('User teamId:', teamId, 'and choice:', choice);
  return res.json({ status: 'OK' });
});

app.post('/next-step', (req, res) => {
  currentGameState.currentStep += 1;

  if (currentGameState.status === 'waiting-team') {
    currentGameState = gameStates['voting'];
  }

  // 推播給所有連線中的 dashboard
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

  
  //... 進行其他遊戲流程控制
  // 1. 將各陣營選項傳送至LLM，返回下一回合world description
  // 2. 根據目前world description，生成各陣營的選項
  // 3. 將各陣營的選項傳送至前端
  
  console.log('Game step updated:', currentGameState.currentStep);

  res.json({ success: true, currentGameState });
  return res.json({ status: 'OK', currentGameState });
});

// 讓 React 進行路由處理 (SPA)
// 這樣直接打開 `/` 會顯示 React 頁面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

server.listen(port, () => {
  console.log('Server running on http://localhost:' + port);
});
