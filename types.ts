
export enum UserRole {
  PLAYER = 'PLAYER',
  TEAM_LEADER = 'TEAM_LEADER',
  CLUB_PRESIDENT = 'CLUB_PRESIDENT',
  ADMIN = 'ADMIN',
}

export interface Player {
  id: string;
  name: string;
  currentStep: number;
  lastLogin: string;
  clubId?: string;
  role: UserRole;
  missionHistory: { missionId: string; completedAt: string }[];
}

export interface Mission {
  id: string;
  title: string;
  steps: number;
}

export interface Club {
  id: string;
  name: string;
  presidentId: string;
}