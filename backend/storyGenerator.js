//storyGenerator.js

const axios = require('axios');

async function generateNextStoryAndUpdate(currentGameState, teamsData, storyData, gameStates, io) {
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

  // 2. 準備 LLM prompt
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
    model: "gpt-4o",
    messages: [systemMessage, userMessage],
  };

  const apiKey = process.env.OPENAI_API_KEY;

  try {
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

    // 解析 LLM 回覆
    const assistantMessage = response.data.choices[0].message.content;
    console.log("LLM 回應原始內容:", assistantMessage);

    let newData;
    try {
      newData = JSON.parse(assistantMessage);
    } catch (err) {
      console.error("解析 LLM 回傳的 JSON 失敗:", err);
      throw new Error("LLM 回傳非 JSON 格式，或 JSON 無法解析。");
    }

    // 更新 storyData 和 teamsData
    storyData.text = newData.story || storyData.text;

    for (let teamId in newData.teams) {
      if (!teamsData[teamId]) continue;

      teamsData[teamId].economy = newData.teams[teamId].economy;
      teamsData[teamId].technology = newData.teams[teamId].technology;
      teamsData[teamId].score = newData.teams[teamId].score;

      teamsData[teamId].actions = newData.teams[teamId].actions.map(a => ({
        ...a,
        count: 0  // 初始化新一輪投票數
      }));
    }

    console.log("已更新 storyData & teamsData");

    // 更新遊戲狀態並通知前端
    io.emit('gameStateUpdated', { currentGameState, teamsData, storyData });

  } catch (err) {
    console.error("呼叫 LLM 失敗：", err);
    throw new Error("無法與 LLM 伺服器通訊。");
  }
}

// 匯出 function
module.exports = { generateNextStoryAndUpdate };
