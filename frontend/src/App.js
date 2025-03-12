import React, { useState, useEffect } from 'react';

function App() {
  // 從後端取得的 team list
  const [teams, setTeams] = useState([]);
  // 使用者選擇的 teamId
  const [selectedTeam, setSelectedTeam] = useState('');
  // 是否已經送出確認
  const [isConfirmed, setIsConfirmed] = useState(false);

  useEffect(() => {
    // 進頁面後立即呼叫後端取得 team list
    fetch('http://localhost:3001/teams')
      .then((res) => res.json())
      .then((data) => {
        // data 可能是 { teams: [...] } 的格式
        setTeams(data.teams);
      })
      .catch((err) => {
        console.error('Error fetching teams:', err);
      });
  }, []);

  const handleConfirm = () => {
    // 發送 POST 請求到 /choose-team，並將選擇的 teamId 帶在 body
    fetch('http://localhost:3001/choose-team', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ teamId: selectedTeam }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (result.status === 'OK') {
          // 後端回覆 OK，更新狀態顯示 "刷新頁面" 按鈕 與 "等待主持人指令"
          setIsConfirmed(true);
        } else {
          // 根據實際需求做錯誤處理
          alert('後端回覆失敗');
        }
      })
      .catch((err) => {
        console.error('Error:', err);
      });
  };

  const handleRefresh = () => {
    // 假設刷新頁面就是重新載入，或是想要帶隊伍資訊進行下一步
    window.location.reload();
  };

  return (
    <div style={{ margin: '20px' }}>
      <h1>小遊戲參與</h1>
      {!isConfirmed ? (
        <div>
          <p>請選擇隊伍</p>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
          >
            <option value="" disabled>
              --- 請選擇 ---
            </option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
          <button onClick={handleConfirm} disabled={!selectedTeam}>
            確認
          </button>
        </div>
      ) : (
        <div>
          <p>等待主持人指令</p>
          <button onClick={handleRefresh}>刷新頁面</button>
        </div>
      )}
    </div>
  );
}

export default App;
