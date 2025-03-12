import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});

  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = () => {
    fetch('http://localhost:3001/game-state')
      .then((res) => res.json())
      .then((data) => {
        setGameState(data.gameState);
        setTeamsData(data.teamsData);
      })
      .catch((err) => console.error('Error:', err));
  };

  return (
    <div style={{ margin: '20px' }}>
      <h1>Minecraft峽谷</h1>

      <div>
        <h2>目前回合：{gameState?.currentStep || '無資料'}</h2>
        <p>狀態：{gameState?.status || '無資料'}</p>
        <button onClick={handleRefresh}>刷新狀態</button>
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
