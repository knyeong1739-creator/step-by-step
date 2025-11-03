// (App.tsx 파일 맨 위에 추가)
import { db } from './firebase'; // 1. 우리가 만든 '열쇠'
import { doc, onSnapshot, setDoc } from "firebase/firestore"; // 2. Firestore 도구
import { v4 as uuidv4 } from 'uuid'; // 3. 고유 ID 생성 도구 (설치 필요!)
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Player, Mission, Club, UserRole } from './types';
import { ADMIN_USERNAME, ADMIN_PASSWORD, TOTAL_STEPS } from './constants';

// --- Helper Components ---

const Sparkle: React.FC<{ style: React.CSSProperties }> = ({ style }) => (
  <div className="sparkle" style={style}></div>
);

const PlayerPin: React.FC<{ name: string; step: number; isCurrentUser: boolean }> = ({ name, step, isCurrentUser }) => {
  const STEP_HEIGHT = 60;
  const STEP_OFFSET_X = 5;

  const bottom = step * STEP_HEIGHT;
  // This calculation centers the entire staircase horizontally
  const left = `calc(50% - ${(TOTAL_STEPS * STEP_OFFSET_X) / 2}px + ${step * STEP_OFFSET_X}px)`;

  return (
    <div
      className="absolute transition-all duration-1000 ease-in-out z-20 flex flex-col items-center"
      style={{
        bottom: `${bottom}px`,
        left: left,
        transform: 'translateX(-50%)',
        width: '80px',
      }}
    >
      <div className={`relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isCurrentUser ? 'bg-blue-800 scale-110 shadow-lg' : 'bg-blue-800/60'}`}>
        <span className="text-2xl">😇</span>
      </div>
      <span className={`absolute -bottom-5 w-max px-2 py-0.5 rounded-full text-xs font-bold shadow ${isCurrentUser ? 'bg-white text-blue-900' : 'bg-black/40 text-white'}`}>
        {name}
      </span>
    </div>
  );
};

const StairwayContent: React.FC<{ allPlayers: Player[]; currentUserId: string }> = ({ allPlayers, currentUserId }) => {
  const STEP_HEIGHT = 60;
  const STEP_OFFSET_X = 5;
  const STAIR_WIDTH = 150;
  
  const worldHeight = (TOTAL_STEPS + 4) * STEP_HEIGHT;

  const sparkles = useMemo(() =>
    Array.from({ length: 50 }).map((_, i) => ({
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      animationDelay: `${Math.random() * 1.5}s`,
    })), []);

  return (
    <div className="relative w-full" style={{ height: `${worldHeight}px` }}>
        {sparkles.map((style, i) => <Sparkle key={i} style={style} />)}

        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-center z-10">
            <span className="text-8xl">☁️</span>
        </div>

        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <div
                key={`step-${i}`}
                className="absolute bg-white/40 backdrop-blur-sm rounded-md shadow-lg border-t-2 border-white/80"
                style={{
                    bottom: `${i * STEP_HEIGHT}px`,
                    left: `calc(50% - ${(TOTAL_STEPS * STEP_OFFSET_X) / 2}px + ${i * STEP_OFFSET_X}px)`,
                    transform: 'translateX(-50%)',
                    width: `${STAIR_WIDTH}px`,
                    height: '20px',
                }}
            ></div>
        ))}
        
        <div className="absolute left-1/2 -translate-x-1/2 text-center z-10" style={{ bottom: `${TOTAL_STEPS * STEP_HEIGHT}px` }}>
            <div className="relative">
                <span className="absolute text-7xl -bottom-8 -left-16 opacity-80">☁️</span>
                <span className="absolute text-6xl -bottom-5 -right-12 opacity-90">☁️</span>
                <span className="absolute text-5xl -top-5 left-1/2 opacity-70">☁️</span>
                <span className="text-9xl z-10">🏰</span>
            </div>
        </div>

        {allPlayers.map(p => (
            <PlayerPin
                key={p.id}
                name={p.name}
                step={p.currentStep}
                isCurrentUser={p.id === currentUserId}
            />
        ))}
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentUser, setCurrentUser] = useState<Player | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [view, setView] = useState<'login' | 'game' | 'admin'>('login');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [players, setPlayers] = useState<Player[]>([]);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  
 // ************************************************
