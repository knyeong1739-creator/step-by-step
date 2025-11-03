
import { Player, Mission, Club, UserRole } from '../types';
import { ADMIN_USERNAME, ADMIN_PASSWORD } from '../constants';

const PLAYERS_KEY = 'stairway_players';
const MISSIONS_KEY = 'stairway_missions';
const CLUBS_KEY = 'stairway_clubs';

// --- Data Seeding ---
const seedData = () => {
  if (!localStorage.getItem(PLAYERS_KEY)) {
    const initialPlayers: Player[] = [
      { id: 'player-1', name: '김소망', currentStep: 5, lastLogin: new Date().toISOString(), role: UserRole.PLAYER, missionHistory: [], clubId: 'club-1' },
      { id: 'player-2', name: '이믿음', currentStep: 12, lastLogin: new Date().toISOString(), role: UserRole.CLUB_PRESIDENT, missionHistory: [], clubId: 'club-1' },
      { id: 'player-3', name: '박사랑', currentStep: 2, lastLogin: new Date().toISOString(), role: UserRole.PLAYER, missionHistory: [] },
    ];
    localStorage.setItem(PLAYERS_KEY, JSON.stringify(initialPlayers));
  }
  if (!localStorage.getItem(MISSIONS_KEY)) {
    const initialMissions: Mission[] = [
      { id: 'mission-1', title: '지인 3명에게 정교회 소개하기', steps: 1 },
      { id: 'mission-2', title: '전도 대상자와 함께 식사하기', steps: 2 },
      { id: 'mission-3', title: '함께 성당 방문하기', steps: 5 },
      { id: 'mission-4', title: '새 신자 등록 돕기', steps: 10 },
    ];
    localStorage.setItem(MISSIONS_KEY, JSON.stringify(initialMissions));
  }
  if (!localStorage.getItem(CLUBS_KEY)) {
    const initialClubs: Club[] = [
      { id: 'club-1', name: '천사들의 합창', presidentId: 'player-2' }
    ];
    localStorage.setItem(CLUBS_KEY, JSON.stringify(initialClubs));
  }
};

seedData();

// --- API Functions ---
const getAllPlayers = (): Player[] => JSON.parse(localStorage.getItem(PLAYERS_KEY) || '[]');
const saveAllPlayers = (players: Player[]) => localStorage.setItem(PLAYERS_KEY, JSON.stringify(players));

const getAllMissions = (): Mission[] => JSON.parse(localStorage.getItem(MISSIONS_KEY) || '[]');
const saveAllMissions = (missions: Mission[]) => localStorage.setItem(MISSIONS_KEY, JSON.stringify(missions));

const getAllClubs = (): Club[] => JSON.parse(localStorage.getItem(CLUBS_KEY) || '[]');
const saveAllClubs = (clubs: Club[]) => localStorage.setItem(CLUBS_KEY, JSON.stringify(clubs));

export const storageService = {
  // --- Auth ---
  login: (name: string): Player | 'ADMIN' | null => {
    if (name === ADMIN_USERNAME) return 'ADMIN';
    const players = getAllPlayers();
    const player = players.find(p => p.name === name);
    if (player) {
      player.lastLogin = new Date().toISOString();
      saveAllPlayers(players);
      return player;
    }
    return null;
  },

  // --- Players ---
  getPlayers: (): Player[] => getAllPlayers(),
  addPlayer: (name: string, clubId: string | undefined, role: UserRole): Player => {
    const players = getAllPlayers();
    if (players.some(p => p.name === name)) {
      throw new Error("이미 존재하는 이름입니다.");
    }
    const newPlayer: Player = {
      id: `player-${Date.now()}`,
      name,
      currentStep: 0,
      lastLogin: new Date().toISOString(),
      role: role,
      missionHistory: [],
      clubId: clubId === 'none' ? undefined : clubId,
    };
    players.push(newPlayer);
    saveAllPlayers(players);
    return newPlayer;
  },
  updatePlayer: (updatedPlayer: Player): Player => {
    let players = getAllPlayers();
    players = players.map(p => p.id === updatedPlayer.id ? updatedPlayer : p);
    saveAllPlayers(players);
    return updatedPlayer;
  },
  deletePlayer: (playerId: string): void => {
    let players = getAllPlayers();
    players = players.filter(p => p.id !== playerId);
    saveAllPlayers(players);
  },
  
  // --- Missions ---
  getMissions: (): Mission[] => getAllMissions(),
  addMission: (title: string, steps: number): Mission => {
    const missions = getAllMissions();
    const newMission: Mission = { id: `mission-${Date.now()}`, title, steps };
    missions.push(newMission);
    saveAllMissions(missions);
    return newMission;
  },
  deleteMission: (missionId: string): void => {
    let missions = getAllMissions();
    missions = missions.filter(m => m.id !== missionId);
    saveAllMissions(missions);
  },

  // --- Clubs ---
  getClubs: (): Club[] => getAllClubs(),
  getClubById: (clubId: string): Club | undefined => getAllClubs().find(c => c.id === clubId),
  createClub: (name: string): Club => {
    const clubs = getAllClubs();
     if (clubs.some(c => c.name === name)) {
      throw new Error("이미 존재하는 동아리 이름입니다.");
    }
    const newClub: Club = { id: `club-${Date.now()}`, name, presidentId: '' };
    clubs.push(newClub);
    saveAllClubs(clubs);
    return newClub;
  },
  updateClub: (updatedClub: Club): Club => {
    let clubs = getAllClubs();
    clubs = clubs.map(c => c.id === updatedClub.id ? updatedClub : c);
    saveAllClubs(clubs);
    return updatedClub;
  },
  deleteClub: (clubId: string): void => {
    let clubs = getAllClubs();
    clubs = clubs.filter(c => c.id !== clubId);
    saveAllClubs(clubs);

    let players = getAllPlayers();
    const updatedPlayers = players.map(p => {
        if (p.clubId === clubId) {
            const updatedPlayer = {...p, clubId: undefined};
            if(p.role === UserRole.CLUB_PRESIDENT || p.role === UserRole.TEAM_LEADER) {
                updatedPlayer.role = UserRole.PLAYER;
            }
            return updatedPlayer;
        }
        return p;
    });
    saveAllPlayers(updatedPlayers);
  },
  getClubMembers: (clubId: string): Player[] => getAllPlayers().filter(p => p.clubId === clubId),
};