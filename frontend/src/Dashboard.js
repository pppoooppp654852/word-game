// Dashboard.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';


function Dashboard() {
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});
  const [storyData, setStoryData] = useState({ text: '' });
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const socket = io('/');
    socket.on('connect', () => {
      console.log('Dashboard connected to server via Socket.IO');
    });
    socket.on('gameStateUpdated', (data) => {
      // console.log('Received gameStateUpdated');
      if (data.currentGameState !== undefined) {
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
    if (gameState?.status === 'voting') {
      setIsGenerating(true);
      console.log('Generating...');
    }
    fetch('/next-step', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        // 這裡可自行決定要不要做任何 UI 呈現
        // 若後端執行成功，socket.io 也會自動推給前端最新的 gameState
        console.log('next-step API 回應：', data);
        console.log('isGenerating:', isGenerating);
        if (gameState?.status === 'generating') {
          setIsGenerating(false);
          console.log('Generating done!');
        }
      })
      .catch((err) => {
        console.error('Error calling /next-step:', err);
      });
  };

  const handleResetData = () => {
    fetch('/reset-data', {
      method: 'POST',
    })
      .then((res) => res.json())
      .then((data) => {
        setIsGenerating(false);
        console.log('reset-data API 回應：', data);
      })
      .catch((err) => {
        console.error('Error calling /reset-data:', err);
      });
  };


  return (
    <div style={{ margin: '20px' }}>
      <h1>Minecraft峽谷</h1>

      <h2>故事進展</h2>
      <p>
        {storyData.text.split("\n").map((line, index) => (
          <React.Fragment key={index}>
            {line}
            <br />
          </React.Fragment>
        ))}
      </p>

      <div>
        {gameState?.status === 'voting' ? <h2>目前回合：{gameState.currentStep}</h2> : null}
        <h2>遊戲狀態：
            {gameState?.status === 'waiting' && gameState?.text}
            {gameState?.status === 'voting' && gameState?.text}
            {gameState?.status === 'generating' && isGenerating && '等待世界的改變...'}
            {gameState?.status === 'generating' && !isGenerating && '世界已經改變，即將開始下一輪投票'}
        </h2>
      </div>
      

      
      {teamsData && Object.keys(teamsData).length > 0 ? (
        <ul>
          {gameState?.status === 'waiting' &&
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
                      {action.title} - 目前票數: {action.count}
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
      <button onClick={handleResetData}>重置狀態</button>
    </div>
  );
}

export default Dashboard;
