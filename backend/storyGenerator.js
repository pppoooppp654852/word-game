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
              {"id": 0, "title": "...", "description": "...", "count": 0},
              {"id": 1, "title": "...", "description": "...", "count": 0},
              {"id": 2, "title": "...", "description": "...", "count": 0},
              {"id": 3, "title": "...", "description": "...", "count": 0}
            ]
          },
          "2": { ... },
          "3": { ... },
        }
      }
      請確保 JSON 可以被 JSON.parse() 正確解析，不能包含多餘注釋或前後缀，不能有額外欄位。
    `
  };

  const userMessage = {
    role: 'user',
    content: `
    世界觀設定:
    在這個充滿 Minecraft 風格的世界「方塊大陸」中，三大陣營在政治、經濟與文化上激烈競爭。每個陣營都有自己獨特的戰略、技術和建築風格，並利用 Minecraft 世界中的特殊機制來稱霸這片大陸。

    沙漠帝國（燒熾之邦）🔥

    這是一個以「紅石科技」為核心的強權國度，他們利用紅石機關與自動化機械來支配經濟與戰爭。
    特色： 精通 TNT 砲塔、岩漿陷阱、自動農場、超級交易站。
    目標： 透過「無限綠寶石交易」與「紅石軍械」統治方塊大陸！
    森林王國（綠蔭之庭）🌲

    這是一個擅長「村民交易、自然建築、隱秘戰術」的陣營，他們建立無數村莊來擴大經濟影響力。
    特色： 精通 村民交易黑科技、巨樹建築、動物軍團。
    目標： 透過「交易壟斷」與「隱匿式戰術」掌控大陸的資源流動！
    冰原聯邦（霜寒之盟）❄️

    這是一個來自極地的戰鬥民族，他們擁有最強的戰士與極端生存技術，並以掠奪、極寒陷阱和強大裝備制霸大陸。
    特色： 精通 下界合金裝備、粉雪陷阱、極端生存技巧。
    目標： 透過「武力鎮壓」與「資源獨佔」確保自己不被任何人挑戰！
    數值計算規則
    economy（經濟指數）： 測量該陣營的交易能力、物資儲備與礦產開採效率。
    technology（科技指數）： 測量該陣營的紅石機關、附魔裝備與戰術創新程度。
    score（總分）： 由 economy + technology 綜合計算，並考慮該陣營的優勢與發展狀況。
    行動設計（actions）
    每個陣營可選擇 4 種獨特行動，這些行動必須：

    符合 Minecraft 世界觀（使用遊戲內機制，如紅石、交易、PVP、附魔等）。
    誇張、有趣、帶有戲劇性（例如「狼群戰術」「召喚苦力怕軍團」「紅石自動挖礦機」）。
    符合陣營風格（如沙漠帝國應更科技導向、森林王國應專注交易與建築、冰原聯邦應偏向戰爭與資源壟斷）。
    舉例
    🔥 沙漠帝國

    「紅石機械奇蹟」 - 建立超級自動農場，每分鐘產出 1000 顆綠寶石，顛覆市場！
    「苦力怕襲擊計畫」 - 訓練一批帶有隱身藥水的苦力怕，潛入敵國首都並引爆！
    🌲 森林王國

    「無限交易帝國」 - 訓練村民進行無限降價，讓所有裝備幾乎免費，讓敵人無法競爭！
    「地圖誤導戰術」 - 透過繪製假地圖，欺騙敵人開採錯誤區域的礦產！
    ❄️ 冰原聯邦

    「冰封大陸計畫」 - 對敵方施放超級寒霜詛咒，讓他們的水源全部凍結，無法耕種！
    「終界龍獵殺行動」 - 發起對終界龍的屠殺計畫，獨佔所有龍息與紫色寶石，確保科技領先！

    【世界目前的故事情節】
    ${storyData.text}

    【各陣營此次多數決行動】
    ${Object.values(majorityChoices).map(m => `- ${m.teamName}: ${m.chosenActionText}`).join('\n')}
    
    請生成 JSON，確保所有內容符合上述要求，並讓內容更加戲劇化、荒誕離奇，讓三大陣營的競爭變得史詩級精彩！
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