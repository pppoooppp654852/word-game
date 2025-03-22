// Dashboard.js
import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import ImageCarousel from './ImageCarousel';
import { Box, Grid, Typography, Button, CircularProgress } from '@mui/material';


function Dashboard() {
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});
  const [storyData, setStoryData] = useState({ text: '' });
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState([]);

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
      if (data.images !== undefined) {
        setImages(data.images);
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

  const renderStoryText = () => {
    return storyData.text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        <br />
      </React.Fragment>
    ));
  };


  return (
    <Box
      sx={{
        width: '1920px',
        height: '1080px',
        margin: '0 auto',           // 置中 (若容器比螢幕大，就不會顯示 scroll bar)
        overflow: 'clip',         // 隱藏捲軸
        position: 'relative',
        backgroundColor: '#111',    // 若背景圖片沒載入時的備用色
        // 加入背景圖片 (低透明度可用 opacity，也可以改用 overlay)
        backgroundImage: `url('/background/background.webp')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        opacity: 0.85,               // 若想要背景本身帶點透明，可直接調整
      }}
    >

      {/* 前景主要內容：使用一個 Grid 來做排版 */}
      <Grid
        container
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          color: '#fff', // 文字顏色
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
        }}
      >
        {/* 左側：故事進展 */}
        <Grid item xs={5} sx={{ padding: 2, overflow: 'hidden', height: '50%' }}>
          <Typography variant="h3" gutterBottom sx={{ marginTop: 5 }}>
            方塊文明
          </Typography>

          <Typography variant="body1">{renderStoryText()}</Typography>
        </Grid>

        {/* 右側：ImageCarousel */}
        <Grid item xs={6} sx={{ padding: 2, display: 'flex', height: '50%' }}>
          <Box
            sx={{
              flexGrow: 1,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ImageCarousel images={images} />
          </Box>
        </Grid>
        
        {/* 下方：顯示遊戲狀態 & 隊伍狀態 */}
        <Grid item xs={10} sx={{ padding: 2, marginTop: 0, height: '50%', zIndex: 1 }}>
          <Typography variant="h5" gutterBottom>
            {gameState?.status === 'voting' && `目前時代：${gameState.currentStep}`}
          </Typography>

          <Typography variant="h4" gutterBottom>
            遊戲狀態：
            {gameState?.status === 'waiting' && gameState?.text}
            {gameState?.status === 'voting' && gameState?.text}
            {gameState?.status === 'generating' && isGenerating && (
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <CircularProgress size={30} sx={{ marginRight: '10px' }} />
                等待世界的改變...
              </span>
            )}
            {gameState?.status === 'generating' && !isGenerating && '世界已經改變，即將開始下一輪投票'}
          </Typography>

          {/* 顯示隊伍資訊 */}
          {teamsData && Object.keys(teamsData).length > 0 ? (
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'row',
                gap: 2,
                flexWrap: 'wrap',
                justifyContent: 'flex-start',
                padding: 1,
              }}
            >
              {gameState?.status === 'waiting' &&
                Object.entries(teamsData).map(([teamId, teamInfo]) => (
                  <Box
                    key={teamId}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      padding: 2,
                      minWidth: '250px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    <strong>{teamInfo.teamName}</strong> - 人口: {teamInfo.population}
                  </Box>
                ))
              }
              {gameState?.status === 'voting' &&
                Object.entries(teamsData).map(([teamId, teamInfo]) => (
                  <Box
                    key={teamId}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      padding: 2,
                      minWidth: '250px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    }}
                  >
                    <strong>{teamInfo.teamName}</strong> - 人口: {teamInfo.population} - 經濟: {teamInfo.economy} - 科技: {teamInfo.technology} - 分數: {teamInfo.score}
                    <Box component="ul" sx={{ listStyleType: 'none', p: 0, m: 0 }}>
                      {teamInfo.actions.map((action) => (
                        <li key={action.id}>
                          {action.title} - 目前票數: {action.count}
                        </li>
                      ))}
                    </Box>
                  </Box>
                ))
              }
              {gameState?.status === 'generating' && isGenerating === false &&
                Object.entries(teamsData).map(([teamId, teamInfo]) => (
                  <Box
                    key={teamId}
                    sx={{
                      border: '1px solid #ccc',
                      borderRadius: 1,
                      padding: 2,
                      minWidth: '250px',
                      textAlign: 'center',
                    }}
                  >
                    <strong>{teamInfo.teamName}</strong> - 人口: {teamInfo.population} - 經濟: {teamInfo.economy} - 科技: {teamInfo.technology} - 分數: {teamInfo.score}
                    <Box component="ul" sx={{ listStyleType: 'none', p: 0, m: 0 }}>
                      {teamInfo.actions.map((action) => (
                        <li key={action.id}>
                          {action.text} - 目前票數: {action.count}
                        </li>
                      ))}
                    </Box>
                  </Box>
                ))
              }
            </Box>
          ) : (
            <p>無法取得陣營資料</p>
          )}

          {/* 按鈕區塊 */}
          <Box sx={{ marginTop: 2 }}>
            <Button variant="contained" color="primary" onClick={handleNextStep} sx={{ marginRight: 2 }}>
              下一步
            </Button>
            <Button variant="contained" color="secondary" onClick={handleResetData}>
              重置狀態
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}


export default Dashboard;
