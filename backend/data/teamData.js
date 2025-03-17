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
      '烈焰軍團',
      '烈焰軍團起源於下界（Nether），他們的祖先是古老的烈焰人（Blaze）與人類的混血後代。這群強者長年生活在炙熱的環境中，擁有極高的耐熱性與強大的戰鬥技巧。他們信奉烈焰神，並相信唯有透過火焰的洗禮才能讓世界蛻變成真正的強者之地。他們以岩漿城堡（Lava Citadel）為根據地，擅長煉金、火焰法術與攻城戰術。',
      80,
      60,
      100,
      [
        {id: 0, text: '火焰進攻 🔥：集結軍團對蒼翠王國發動猛烈攻擊，試圖摧毀他們的防禦工事。', count: 25},
        {id: 1, text: '強化城池 🏰：利用地獄岩與熔岩加強防禦工事，讓敵人難以攻破。', count: 0},
        {id: 2, text: '召喚火焰元素 🔮：施展強大儀式，召喚強大的火焰元素來增援戰場。', count: 0},
        {id: 3, text: '間諜滲透 🕵️：派遣潛伏者滲透敵軍，探查他們的弱點與戰略。', count: 0}
      ],
      population = 25
    ),
    2: new Team(
      2,
      '蒼翠王國',
      '蒼翠王國是一個依靠水與自然生存的文明，位於一片廣闊的森林與湖泊之間。這裡的居民與海豚、海龜、甚至守護者（Guardian）建立了深厚的關係。他們認為水是生命的源泉，信仰水神並堅信和諧與平衡的重要性。他們的首都 水晶宮殿（Crystal Palace） 是一座漂浮於湖泊上的城市，以水元素魔法作為主要防禦手段。',
      70,
      65,
      100,
      [
        {id: 0, text: '召喚暴風雨 ⛈️：透過水元素魔法召喚一場暴風雨，影響敵軍的視野與行動力。', count: 0},
        {id: 1, text: '水牆防禦 🛡️：在王國四周升起巨大的水牆，防止敵人入侵。', count: 0},
        {id: 2, text: '海怪襲擊 🐙：釋放海怪攻擊敵方的戰艦或邊境據點。', count: 30},
        {id: 3, text: '貿易談判 💰：與幽影聯盟進行交易，以換取更多附魔裝備與資源。', count: 0}
      ],
      population = 30
    ),
    3: new Team(
      3,
      '石拳部族',
      '石拳部族的祖先是來自深山與地底的矮人、掘地獸人（Driller Orcs）、以及流浪的鐵魔像（Iron Golems）。他們以地底資源為生，鑄造了全世界最堅固的防禦工事。他們相信唯有鐵與石的意志才能帶來真正的安全，因此，他們對於任何形式的魔法與元素都持懷疑態度。他們的主城鐵壁堡壘（Ironwall Stronghold）是最難被攻破的城池之一。',
      60,
      50,
      100,
      [
        {id: 0, text: '強化防禦 🏗️：在城牆外設置自動防禦機械，防止敵人入侵。', count: 0},
        {id: 1, text: '地底伏擊 ⛏️：挖掘秘密通道，對敵軍展開突然襲擊。', count: 0},
        {id: 2, text: '軍備升級 ⚒️：強化士兵裝備，使他們擁有更高的戰力與防禦力。', count: 22},
        {id: 3, text: '礦場開採 ⛏️：開採更多資源，以支援未來的戰爭。', count: 0}
      ],
      population = 22
    ),
    4: new Team(
      4,
      '幽影聯盟',
      '幽影聯盟是一個由流亡者、刺客、與黑魔法師組成的隱密組織。他們崇尚黑暗與混亂，信仰「影之神」的意志，並利用潛行與詭計來獲取優勢。他們的據點「無形之城（Invisible City）」藏身於世界的暗影之中，除了成員外，沒有人能找到它的真正位置。',
      90,
      80,
      100,
      [
        {id: 0, text: '暗殺計畫 🗡️：派遣刺客暗殺敵方領袖或指揮官。', count: 0},
        {id: 1, text: '召喚黑霧 🌫️：施放黑霧，使敵軍視線受阻。', count: 0},
        {id: 2, text: '情報戰 📜：散播假消息，引發其他陣營之間的內鬨。', count: 0},
        {id: 3, text: '交易陰謀 💀：與任意陣營達成黑市交易，交換情報或資源。', count: 14}
      ],
      population = 14
    ),
  };
  
  module.exports = teamsData;
  