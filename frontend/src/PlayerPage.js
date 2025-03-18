// PlayerPage.js
import React, { useState, useEffect } from 'react';
import Cookies from 'js-cookie';

function PlayerPage() {
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(Cookies.get('selectedTeam') || '');
  const [isConfirmed, setIsConfirmed] = useState(!!Cookies.get('selectedTeam')); // 判斷是否已選擇隊伍
  const [gameState, setGameState] = useState(null);
  const [teamsData, setTeamsData] = useState({});
  const [selectedAction, setSelectedAction] = useState('');
  const [isSelectedAction, setIsSelectedAction] = useState(false);

  useEffect(() => {
    // 取得隊伍列表
    fetch('/teams')
      .then((res) => res.json())
      .then((data) => setTeams(data.teams))
      .catch((err) => console.error('Error fetching teams:', err));

    // 若已選擇隊伍，則直接更新遊戲狀態
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
          Cookies.set('selectedTeam', selectedTeam, { expires: 1 }); // 設置 cookie，保存 1 天
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
        setGameState(data.currentGameState);
        setTeamsData(data.teamsData);
        console.log('game-state:', data);
        console.log('teamsData:', data.teamsData);
      })
      .catch((err) => console.error('Error:', err));
  };

  const handleDeleteCookies = () => {
    Cookies.remove('selectedTeam');
    setSelectedTeam('');
    setIsConfirmed(false);
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
          setIsSelectedAction(true);
        } else {
          alert('行動提交失敗');
        }
      })
      .catch((err) => console.error('Error:', err));
  };
  const selectedTeamInfo = teams.find(team => team.id === selectedTeam);

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
          
          {selectedTeamInfo && (
            <p>隊伍描述: {selectedTeamInfo.description}</p>
          )}

          {selectedTeamInfo && (<button onClick={handleConfirmTeam} disabled={!selectedTeam}>確認</button>)}
        </div>
      )}

      {/* 只有在選擇隊伍後才顯示遊戲資訊和刷新按鈕 */}
      {isConfirmed && (
        <div>
          <p> 你的隊伍是: {selectedTeamInfo?.name || '無資料'}</p>
          <p>遊戲狀態：
            {gameState?.status === 'waiting-team' && gameState?.text}
            {gameState?.status === 'voting' && !isSelectedAction && gameState?.text}
            {gameState?.status === 'voting' && isSelectedAction && '等待其他人選擇行動...'}
          </p>
          <ul>
            {/* 新增選擇行動的下拉選單 */}
            {gameState?.status === 'voting' && !isSelectedAction && (
              <li>
                <p>選擇你的行動：</p>
                <select value={selectedAction} onChange={(e) => setSelectedAction(e.target.value)}>
                  <option value="" disabled>--- 請選擇行動 ---</option>
                  {teamsData[selectedTeam]?.actions?.map((action) => (
                    <option key={action.id} value={action.id}>{action.text}</option>
                  ))}
                </select>
                <button onClick={handleSubmitChoice} disabled={!selectedAction}>提交行動</button>
              </li>
            )}
          </ul>
        </div>
      )}

      {isConfirmed && (gameState?.status === 'waiting-team' || isSelectedAction) && (
        <div>
          <button onClick={handleRefresh}>刷新頁面</button>
        </div>
      )}

      {/* 開發用的按鈕，刪除所有 cookie */}
      <button onClick={handleDeleteCookies} style={{ marginTop: '20px', backgroundColor: 'red', color: 'white' }}>
        刪除所有 cookie
      </button>
      {/* <div>this is a test message.</div> */}
    </div>
  );
}

export default PlayerPage;
