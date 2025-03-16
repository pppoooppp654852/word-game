import React, { useState, useEffect } from 'react';

const statusWording = {
  waiting: '等待主持人下一步',
  voting: '請為你的陣營選擇行動',
  // 其他狀態可以持續擴充
};

function Dashboard() {
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});

  useEffect(() => {
    
  }, []);


  return (
    <div style={{ margin: '20px' }}>
      <h1>Minecraft峽谷</h1>

      <div>
        <h2>目前回合：{gameState?.currentStep || '無資料'}</h2>
        <p>遊戲狀態：{statusWording[gameState?.status] || gameState?.status}</p>
      </div>

      <h2>陣營狀態</h2>
      {teamsData && Object.keys(teamsData).length > 0 ? (
        <ul>
          {Object.entries(teamsData).map(([teamId, teamInfo]) => (
            <li key={teamId}>
              <strong>{teamInfo.name}</strong> - 分數: {teamInfo.score} | 科技值: {teamInfo.tech}
            </li>
          ))}
        </ul>
      ) : (
        <p>尚無陣營資料</p>
      )}
    </div>
  );
}

export default Dashboard;