// ✅ 4단계: '실시간 감시 카메라' 설치 (수정 완료 버전)
// (방금 지운 8줄 자리에 이걸 붙여넣으세요)
// ************************************************

useEffect(() => {
  // 'gameData' 컬렉션의 'main' 문서를 '중앙 칠판'으로 사용합니다.
  const gameDataRef = doc(db, "gameData", "main");

  // onSnapshot = 실시간 감시 카메라
  // '중앙 칠판'이 바뀌면 0.1초 만에 알아채고 {} 안의 코드를 실행합니다.
  const unsubscribe = onSnapshot(gameDataRef, (docSnap) => {
    if (docSnap.exists()) {
      // '칠판'에 데이터가 있으면
      const data = docSnap.data();
      setPlayers(data.players || []);
      setMissions(data.missions || []);
      setClubs(data.clubs || []);
    } else {
      // '칠판'이 비어있으면 (앱 최초 실행)
      console.log("No data found! Initializing...");
      setPlayers([]);
      setMissions([]);
      setClubs([]);
    }
    
    // ✅ 님이 쓰시던 '로딩 끝' 신호를 여기에 추가!
    setIsLoading(false); 

  });

  // 앱이 꺼지면 감시 카메라도 끔
  return () => unsubscribe();
}, []); // [] = "이 코드는 앱이 켜질 때 딱 한 번만 실행하세요"

const saveDataToFirebase = async (
  updatedPlayers: Player[], 
  updatedMissions: Mission[], 
  updatedClubs: Club[]
) => {
  // 'gameData' 컬렉션의 'main' 문서를 '중앙 칠판'으로 사용합니다.
  const gameDataRef = doc(db, "gameData", "main");
  
  try {
    // 'main' 문서에 3개 배열을 통째로 덮어쓰기
    await setDoc(gameDataRef, {
      players: updatedPlayers,
      missions: updatedMissions,
      clubs: updatedClubs,
    });
  } catch (e) {
    console.error("Firebase에 저장하는 중 오류 발생: ", e);
  }
};

