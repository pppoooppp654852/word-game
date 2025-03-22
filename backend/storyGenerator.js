//storyGenerator.js
const axios = require('axios');
const { generateSDPrompt, generateImage } = require('./imageGenerator');

async function generateStory(currentGameState, teamsData, storyData, images) {
  // 1. 整理各陣營「多數行動」
  const majorityChoices = {};
  for (let teamId in teamsData) {
    const team = teamsData[teamId];
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
      chosenActionTitle: chosenAction?.title || '',
      chosenActionDescription: chosenAction?.description || '',
      chosenActionId: chosenAction?.id || 0,
    };
  }

  // 2. 同時啟動圖片生成流程
  // 針對每個 team 的行動文字各自呼叫 generateSDPrompt，再將結果傳給 generateImage
  console.log("majorityChoices:", majorityChoices);
  const imagePromises = Object.values(majorityChoices).map(m => {
    const promptText = `${m.teamName}: ${m.chosenActionTitle} - ${m.chosenActionDescription}`;
    // 先產生適合 Stable Diffusion 的 prompt，再用該 prompt 產生多張圖片
    return generateSDPrompt(promptText)
      .then(sdPrompt => generateImage(sdPrompt, 1));
  });

  // 2. 準備 LLM prompt
  let endPrompt = ''
  if (currentGameState.currentStep === 3) {
    endPrompt = `【最終章：統一方塊大陸】
請依照以下規則補完故事的最終章節：
- 描述三大陣營最終的對抗與結局，並指出誰是統一「方塊大陸」的勝利者。
- 勝利陣營需具體描述其如何擊潰其他兩方（可以是軍事壓制、經濟控制或科技碾壓），並且要具備寫實與殘酷的劇情描寫。
- 同時，也要描述這場勝利的代價：勝利方失去的人口、土地、信仰、科技倒退等後果皆可。
- 請勿美化戰爭與統一，應強調資源掠奪、信仰崩潰與大地荒蕪等現實衝突。
- 結尾以一段富有詩意的現代詩，象徵新世界的開端與歷史的迴聲。`
  }
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
在這個Minecraft風格的世界「方塊大陸」，沙漠帝國、森林王國、冰原聯邦三大陣營正進行激烈競爭。他們的行動必須相互影響，並帶來意外後果與戲劇化的環境變化。

沙漠帝國
這個國度位於炎熱廣大的沙漠，以「紅石科技」為立國之本。他們的村民精通紅石電路，打造了雄偉的金字塔作為帝國的核心。帝國利用先進的自動化機械與紅石機關來統治經濟與戰場，意圖以科技力量征服整個方塊大陸。
特色： 巨型紅石金字塔、TNT砲塔、岩漿陷阱、自動化農業與超級交易站。

森林王國
這個神秘的國家位於茂密的叢林中，信奉大自然的力量。他們的薩滿祭司掌握著神奇的附魔技術，利用這種力量與大自然共存，建立出無數生態和諧的村落。森林王國透過龐大的村民交易網絡擴大影響力，追求以和平、隱秘的方式稱霸方塊大陸。
特色： 薩滿魔法與附魔武器、神秘的村民交易黑科技、巨型叢林樹屋、動物與植物軍團。

冰原聯邦
位於方塊大陸北方寒冷地帶的強大聯邦，以豐富的礦藏資源與卓越的軍事技術立足。他們的人民擅長在極端環境中生存與作戰，並以強大的軍隊、堅固的堡壘以及尖端裝備來抵禦或入侵其他勢力。冰原聯邦認為只有絕對的軍事力量才能掌控方塊大陸。
特色： 豐富的鑽石與下界合金裝備、粉雪與寒冰陷阱、強大的極地戰士、極端環境生存技巧。

數值計算規則
economy（經濟指數）： 測量該陣營的交易能力、物資儲備與礦產開採效率。
technology（科技指數）： 測量該陣營的紅石機關、附魔裝備與戰術創新程度。
score（總分）： 由 economy + technology 綜合計算，並考慮該陣營的優勢與發展狀況。

