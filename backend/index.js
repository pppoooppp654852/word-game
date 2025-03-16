// backend/index.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const app = express();
const port = process.env.PORT || 3001;

// 匯入四個陣營資料
const teamsData = require('./data/teamData.js');

// 啟用 CORS & 解析 JSON body
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// 你原本的遊戲流程控制變數 (可保留)
let gameState = {
  currentStep: 1,
  status: 'waiting'
};

let logData = [];

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
    gameState,
  });
});

// 接收玩家選擇的陣營
app.post('/choose-team', (req, res) => {
  const { teamId } = req.body;
  if (!teamsData[teamId]) {
    return res.status(400).json({ status: 'FAIL', message: '無效的 teamId' });
  }

  // console.log('User chose teamId:', teamId);
  return res.json({ status: 'OK' });
});

app.post('/submit-choice', (req, res) => {
  const { teamId, choice } = req.body;

  // 驗證 teamId
  if (!teamsData[teamId]) {
    return res.status(400).json({ status: 'FAIL', message: '無效的 teamId' });
  }
  console.log('User chose teamId:', teamId, 'and choice:', choice);
  return res.json({ status: 'OK' });
});

app.post('/next-step', (req, res) => {
  gameState.currentStep += 1;
  gameState.status = 'VOTING';

  //... 進行其他遊戲流程控制
  // 1. 將各陣營選項傳送至LLM，返回下一回合world description
  // 2. 根據目前world description，生成各陣營的選項
  // 3. 將各陣營的選項傳送至前端

  console.log('Game step updated:', gameState.currentStep);
  return res.json({ status: 'OK', gameState });
});

// 讓 React 進行路由處理 (SPA)
// 這樣直接打開 `/` 會顯示 React 頁面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Backend server is running on http://localhost:${port}`);
});