const handleLogin = (name: string, password?: string) => {
    // 1. 관리자 로그인 처리
    if (name === ADMIN_USERNAME) {
        if (password === ADMIN_PASSWORD) {
            setIsAdmin(true);
            setView('admin');
            return;
        } else {
            // LoginScreen에서 showPassword가 true일 때만 비밀번호를 묻습니다.
            // 비밀번호 필드가 보였다는 것은 관리자 이름으로 시도했다는 뜻입니다.
            if (password !== undefined) { 
                alert('관리자 비밀번호가 틀렸습니다.');
            }
            return;
        }
    }

    // 2. 플레이어 로그인 처리
    // '중앙 칠판'에서 가져온 'players' 배열에서 사용자를 찾습니다.
    const user = players.find(p => p.name === name);

    if (user) {
        // 3. 'lastLogin' 시간을 업데이트하고 Firebase에 저장
        const updatedUser = { ...user, lastLogin: new Date().toISOString() };
        const updatedPlayers = players.map(p =>
            p.id === user.id ? updatedUser : p
        );
        
        // '중앙 칠판'에 저장합니다!
        saveDataToFirebase(updatedPlayers, missions, clubs);

        // 4. 앱 상태(State) 설정
        setCurrentUser(updatedUser);
        setIsAdmin(false);
        setView('game');
    } else {
        alert('존재하지 않는 이름입니다. 관리자에게 문의하세요.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsAdmin(false);
    setView('login');
  };

  const handleCompleteMission = (mission: Mission) => {
    if (!currentUser) return;
    
    const newStep = Math.min(TOTAL_STEPS, currentUser.currentStep + mission.steps);
    const updatedUser = {
        ...currentUser,
        currentStep: newStep,
        missionHistory: [...currentUser.missionHistory, { missionId: mission.id, completedAt: new Date().toISOString()}]
    };
    
    // 1. '중앙 칠판'용으로 'updatedPlayers' 배열을 만듭니다.
    const updatedPlayers = players.map(p => 
        p.id === updatedUser.id ? updatedUser : p
    );
    
    // 2. '중앙 칠판'에 저장합니다!
    saveDataToFirebase(updatedPlayers, missions, clubs);
    
    // 3. 현재 사용자 상태(State)를 바로 업데이트합니다.
    // (onSnapshot도 이S 일을 하지만, 이게 더 즉각적으로 반응합니다)
    setCurrentUser(updatedUser);
    // refreshData()는 삭제되었습니다!
  };


  const renderContent = () => {
    if (isLoading) {
      return <div className="flex items-center justify-center h-full">Loading...</div>;
    }

    switch (view) {
      case 'game':
        // ✅ 'missions'를 GameScreen에 넘겨줍니다.
        return currentUser && <GameScreen user={currentUser} onLogout={handleLogout} onCompleteMission={handleCompleteMission} allPlayers={players} allClubs={clubs} missions={missions} />;
      case 'admin':
        // ✅ 'refreshData' 프로퍼티를 삭제합니다.
        return <AdminScreen onLogout={handleLogout} players={players} missions={missions} clubs={clubs} saveDataToFirebase={saveDataToFirebase} />;
      case 'login':
      default:
        // ✅ 'onLogin'은 handleLogin 함수와 완벽하게 호환됩니다. (작업 2에서 수정함)
        return <LoginScreen onLogin={handleLogin} />;
    }

  return (
    <div className="h-screen w-screen bg-gradient-to-b from-sky-400 to-sky-200 font-sans text-gray-800 overflow-hidden">
      <main className="relative h-full w-full max-w-lg mx-auto">
        {renderContent()}
      </main>
    </div>
  );
}

// --- Screen Components ---

const LoginScreen: React.FC<{ onLogin: (name: string, password?: string) => void }> = ({ onLogin }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
      if (name === ADMIN_USERNAME) {
          setShowPassword(true);
      } else {
          setShowPassword(false);
          setPassword('');
      }
  }, [name]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // 관리자 비밀번호가 틀렸다는 에러는 App 컴포넌트의 'alert'가 처리합니다.
    // 여기서는 그냥 'onLogin'으로 이름과 비밀번호를 올리기만 합니다.
    onLogin(name, password);
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-4 z-20 relative">
        <div className="absolute top-10 text-center text-white">
            <h1 className="text-4xl font-extrabold" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>정교회로 STEP BY STEP</h1>
            <p className="text-xl font-semibold mt-1" style={{ textShadow: '1px 1px 3px rgba(0,0,0,0.2)' }}>천국 계단 오르는 법</p>
        </div>

        <div className="w-full max-w-sm bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-2xl">
            <h2 className="text-center text-2xl font-bold text-sky-700 mb-4">로그인</h2>
            <p className="text-center text-gray-600 mb-4">
                이름을 입력하여 로그인하세요.
            </p>

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="예시) 김소망"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
                {showPassword && (
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="비밀번호"
                        className="w-full px-4 py-3 mt-4 border border-gray-300 rounded-lg text-lg focus:ring-2 focus:ring-sky-500 focus:outline-none"
                    />
                )}
                {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
                <button type="submit" className="w-full mt-6 bg-sky-500 text-white font-bold py-3 rounded-lg text-lg hover:bg-sky-600 transition-transform transform hover:scale-105">
                    시작하기
                </button>
            </form>
        </div>
    </div>
  );
};


const GameScreen: React.FC<{
  user: Player;
  onLogout: () => void;
  onCompleteMission: (mission: Mission) => void;
  allPlayers: Player[];
  allClubs: Club[];
  missions: Mission[]; // 1. 'missions'를 받도록 추가
}> = ({ user, onLogout, onCompleteMission, allPlayers, allClubs, missions }) => { // ✅ 2. 'missions'를 받도록 추가
    const [activeTab, setActiveTab] = useState('missions');
    const [showCongratsModal, setShowCongratsModal] = useState(false);
    // 3. 'storageService.getMissions()' 줄 삭제됨!
    
    const sortedPlayers = useMemo(() => [...allPlayers].sort((a, b) => b.currentStep - a.currentStep), [allPlayers]);
    
    const userClub = useMemo(() => user.clubId ? allClubs.find(c => c.id === user.clubId) : undefined, [user.clubId, allClubs]);
    const clubMembers = useMemo(() => userClub ? allPlayers.filter(p => p.clubId === userClub.id) : [], [userClub, allPlayers]);
    
    const onlineUsers = useMemo(() => {
        const now = new Date();
        return allPlayers.filter(p => (now.getTime() - new Date(p.lastLogin).getTime()) < 5 * 60 * 1000); // Online if last login within 5 mins
    }, [allPlayers]);

    useEffect(() => {
        if (user.currentStep === TOTAL_STEPS) {
            const timer = setTimeout(() => {
                setShowCongratsModal(true);
            }, 1200); // Delay to sync with pin movement animation
            return () => clearTimeout(timer);
        }
    }, [user.currentStep]);

    const getRoleDisplayName = (role: UserRole) => {
        switch(role) {
            case UserRole.PLAYER: return '회원';
            case UserRole.TEAM_LEADER: return '팀장';
            case UserRole.CLUB_PRESIDENT: return '회장 👑';
            default: return '';
        }
    };

    const STEP_HEIGHT = 60;
    const worldHeight = (TOTAL_STEPS + 4) * STEP_HEIGHT; 
    const playerYPositionInWorld = user.currentStep * STEP_HEIGHT;

    return (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
        {showCongratsModal && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
                <div className="bg-white rounded-2xl p-8 text-center shadow-2xl w-11/12 max-w-sm animate-fade-in-up">
                    <h2 className="text-2xl font-bold text-sky-600 mb-4">축하합니다!</h2>
                    <p className="text-lg text-gray-700 mb-6">천국 문을 열었습니다!</p>
                    <button 
                        onClick={() => setShowCongratsModal(false)}
                        className="bg-sky-500 text-white font-bold py-2 px-8 rounded-lg text-lg hover:bg-sky-600 transition"
                    >
                        확인
                    </button>
                </div>
            </div>
        )}
        <header className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-30 bg-black/10">
            <div className="text-white font-bold">
                <p className="text-lg">{user.name} 님</p>
                <p className="text-sm">현재 {user.currentStep} / {TOTAL_STEPS} 칸</p>
            </div>
            <button onClick={onLogout} className="bg-white/30 text-white px-4 py-2 rounded-lg font-semibold hover:bg-white/50 transition">로그아웃</button>
        </header>
        
        <div
            className="absolute top-0 left-0 w-full h-full transition-transform duration-1000 ease-in-out z-10"
            style={{
                transform: `translateY(calc(40vh - ${worldHeight}px + ${playerYPositionInWorld}px))`
            }}
        >
            <StairwayContent allPlayers={allPlayers} currentUserId={user.id} />
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-[40%] bg-white/70 backdrop-blur-sm rounded-t-2xl p-4 flex flex-col z-20">
            <div className="flex border-b border-gray-300">
                <button onClick={() => setActiveTab('missions')} className={`flex-1 py-2 font-bold text-sm md:text-base ${activeTab === 'missions' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>미션</button>
                <button onClick={() => setActiveTab('ranking')} className={`flex-1 py-2 font-bold text-sm md:text-base ${activeTab === 'ranking' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>랭킹</button>
                <button onClick={() => setActiveTab('club')} className={`flex-1 py-2 font-bold text-sm md:text-base ${activeTab === 'club' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>우리 동아리</button>
                <button onClick={() => setActiveTab('online')} className={`flex-1 py-2 font-bold text-sm md:text-base ${activeTab === 'online' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>접속자</button>
            </div>
            <div className="flex-grow overflow-y-auto mt-4 pr-2">
                {activeTab === 'missions' && (
                    <div className="space-y-3">
                        {missions.map(mission => (
                            <div key={mission.id} className="bg-white/80 p-3 rounded-lg shadow flex items-center justify-between">
                                <div>
                                    <p className="font-bold">{mission.title}</p>
                                    <p className="text-sm text-green-600">완료 시 {mission.steps}칸 상승</p>
                                </div>
                                <button onClick={() => onCompleteMission(mission)} className="bg-sky-500 text-white w-10 h-10 rounded-full text-2xl flex items-center justify-center hover:bg-sky-600 transition-transform transform hover:scale-110 active:scale-95">+</button>
                            </div>
                        ))}
                    </div>
                )}
                {activeTab === 'ranking' && (
                    <ul className="space-y-2">
                        {sortedPlayers.map((p, index) => (
                            <li key={p.id} className={`p-2 rounded-lg flex items-center justify-between ${p.id === user.id ? 'bg-sky-200' : 'bg-white/80'}`}>
                                <div className="flex items-center space-x-3">
                                    <span className="font-bold w-6 text-center">{index + 1}</span>
                                    <span>{p.name}</span>
                                </div>
                                <span className="font-semibold">{p.currentStep} 칸</span>
                            </li>
                        ))}
                    </ul>
                )}
                {activeTab === 'club' && (
                  userClub ? (
                    <div>
                      <h3 className="text-xl font-bold mb-2">{userClub.name}</h3>
                      <ul className="space-y-2">
                        {clubMembers.map(member => (
                          <li key={member.id} className="bg-white/80 p-3 rounded-lg shadow flex justify-between items-center">
                            <div>
                              <p className="font-semibold">{member.name} <span className="text-sm font-normal text-gray-500">{getRoleDisplayName(member.role)}</span></p>
                              <p className="text-sm text-gray-600">{member.currentStep} 칸</p>
                            </div>
                            <button onClick={() => alert(`${member.name}님을 콕 찔렀습니다!`)} className="bg-yellow-400 text-sm font-bold px-3 py-1 rounded-full hover:bg-yellow-500 transition">콕 찌르기</button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : <p className="text-center text-gray-500 mt-4">소속된 동아리가 없습니다.</p>
                )}
                {activeTab === 'online' && (
                    <div>
                        <h3 className="text-lg font-bold mb-2">현재 접속자 ({onlineUsers.length}명)</h3>
                        <ul className="space-y-2">
                           {onlineUsers.map(p => (
                               <li key={p.id} className="bg-green-100 p-2 rounded-lg">{p.name}</li>
                           ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

const AdminScreen: React.FC<{ 
    onLogout: () => void;
    players: Player[];
    missions: Mission[];
    clubs: Club[];
    // ✅ 'refreshData' 대신 'saveDataToFirebase'를 받도록 수정
    saveDataToFirebase: (players: Player[], missions: Mission[], clubs: Club[]) => Promise<void>; 
}> = ({ onLogout, players, missions, clubs, saveDataToFirebase }) => { // ✅ 받도록 수정
    const [activeTab, setActiveTab] = useState('status');

    return (
        <div className="h-full w-full flex flex-col p-4 bg-gray-50">
            <header className="flex justify-between items-center pb-4 border-b">
                <h1 className="text-2xl font-bold">관리자 페이지</h1>
                <button onClick={onLogout} className="bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-gray-700 transition">로그아웃</button>
            </header>
            <nav className="flex border-b my-4 overflow-x-auto">
                <button onClick={() => setActiveTab('status')} className={`flex-1 py-2 font-bold whitespace-nowrap px-2 ${activeTab === 'status' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>현황</button>
                <button onClick={() => setActiveTab('players')} className={`flex-1 py-2 font-bold whitespace-nowrap px-2 ${activeTab === 'players' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>플레이어 관리</button>
                <button onClick={() => setActiveTab('missions')} className={`flex-1 py-2 font-bold whitespace-nowrap px-2 ${activeTab === 'missions' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>미션 관리</button>
                <button onClick={() => setActiveTab('clubs')} className={`flex-1 py-2 font-bold whitespace-nowrap px-2 ${activeTab === 'clubs' ? 'text-sky-600 border-b-2 border-sky-600' : 'text-gray-500'}`}>동아리 관리</button>
            </nav>
            <div className="flex-grow overflow-y-auto">
                {activeTab === 'status' && <StatusTab players={players} />}
                
                {/* ✅ 'saveDataToFirebase'와 모든 데이터를 자식들에게 전달! */}
                {activeTab === 'players' && <PlayerManagementTab 
                    players={players} 
                    missions={missions} 
                    clubs={clubs} 
                    saveDataToFirebase={saveDataToFirebase} 
                />}
                {activeTab === 'missions' && <MissionManagementTab 
                    players={players} 
                    missions={missions} 
                    clubs={clubs} 
                    saveDataToFirebase={saveDataToFirebase} 
                />}
                {activeTab === 'clubs' && <ClubManagementTab 
                    players={players} 
                    missions={missions} 
                    clubs={clubs} 
                    saveDataToFirebase={saveDataToFirebase} 
                />}
            </div>
        </div>
    );
};

// --- Admin Tab Components ---

const StatusTab: React.FC<{players: Player[]}> = ({ players }) => (
    <div className="space-y-2">
        <h2 className="text-xl font-bold mb-2">전체 플레이어 현황</h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-gray-200">
                    <tr>
                        <th className="p-2">이름</th>
                        <th className="p-2">계단</th>
                        <th className="p-2">마지막 접속</th>
                    </tr>
                </thead>
                <tbody>
                    {players.map(p => (
                        <tr key={p.id} className="border-b">
                            <td className="p-2">{p.name}</td>
                            <td className="p-2">{p.currentStep}</td>
                            <td className="p-2 text-sm">{new Date(p.lastLogin).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

// ✅ 작업 8: PlayerManagementTab (완성본)
// ✅ 작업 8: PlayerManagementTab (완성본)
const PlayerManagementTab: React.FC<{
    players: Player[], 
    clubs: Club[], 
    missions: Mission[], // ✅ missions 추가 (saveDataToFirebase는 3종 세트가 다 필요함)
    saveDataToFirebase: (players: Player[], missions: Mission[], clubs: Club[]) => Promise<void>; // ✅ refreshData 대신
}> = ({ players, clubs, missions, saveDataToFirebase }) => {
    const [newName, setNewName] = useState('');
    const [newPlayerClubId, setNewPlayerClubId] = useState('none');
    const [newPlayerRole, setNewPlayerRole] = useState<UserRole>(UserRole.PLAYER);
    const [error, setError] = useState('');

    const handleAddPlayer = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!newName.trim()) {
            setError('이름을 입력해주세요.');
            return;
        }
        if (players.find(p => p.name === newName.trim())) {
            setError('이미 존재하는 이름입니다.');
            return;
        }

        const newPlayer: Player = {
            id: uuidv4(), 
            name: newName.trim(),
            clubId: newPlayerClubId === 'none' ? undefined : newPlayerClubId,
            role: newPlayerClubId === 'none' ? UserRole.PLAYER : newPlayerRole,
            currentStep: 0,
            missionHistory: [],
            lastLogin: new Date(0).toISOString(), 
        };
        
        const updatedPlayers = [...players, newPlayer];
        let updatedClubs = [...clubs];

        if (newPlayer.role === UserRole.CLUB_PRESIDENT && newPlayer.clubId) {
            updatedClubs = clubs.map(c => 
                c.id === newPlayer.clubId ? { ...c, presidentId: newPlayer.id } : c
            );
        }

        saveDataToFirebase(updatedPlayers, missions, updatedClubs);

        setNewName('');
        setNewPlayerClubId('none');
        setNewPlayerRole(UserRole.PLAYER);
    };

    const handleDeletePlayer = (id: string) => {
        if (window.confirm('정말 이 플레이어를 삭제하시겠습니까?')) {
            const updatedPlayers = players.filter(p => p.id !== id);
            saveDataToFirebase(updatedPlayers, missions, clubs);
        }
    };
    
    const handleSetRole = (player: Player, role: UserRole) => {
        const wasPresident = player.role === UserRole.CLUB_PRESIDENT;
        const isNowPresident = role === UserRole.CLUB_PRESIDENT;
        
        const updatedPlayer = {...player, role};
        const updatedPlayers = players.map(p => p.id === player.id ? updatedPlayer : p);
        
        let updatedClubs = [...clubs];
        if (player.clubId) {
            const club = clubs.find(c => c.id === player.clubId);
            if (club) {
                if (isNowPresident) {
                    updatedClubs = clubs.map(c => c.id === player.clubId ? { ...c, presidentId: player.id } : c);
                } else if (wasPresident) {
                    updatedClubs = clubs.map(c => c.id === player.clubId ? { ...c, presidentId: '' } : c);
                }
            }
        }
        saveDataToFirebase(updatedPlayers, missions, updatedClubs);
    };

    const handleSetClub = (player: Player, clubId: string) => {
        const newClubId = clubId === 'none' ? undefined : clubId;
         const oldClubId = player.clubId;
        
        let updatedPlayer = {...player, clubId: newClubId};
        let updatedClubs = [...clubs];
        
        if (player.role === UserRole.CLUB_PRESIDENT) {
            updatedPlayer.role = UserRole.PLAYER;
            const oldClub = clubs.find(c => c.id === oldClubId);
            if (oldClub) {
                updatedClubs = updatedClubs.map(c => c.id === oldClubId ? { ...c, presidentId: '' } : c);
            }
        }
        
        const updatedPlayers = players.map(p => p.id === player.id ? updatedPlayer : p);
        saveDataToFirebase(updatedPlayers, missions, updatedClubs);
    };
    
    const getRoleDisplayName = (role: UserRole) => {
        switch(role) {
            case UserRole.PLAYER: return '회원';
            case UserRole.TEAM_LEADER: return '팀장';
            case UserRole.CLUB_PRESIDENT: return '회장';
            default: return role;
        }
    };
    
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">플레이어 관리</h2>
            <form onSubmit={handleAddPlayer} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                 <h3 className="font-semibold">새 플레이어 추가</h3>
                 <input type="text" placeholder="이름" value={newName} onChange={e => setNewName(e.target.value)} className="w-full border p-2 rounded" />
                 <select value={newPlayerClubId} onChange={(e) => setNewPlayerClubId(e.target.value)} className="w-full border p-2 rounded">
                    <option value="none">동아리 없음</option>
                    {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                 </select>
                 <select value={newPlayerRole} onChange={(e) => setNewPlayerRole(e.target.value as UserRole)} className="w-full border p-2 rounded" disabled={newPlayerClubId === 'none'}>
                     <option value={UserRole.PLAYER}>회원</option>
                     <option value={UserRole.TEAM_LEADER}>팀장</option>
                     <option value={UserRole.CLUB_PRESIDENT}>회장</option>
                 </select>
                 {error && <p className="text-red-500 text-sm">{error}</p>}
Button            <button type="submit" className="w-full bg-sky-500 text-white p-2 rounded hover:bg-sky-600">추가하기</button>
            </form>
            
            <div className="space-y-2">
                {/* ⬇️ 이 부분이 아까 잘렸던 곳입니다! ⬇️ */}
                {players.map(p => (
                    <div key={p.id} className="bg-white p-3 rounded-lg shadow-sm flex flex-col md:flex-row md:items-center justify-between space-y-2 md:space-y-0">
                        <div>
                            <span className="font-semibold">{p.name}</span>
                            <span className="text-sm text-gray-600 ml-2">({getRoleDisplayName(p.role)})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <select value={p.clubId || 'none'} onChange={(e) => handleSetClub(p, e.target.value)} className="border rounded p-1 text-sm">
                                <option value="none">동아리 없음</option>
                                {clubs.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <select value={p.role} onChange={(e) => handleSetRole(p, e.target.value as UserRole)} className="border rounded p-1 text-sm" disabled={!p.clubId}>
                                <option value={UserRole.PLAYER}>회원</option>
                                <option value={UserRole.TEAM_LEADER}>팀장</option>
                                <option value={UserRole.CLUB_PRESIDENT}>회장</option>
                            </select>
                            <button onClick={() => handleDeletePlayer(p.id)} className="text-red-500 hover:text-red-700 px-2 py-1 text-xs font-bold">삭제</button>
                  S       </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClubManagementTab: React.FC<{
    players: Player[], // ✅ players 추가 (동아리 삭제 시 플레이어 정보 변경)
    missions: Mission[], // ✅ missions 추가 (saveDataToFirebase를 위해)
    clubs: Club[], 
    saveDataToFirebase: (players: Player[], missions: Mission[], clubs: Club[]) => Promise<void>; // ✅ refreshData 대신
}> = ({ players, missions, clubs, saveDataToFirebase }) => {
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    const handleAddClub = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!name.trim()) {
            setError('동아리 이름을 입력해주세요.');
            return;
        }
        if (clubs.find(c => c.name === name.trim())) {
            setError('이미 존재하는 동아리 이름입니다.');
            return;
        }

        // ✅ '중앙 칠판'에 저장할 새 동아리 객체 생성
        const newClub: Club = {
            id: uuidv4(),
            name: name.trim(),
            presidentId: '', // 회장은 PlayerManagementTab에서 별도 지정
        };

        const updatedClubs = [...clubs, newClub];
        
        // ✅ '중앙 칠판'에 저장!
        saveDataToFirebase(players, missions, updatedClubs);
        // ✅ refreshData() 삭제!
        
        setName('');
    };

    const handleDeleteClub = (id: string) => {
        if (window.confirm('정말 이 동아리를 삭제하시겠습니까? 소속된 모든 회원의 동아리 정보가 삭제됩니다.')) {
            // ✅ 1. 동아리 목록에서 삭제
            const updatedClubs = clubs.filter(c => c.id !== id);
            
            // ✅ 2. 모든 플레이어를 순회하며 해당 동아리 ID를 제거하고, 역할을 '회원'으로 강등
            const updatedPlayers = players.map(p => {
                if (p.clubId === id) {
                    return {
                        ...p,
                        clubId: undefined,
                        role: UserRole.PLAYER
                    };
                }
                return p;
            });
            
            // ✅ '중앙 칠판'에 저장!
            saveDataToFirebase(updatedPlayers, missions, updatedClubs);
            // ✅ refreshData() 삭제!
        }
    }

    // ✅ (이 아래 JSX 부분은 낡은 코드와 동일합니다)
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">동아리 관리</h2>
            <form onSubmit={handleAddClub} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <h3 className="font-semibold">새 동아리 추가</h3>
                <input type="text" placeholder="동아리 이름" value={name} onChange={e => setName(e.target.value)} className="w-full border p-2 rounded" />
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" className="w-full bg-sky-500 text-white p-2 rounded hover:bg-sky-600">추가하기</button>
            </form>
            <div className="space-y-2">
                <h3 className="font-semibold">현재 동아리 목록</h3>
                {clubs.map(c => (
                    <div key={c.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <span>{c.name}</span>
                        <button onClick={() => handleDeleteClub(c.id)} className="text-red-500 hover:text-red-700 font-bold">삭제</button>
                    </div>
                ))}
                 {clubs.length === 0 && <p className="text-center text-gray-500 pt-4">생성된 동아리가 없습니다.</p>}
            </div>
        </div>
    );
};

const MissionManagementTab: React.FC<{
    players: Player[], // ✅ players 추가
    missions: Mission[], 
    clubs: Club[], // ✅ clubs 추가
    saveDataToFirebase: (players: Player[], missions: Mission[], clubs: Club[]) => Promise<void>; // ✅ refreshData 대신
}> = ({ players, missions, clubs, saveDataToFirebase }) => {
    const [title, setTitle] = useState('');
    const [steps, setSteps] = useState(1);

    const handleAddMission = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || steps < 1) return;

        // ✅ '중앙 칠판'에 저장할 새 미션 객체 생성
        const newMission: Mission = {
            id: uuidv4(), // 1단계에서 import한 uuid 사용
            title: title.trim(),
            steps: steps
        };
        
        // ✅ '중앙 칠판'에 저장할 새 배열 생성
        const updatedMissions = [...missions, newMission];
        
        // ✅ '중앙 칠판'에 저장!
        saveDataToFirebase(players, updatedMissions, clubs);
        
        // ✅ 입력창 초기화
        setTitle('');
        setSteps(1);
        // ✅ refreshData() 삭제!
    };

    const handleDeleteMission = (id: string) => {
        if (window.confirm('정말 이 미션을 삭제하시겠습니까?')) {
            // ✅ '중앙 칠판'에 저장할 새 배열 생성
            const updatedMissions = missions.filter(m => m.id !== id);
            
            // ✅ '중앙 칠판'에 저장!
            saveDataToFirebase(players, updatedMissions, clubs);
            // ✅ refreshData() 삭제!
        }
    }

    // ✅ (이 아래 JSX 부분은 낡은 코드와 동일합니다)
    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-2">미션 관리</h2>
            <form onSubmit={handleAddMission} className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                <h3 className="font-semibold">새 미션 추가</h3>
                <input type="text" placeholder="미션 내용" value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" />
                <input type="number" placeholder="오르는 칸 수" value={steps} onChange={e => setSteps(Number(e.target.value))} className="w-full border p-2 rounded" min="1" />
                <button type="submit" className="w-full bg-sky-500 text-white p-2 rounded hover:bg-sky-600">추가하기</button>
            </form>
            <div className="space-y-2">
      S          <h3 className="font-semibold">현재 미션 목록</h3>
                {missions.map(m => (
                    <div key={m.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                        <span>{m.title} ({m.steps}칸)</span>
                        <button onClick={() => handleDeleteMission(m.id)} className="text-red-500 hover:text-red-700 font-bold">삭제</button>
                    </div>
                ))}
            </div>
        </div>
    )
};}
