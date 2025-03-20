class Team {
    constructor(id, teamName, description, economy, technology, score, actions, population=0) {
      this.id = id;
      this.teamName = teamName;
      this.description = description;
      this.economy = economy;
      this.technology = technology;
      this.score = score;
      this.actions = actions;
      this.population = population;
    }
}

// 初始化四大陣營
const teamsData = {
  1: new Team(
    1,
    '沙漠帝國',
    '他們掌握紅石科技，建造雄偉的金字塔與強大的自動機械。帝國野心勃勃，試圖以科技之力征服方塊大陸。',
    85,
    95,
    100,
    [
      {
        "id": 0,
        "title": "紅石機械奇蹟",
        "description": "這個國度位於炎熱廣大的沙漠，以「紅石科技」為立國之本。他們的村民精通紅石電路，打造了雄偉的金字塔作為帝國的核心。帝國利用先進的自動化機械與紅石機關來統治經濟與戰場，意圖以科技力量征服整個方塊大陸。",
        "count": 1
      },
      {
        "id": 1,
        "title": "岩漿防禦長城",
        "description": "在邊境建造巨型岩漿護城河，任何膽敢進犯沙漠帝國的敵人都將被滾燙的岩漿吞噬！",
        "count": 0
      },
      {
        "id": 2,
        "title": "召喚苦力怕軍團",
        "description": "秘密培養一支忠誠的苦力怕軍團，潛入敵方領土，在關鍵時刻引爆，讓競爭對手的建築灰飛煙滅！",
        "count": 0
      },
      {
        "id": 3,
        "title": "終界珍珠快遞",
        "description": "設立全球首家『終界珍珠快遞服務』，讓重要物資能在瞬間傳送到遠方市場，提高交易速度！",
        "count": 0
      }
    ],
    population = 25
  ),
  2: new Team(
    2,
    '森林王國',
    '他們以薩滿魔法和附魔技術，建立遍佈叢林的貿易村落。王國相信自然與和平才是統治大陸的最佳方式。',
    90,
    80,
    100,
    [
      {
        "id": 0,
        "title": "無限交易帝國",
        "description": "透過精心培育的村民交易鏈，實現『無限降價戰略』，讓所有裝備幾乎免費，壟斷市場！",
        "count": 0
      },
      {
        "id": 1,
        "title": "巨樹建築復興計劃",
        "description": "在世界各地種植巨型橡樹，建造宛如天空之城的森林要塞，震懾所有敵對勢力！",
        "count": 1
      },
      {
        "id": 2,
        "title": "狼群侵略戰術",
        "description": "秘密訓練一支由狼群組成的特攻隊，突襲敵方村莊，使其交易系統陷入混亂！",
        "count": 0
      },
      {
        "id": 3,
        "title": "地圖製作霸權",
        "description": "發動最強製圖師聯盟，將敵方領土標記為『這裡沒有鑽石』，誤導敵人開採資源！",
        "count": 0
      }
    ],
    population = 30
  ),
  3: new Team(
    3,
    '冰原聯邦',
    '他們依靠豐富的礦藏與軍事力量，在冰天雪地中建起堅固堡壘。聯邦認為只有絕對的武力才能掌控方塊大陸的未來。',
    75,
    100,
    100,
    [
      {
        "id": 0,
        "title": "極寒戰士訓練",
        "description": "對戰士進行最嚴苛的冰原訓練，只有能在零下環境中挖掘下界合金的勇者才能晉升為精英戰士！",
        "count": 1
      },
      {
        "id": 1,
        "title": "冰霜陷阱戰術",
        "description": "在敵軍通往冰原的路上秘密佈置『粉雪陷阱』，讓所有敵軍瞬間陷入冰凍深淵！",
        "count": 0
      },
      {
        "id": 2,
        "title": "末影龍頭骨收藏",
        "description": "發起大規模的終界龍狩獵行動，將敵人尚未討伐的終界龍一舉清空，讓我們獨占龍息資源！",
        "count": 0
      },
      {
        "id": 3,
        "title": "冰封大陸計劃",
        "description": "動用最強法術，使敵方的水源全部凍結，迫使他們無法繼續釀造藥水或種植農作物！",
        "count": 0
      }
    ],
    population = 22
  ),
};
  
module.exports = teamsData;
  