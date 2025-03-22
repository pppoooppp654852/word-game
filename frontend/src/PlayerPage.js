// PlayerPage.js
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';
import { Container, Box, Paper, Typography, Button, FormControl, InputLabel, Select, MenuItem } from '@mui/material';

function PlayerPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(Cookies.get('selectedTeam') || '');
  const [isConfirmed, setIsConfirmed] = useState(!!Cookies.get('selectedTeam'));
  const [gameState, setGameState] = useState({});
  const [teamsData, setTeamsData] = useState({});
  const [selectedAction, setSelectedAction] = useState('');
  const [isSelectedAction, setIsSelectedAction] = useState(Cookies.get('actionSubmitted') === 'true');

  useEffect(() => {
    // 取得隊伍列表
    fetch('/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.teams))
      .catch((err) => console.error('Error fetching teams:', err));

    if (isConfirmed) {
      handleRefresh();
    }
  }, [isConfirmed]);

  const handleConfirmTeam = () => {
    fetch('/choose-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeam }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'OK') {
          Cookies.set('selectedTeam', selectedTeam, { expires: 1 });
          setIsConfirmed(true);
        } else {
          alert('後端回覆失敗');
        }
      })
      .catch((err) => console.error('Error:', err));
  };

  const handleRefresh = () => {
    fetch('/game-state')
      .then((res) => res.json())
      .then((data) => {
        const previousStep = Number(Cookies.get('currentStep') || 1);
        const newStep = data.currentGameState.currentStep;

        if (previousStep < newStep) {
          setSelectedAction('');
          setIsSelectedAction(false);
          Cookies.remove('actionSubmitted');
        }

        Cookies.set('currentStep', newStep, { expires: 1 });
        setGameState(data.currentGameState);
        setTeamsData(data.teamsData);

        if (data.currentGameState.status === 'generating') {
          setSelectedAction('');
          setIsSelectedAction(false);
        }
      })
      .catch((err) => console.error('Error:', err));
  };

  const handleDeleteCookies = () => {
    Cookies.remove('selectedTeam');
    Cookies.remove('actionSubmitted');
    setSelectedTeam('');
    setIsConfirmed(false);
    setSelectedAction('');
    setIsSelectedAction(false);
    alert('所有 cookie 已刪除');
  };

  const handleSubmitChoice = () => {
    fetch('/submit-choice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeam, choice: selectedAction }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'OK') {
          alert('行動提交成功');
          Cookies.set('actionSubmitted', 'true', { expires: 1 });
          setIsSelectedAction(true);
        } else {
          alert('行動提交失敗');
        }
      })
      .catch((err) => console.error('Error:', err));
  };

  const selectedTeamInfo = teams.find(team => team.id === selectedTeam);

  return (
    <Container maxWidth="sm">
      <Box sx={{ marginTop: 4, padding: 2 }}>
        <Paper elevation={3} sx={{ padding: 3 }}>
          <Typography variant="h4" align="center" gutterBottom>
            方塊文明
          </Typography>

          {!isConfirmed && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle1" gutterBottom>
                請選擇隊伍
              </Typography>
              <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                <InputLabel>--- 請選擇 ---</InputLabel>
                <Select
                  value={selectedTeam}
                  onChange={(e) => setSelectedTeam(e.target.value)}
                  label="--- 請選擇 ---"
                >
                  {teams.map((team) => (
                    <MenuItem key={team.id} value={team.id}>
                      {team.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedTeamInfo && (
                <Typography variant="body1" sx={{ mb: 2 }}>
                  隊伍描述: {selectedTeamInfo.description}
                </Typography>
              )}

              {selectedTeamInfo && (
                <Button variant="contained" onClick={handleConfirmTeam} disabled={!selectedTeam} fullWidth>
                  確認
                </Button>
              )}
            </Box>
          )}

          {isConfirmed && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                你的隊伍是: {selectedTeamInfo?.name || '無資料'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                遊戲狀態：
                {gameState?.status === 'waiting' && gameState?.text}
                {gameState?.status === 'voting' && !isSelectedAction && gameState?.text}
                {gameState?.status === 'voting' && isSelectedAction && '等待其他人選擇行動...'}
                {gameState?.status === 'generating' && '等待世界的改變...'}
              </Typography>

              {gameState?.status === 'voting' && !isSelectedAction && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle1" gutterBottom>
                    選擇你的行動：
                  </Typography>
                  <FormControl fullWidth variant="outlined" sx={{ mb: 2 }}>
                    <InputLabel>--- 請選擇行動 ---</InputLabel>
                    <Select
                      value={selectedAction}
                      onChange={(e) => setSelectedAction(e.target.value)}
                      label="--- 請選擇行動 ---"
                    >
                      {teamsData[selectedTeam]?.actions?.map((action) => (
                        <MenuItem key={action.id} value={action.id}>
                          {action.title}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    行動描述：{teamsData[selectedTeam]?.actions[selectedAction]?.description}
                  </Typography>
                  <Button variant="contained" onClick={handleSubmitChoice} disabled={selectedAction === ""} fullWidth>
                    提交行動
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {(isConfirmed &&
            (gameState?.status === 'waiting' ||
              gameState?.status === 'generating' ||
              isSelectedAction)) && (
            <Box sx={{ mt: 2 }}>
              <Button variant="outlined" onClick={handleRefresh} fullWidth>
                刷新頁面
              </Button>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Button variant="text" onClick={handleDeleteCookies} color="error" fullWidth>
              刪除所有 cookie
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}

export default PlayerPage;