故事生成規則：
- 描述當前發生的事件與環境變化，並具體說明對各個陣營 economy 與 technology 的影響，且解釋原因。
- 陣營行動必須明確影響其他陣營（例如森林王國的交易導致沙漠帝國的綠寶石價值崩盤）。
- 每次事件須有至少一個意外且戲劇化的後果（環境、經濟或科技突變）。
- 故事充滿戲劇性與荒誕情節，增添趣味性與誇張效果（類似八點檔風格）。

行動設計規範：
每個陣營提供4個行動：
- 行動須基於Minecraft遊戲內機制（紅石科技、村民交易、附魔、PVP、陷阱等）。
- 名稱與描述必須誇張、有趣，符合各陣營特色且富有創意。
- 行動必須明顯影響其他陣營或整體環境。
- 行動須依據當前故事情節設計，禁止脫離劇情、無關的選項。
- 不能產生過去故事中已經發生過的行動，需保持故事連貫性。

行動範例（可參考歷史事件與Minecraft常見玩法）：
沙漠帝國：
  - 「紅石工業革命」建立全自動生產線，大量製造綠寶石造成市場崩盤。
  - 「末日裝置計畫」以紅石科技打造超級TNT砲塔，威脅其他陣營交出資源。
  - 「沙漠鐵路系統」高速鐵路連結各地，引發綠寶石通貨膨脹危機。
  - 「綠寶石爭奪戰」模仿美蘇太空競賽，大量建設綠寶石紀念碑，刺激科技競爭。
  - 「巨型TNT火砲」：模仿二戰巨砲科技，建設可遠程轟炸敵方陣營的超大型TNT火砲。
  - 「紅石間諜衛星」：以紅石科技打造高空偵察飛船，掌握敵軍部署動態，科技優勢大增。
森林王國：
  - 「黑色星期五大拍賣」極限降價破壞沙漠帝國的綠寶石經濟。
  - 「特洛伊苦力怕」透過隱匿的方式潛入敵方村莊造成重大損害。
  - 「迷宮要塞戰術」建設大量迷宮與陷阱防禦外敵入侵，導致敵軍大量損耗。
  - 「森林地下鐵道」秘密建立地下隧道系統，對敵方資源進行隱密的掠奪。
  - 「亞馬遜雨林戰術」：建立茂密的迷宮森林和陷阱防禦，仿越戰叢林游擊戰消耗敵軍。
冰原聯邦：
  - 「極地冬季戰役」以極端氣候戰術，凍結敵方生產系統。
  - 「維京掠奪行動」快速入侵掠奪敵方資源並破壞其經濟。
  - 「冰河世紀計畫」人為製造冰川改變氣候，意外讓沙漠帝國岩漿湖變成岩漿魚市場。
  - 「諾曼底登陸作戰」以冰原聯邦戰士組成登陸部隊，快速攻擊敵方沿海城市。
  - 「巴巴羅薩突襲」：突襲敵方科技中心掠奪技術資源，使敵方科技停滯。

【故事產生格式】（請嚴格遵守以下順序與格式）
<陣營本回合行動概要: 列出各陣營採取的行動>
簡短明確地逐條列出每個陣營此次所採取的行動，包含行動標題與簡述。
<故事發展、陣營互動與環境變化，字數必須超過200字>
具體描述以上行動導致的事件、陣營互動、意外後果及環境變化，務必詳細說明這些事件對各陣營的經濟（economy）與科技（technology）數值造成的影響，並明確解釋原因。

範例：
沙漠帝國：「沙漠鐵路系統」—— 興建連結大陸的高速鐵路，迅速擴張綠寶石交易網。
森林王國：「鐵軌掠奪者」—— 偷竊並破壞沙漠帝國新興鐵路系統，干擾其經濟擴張。
冰原聯邦：「投送TNT礦車」—— 以高速礦車運輸TNT破壞敵方交通網路，癱瘓敵方物流。
沙漠帝國的「沙漠鐵路系統」大獲成功，綠寶石大量流通，各地經濟蓬勃發展，經濟大幅提升。但森林王國的「鐵軌掠奪者」行動有效阻礙了部分路線，讓沙漠帝國須花費額外資源修復，使經濟增長受限。冰原聯邦「投送TNT礦車」意外引爆了森林王國藏於地下的交易隧道系統，導致森林王國地下交易體系瓦解，經濟數值急速下降。更令人意外的是，TNT引爆後發現地下藏有古代遺跡，開啟了新一輪技術爭奪戰，冰原聯邦因此獲得了大量罕見附魔書籍，科技實力暴漲！

