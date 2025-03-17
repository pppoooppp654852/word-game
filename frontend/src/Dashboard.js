import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';


function Dashboard() {
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});
  const [storyData, setStoryData] = useState({ text: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const socket = io('http://localhost:3001');
    socket.on('connect', () => {
      console.log('Dashboard connected to server via Socket.IO');
    });
    socket.on('gameStateUpdated', (data) => {
      console.log('Received gameStateUpdated', data);
      if (data.currentGameState != undefined) {
        setGameState(data.currentGameState);
      }
      if (data.teamsData !== undefined) {
        setTeamsData(data.teamsData);
      }
      if (data.storyData !== undefined) {
        setStoryData(data.storyData);
      }
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  // 「下一步」按鈕的事件處理
  const handleNextStep = () => {
    if (gameState?.status === 'generating') {
      setIsGenerating(true);
    }
    fetch('http://localhost:3001/next-step', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        // 這裡可自行決定要不要做任何 UI 呈現
        // 若後端執行成功，socket.io 也會自動推給前端最新的 gameState
        console.log('next-step API 回應：', data);
        if (isGenerating === true) {
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Error calling /next-step:', err);
      });
  };


  return (
    <div style={{ margin: '20px' }}>
      <h1>Minecraft峽谷</h1>

      <h2>故事進展</h2>
      <p>{storyData.text}</p>

      <div>
        {gameState?.status === 'voting' ? <h2>目前回合：{gameState.currentStep}</h2> : null}
        <h2>遊戲狀態：{gameState?.text}</h2>
      </div>
      

      <h2>陣營狀態</h2>
      {teamsData && Object.keys(teamsData).length > 0 ? (
        <ul>
          {gameState?.status === 'waiting-team' &&
          (
            // 顯示各陣營的基本資訊
            Object.entries(teamsData).map(([teamId, teamInfo]) => (
              <li key={teamId}>
                <strong>{teamInfo.teamName}</strong> - 
                人口: {teamInfo.population}
              </li>
            ))
          )}
          {gameState?.status === 'voting' && (
            // 顯示投票情況
            Object.entries(teamsData).map(([teamId, teamInfo]) => (
              <li key={teamId}>
                <li key={teamId}>
                <strong>{teamInfo.teamName}</strong> - 
                  人口: {teamInfo.population} - 
                  經濟: {teamInfo.economy} - 
                  科技: {teamInfo.technology} - 
                  分數: {teamInfo.score}
                </li>
                <ul>
                  {teamInfo.actions.map((action) => (
                    <li key={action.id}>
                      {action.text} - 目前票數: {action.count}
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}
          {gameState?.status === 'generating' && isGenerating === false && (
            // 顯示生成後的資訊
            Object.entries(teamsData).map(([teamId, teamInfo]) => (
              <li key={teamId}>
                <li key={teamId}>
                <strong>{teamInfo.teamName}</strong> - 
                  人口: {teamInfo.population} - 
                  經濟: {teamInfo.economy} - 
                  科技: {teamInfo.technology} - 
                  分數: {teamInfo.score}
                </li>
                <ul>
                  {teamInfo.actions.map((action) => (
                    <li key={action.id}>
                      {action.text} - 目前票數: {action.count}
                    </li>
                  ))}
                </ul>
              </li>
            ))
          )}

        </ul>
      ) : (
        <p>無法取得陣營資料</p>
      )}
      
      <button onClick={handleNextStep}>下一步</button>
    </div>
  );
}

export default Dashboard;
