export interface Match {
  id: number;
  homeTeam: string;
  awayTeam: string;
  location: string;
  matchDate: string;
  homeGoals: number | null;
  awayGoals: number | null;
  homeTeamFlag: string;
  awayTeamFlag: string;
  group: string;
  round: string;
}
