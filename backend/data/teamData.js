class Team {
    constructor(id, teamName, description, economy, technology, score) {
      this.id = id;
      this.teamName = teamName;
      this.description = description;
      this.economy = economy;
      this.technology = technology;
      this.score = score;
    }
  }
  
  // 初始化四大陣營
  const teamsData = {
    1: new Team(
      1,
      'Creeper Clan',
      '神出鬼沒、行動隱密，崇尚爆炸式的策略。',
      80,
      60,
      100
    ),
    2: new Team(
      2,
      'Ender Knights',
      '來自終界的神秘騎士，擁有瞬移般的行動力。',
      70,
      65,
      100
    ),
    3: new Team(
      3,
      'Nether Nomads',
      '在地獄地形中崛起的游牧民族，以火焰和熔岩為盟友。',
      60,
      50,
      100
    ),
    4: new Team(
      4,
      'Redstone Rebels',
      '精通紅石科技的革命陣營，擅長機關與自動化。',
      90,
      80,
      100
    ),
  };
  
  module.exports = teamsData;
  