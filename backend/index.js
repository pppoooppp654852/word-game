// backend/index.js

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const axios = require('axios'); 

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
  generating: {
    status: 'generating',
    text: '根據各陣營行動，生成新的世界描述',
  }
};

let currentGameState = gameStates['waitingTeam'];

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

// ====================================
//  關鍵：下一步 (推進遊戲階段)
// ====================================
app.post('/next-step', async (req, res) => {
  currentGameState.currentStep += 1;

  if (currentGameState.status === 'waiting-team') { // 若目前為等待選擇陣營階段，則進入投票階段
    currentGameState = gameStates['voting'];
  }
  else if (currentGameState.status === 'voting') {   // 若目前為投票階段，則進入生成階段
    currentGameState.status = gameStates['generating'].status;
    currentGameState.text = gameStates['generating'].text;
    io.emit('gameStateUpdated', { currentGameState});
    
    // 2) 呼叫 LLM，依據各陣營多數投票行動來生成新的故事內容、更新陣營屬性
    try {
      await generateNextStoryAndUpdate();  
      // generateNextStoryAndUpdate 裡會把 currentGameState, teamsData, storyData 更新
      // 之後我們可選擇要不要馬上再切回 waiting-team 或 voting
      // 這邊可依遊戲設計需求做
    } catch (err) {
      console.error("呼叫 LLM 失敗：", err);
    }
  }
  
  //... 進行其他遊戲流程控制
  // 1. 將各陣營選項傳送至LLM，返回下一回合world description
  // 2. 根據目前world description，生成各陣營的選項
  // 3. 將各陣營的選項傳送至前端
  
  // 推播給所有連線中的 dashboard
  io.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

  return res.json({ status: 'OK', currentGameState });
});

// 讓 React 進行路由處理 (SPA)
// 這樣直接打開 `/` 會顯示 React 頁面
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

//  啟動server
server.listen(port, () => {
  console.log('Server running on http://localhost:' + port);
  // console.log('OpenAI API Key:', process.env.OPENAI_API_KEY);
});


async function generateNextStoryAndUpdate() {
  // 1. 先整理出各陣營「多數行動」或所有行動投票結果
  const majorityChoices = {};
  for (let teamId in teamsData) {
    const team = teamsData[teamId];
    // 找出最高 count 的 action
    let maxCount = -1;
    let chosenAction = null;
    team.actions.forEach((action) => {
      if (action.count > maxCount) {
        maxCount = action.count;
        chosenAction = action;
      }
    });
    majorityChoices[teamId] = {
      teamName: team.teamName,
      chosenActionText: chosenAction?.text || '',
      chosenActionId: chosenAction?.id || 0,
    };
  }

  // 2. 準備要給 GPT-4o 的 prompt
  //    要求它用「嚴格 JSON 格式」回傳，包含:
  //      story, teams (economy, technology, score, actions[])
  const systemMessage = {
    role: 'system',
    content: `
      你是一個劇本生成器，請務必回傳嚴格遵循以下結構的JSON：
      {
        "story": "<新的故事描述>",
        "teams": {
          "1": {
            "economy": <number>,
            "technology": <number>,
            "score": <number>,
            "actions": [
              {"id": 0, "text": "...", "count": 0},
              {"id": 1, "text": "...", "count": 0},
              {"id": 2, "text": "...", "count": 0},
              {"id": 3, "text": "...", "count": 0}
            ]
          },
          "2": { ... },
          "3": { ... },
          "4": { ... }
        }
      }
      請確保 JSON 可以被 JSON.parse() 正確解析，不能包含多餘注釋或前後缀，不能有額外欄位。
      `
  };

  // 將「目前的故事內容 + 多數決行動結果」組合成 user prompt
  const userMessage = {
    role: 'user',
    content: `
    【世界目前的故事情節】
    ${storyData.text}

    【各陣營此次多數決行動】
    ${Object.values(majorityChoices).map(m => `- ${m.teamName}: ${m.chosenActionText}`).join('\n')}

    請生成接下來的故事描述，以及四個陣營的新屬性與新一輪 action。請務必用上述要求的 JSON 格式回答！
    `
  };

  const body = {
    model: "gpt-4o",  // 你們的模型
    messages: [systemMessage, userMessage],
  };

  const apiKey = process.env.OPENAI_API_KEY;  // .env 內的金鑰

  // 3. 呼叫 LLM (GPT-4o)
  const response = await axios.post(
    "https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions",
    body,
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  // 4. 解析 LLM 回覆
  //    注意：AI Endpoint 回傳結構可能類似 openai ，我們只需要第0個 choice
  const assistantMessage = response.data.choices[0].message.content;
  console.log("LLM 回應原始內容:", assistantMessage);

  // 5. 強制使用 JSON.parse() 解析
  let newData;
  try {
    newData = JSON.parse(assistantMessage);
  } catch (err) {
    console.error("解析 LLM 回傳的 JSON 失敗:", err);
    throw new Error("LLM 回傳非 JSON 格式，或 JSON 無法解析。");
  }

  // 6. 依照新回傳資料更新 storyData 和 teamsData
  storyData.text = newData.story || storyData.text;  // 更新故事描述

  for (let teamId in newData.teams) {
    if (!teamsData[teamId]) continue; // 若 LLM 回傳了 1~4 以外id, 可略過

    // 更新數值
    teamsData[teamId].economy    = newData.teams[teamId].economy;
    teamsData[teamId].technology = newData.teams[teamId].technology;
    teamsData[teamId].score      = newData.teams[teamId].score;
    // 重設 action
    teamsData[teamId].actions    = newData.teams[teamId].actions.map(a => ({
      ...a,
      count: 0  // 初始化新回合投票數
    }));
  }

  // 7. （選擇）清除上一輪投票數
  // 如果你在 step 6 已經直接替換 actions，那現在不用再另外清除

  console.log("已更新 storyData & teamsData");
}