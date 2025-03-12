import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

function PlayerPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(Cookies.get('selectedTeam') || '');
  const [isConfirmed, setIsConfirmed] = useState(!!Cookies.get('selectedTeam')); // 判斷是否已選擇隊伍
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});

  useEffect(() => {
    // 取得隊伍列表
    fetch('http://localhost:3001/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.teams))
      .catch((err) => console.error('Error fetching teams:', err));

    // 若已選擇隊伍，則直接更新遊戲狀態
    if (isConfirmed) {
      handleRefresh();
    }
  }, [isConfirmed]);

  const handleConfirm = () => {
    fetch('http://localhost:3001/choose-team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId: selectedTeam }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'OK') {
          Cookies.set('selectedTeam', selectedTeam, { expires: 1 }); // 設置 cookie，保存 1 天
          setIsConfirmed(true);
        } else {
          alert('後端回覆失敗');
        }
      })
      .catch((err) => console.error('Error:', err));
  };

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
      <h1>小遊戲參與</h1>

      {/* 只有在還沒選擇隊伍時才顯示選單 */}
      {!isConfirmed && (
        <div>
          <p>請選擇隊伍</p>
          <select value={selectedTeam} onChange={(e) => setSelectedTeam(e.target.value)}>
            <option value="" disabled>--- 請選擇 ---</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>{team.name}</option>
            ))}
          </select>
          <button onClick={handleConfirm} disabled={!selectedTeam}>確認</button>
        </div>
      )}

      {/* 只有在選擇隊伍後才顯示遊戲資訊和刷新按鈕 */}
      {isConfirmed && (
        <div>
          <h2>目前階段：{gameState?.currentStep || '無資料'}</h2>
          <p>狀態：{gameState?.status || '無資料'}</p>
          <button onClick={handleRefresh}>刷新頁面</button>
        </div>
      )}
    </div>
  );
}

export default PlayerPage;