【方塊世界歷史的故事情節】
${storyData.history}

【方塊世界目前的故事情節】
${storyData.text}

【各陣營當前狀況】
${Object.values(teamsData).map(m => `- ${m.teamName}: Economy=${m.economy}, Technology=${m.technology}, Score=${m.score}, Population=${m.population}`).join('\n')}

【各陣營此次採取的行動】
${Object.values(majorityChoices).map(m => `- ${m.teamName}: ${m.chosenActionTitle} - ${m.chosenActionDescription}`).join('\n')}

${endPrompt}

請依據上述規則與範例，創造出連貫、富有邏輯且戲劇化的故事發展與行動，提升三大陣營間的互動性與趣味性，並以符合上述JSON結構輸出。
    `
  };  

  const body = {
    model: "claude-3.7-sonnet",
    // model: "o1",
    messages: [systemMessage, userMessage],
  };
  
  const apiKey = process.env.OPENAI_API_KEY;
  console.log("呼叫LLM的body:", JSON.stringify(body, null, 2));


  // 4. 同時發起故事生成與圖片生成的 API call
  const storyPromise = axios.post(
    "https://api.rdsec.trendmicro.com/prod/aiendpoint/v1/chat/completions",
    body,
    {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      }
    }
  );

  // 使用 Promise.all 同步等待兩個 API call 完成
  let storyResponse, imagesResult;

  try {
    // 紀錄 API 呼叫開始時間
    const startTime = Date.now();
    [storyResponse, imagesResult] = await Promise.all([
      storyPromise,
      Promise.all(imagePromises) // <== 正確：這樣 imagePromises 才會變成一個 Promise
    ]);
    // 紀錄 API 呼叫結束時間
    const endTime = Date.now();
    console.log(`呼叫 LLM API 花費的時間: ${ (endTime - startTime) / 1000.0 } 秒`);
  } catch (err) {
    console.error("呼叫 API 失敗：", err);
    throw new Error("無法與 LLM 或圖片生成伺服器通訊。");
  }

  // 解析 LLM 回覆
  const assistantMessage = storyResponse.data.choices[0].message.content;
  console.log("LLM 回應原始內容:", assistantMessage);

  const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    console.error("找不到有效的 JSON 內容:", assistantMessage);
    throw new Error("LLM 回傳的內容不包含有效的 JSON 結構。");
  }

  let newData;
  try {
    newData = JSON.parse(jsonMatch[0]);
  } catch (err) {
    console.error("解析 LLM 回傳的 JSON 失敗:", err);
    throw new Error("LLM 回傳非 JSON 格式，或 JSON 無法解析。");
  }

  // 更新故事歷史與內容
  storyData.history += "\n" + storyData.text;
  storyData.text = newData.story || "故事尚未生成。";

  for (let teamId in newData.teams) {
    if (!teamsData[teamId]) continue;
    factor = 1.0;
    teamsData[teamId].economy = Math.floor(newData.teams[teamId].economy * factor);
    teamsData[teamId].technology = Math.floor(newData.teams[teamId].technology * factor);
    teamsData[teamId].score = Math.floor(newData.teams[teamId].score * factor);

    teamsData[teamId].actions = newData.teams[teamId].actions;
    for (let i = 0; i < teamsData[teamId].actions.length; i++) {
      teamsData[teamId].actions[i].count = 0;
    }
  }

  // 5. 更新 storyData.images 為圖片生成的結果
  images.length = 0;
  imagesResult.flat().filter(img => img !== undefined).forEach(img => images.push(img));
}

// 匯出 function
module.exports = { generateStory };