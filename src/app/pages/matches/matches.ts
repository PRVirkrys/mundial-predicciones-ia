import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { getTeamName, normalizeText } from '../../utils/team-names';
import { MatchCard } from '../../shared/components/match-card/match-card';
import { MatchService } from '../../core/services/match.service';
import { PredictionService } from '../../core/services/prediction.service';
import { Match } from '../../core/models/match.model';
import { Prediction } from '../../core/models/prediction.model';
import { Auth } from '../../core/services/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-matches',
  imports: [MatchCard, LucideAngularModule, FormsModule],
  templateUrl: './matches.html',
  styleUrl: './matches.css',
})
export class Matches implements OnInit {
  matches: Match[] = [];
  predictionByUser: Prediction[] = [];
  matchesFiltardos: Match[] = [];

  constructor(
    private matchService: MatchService,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef,
    private auth: Auth,
    private destroyRef: DestroyRef,
    private route: ActivatedRoute,
  ) {}

  userId: number | null = null;
  activeTab: 'all' | 'predictions' | 'played' = 'all';
  sortOrder: 'asc' | 'desc' | 'closest' = 'closest';
  selectedGroup: string = 'all';
  selectedPhase: string = 'all';
  selectedResult: 'all' | 'exact' | 'winner' | 'failed' | 'pending' | 'unpredicted' = 'all';
  searchQuery: string = '';

  readonly phases = [
    { key: 'group',   label: 'Fase de Grupos', test: (r: string) => r?.startsWith('Matchday') },
    { key: 'round32', label: 'Dieciseisavos',   test: (r: string) => r === 'Round of 32' },
    { key: 'round16', label: 'Octavos',          test: (r: string) => r === 'Round of 16' },
    { key: 'qf',      label: 'Cuartos',          test: (r: string) => r === 'Quarter-final' },
    { key: 'sf',      label: 'Semifinal',         test: (r: string) => r === 'Semi-final' },
    { key: 'final',   label: 'Final',             test: (r: string) => r === 'Final' },
  ];

  get availablePhases() {
    return this.phases.filter((p) => this.matches.some((m) => p.test(m.round)));
  }

  get availableGroups(): string[] {
    return [...new Set(this.matches.map((m) => m.group).filter(Boolean))].sort();
  }

  get isGroupPhase(): boolean {
    return this.selectedPhase === 'all' || this.selectedPhase === 'group';
  }

  ngOnInit() {
    const tab = this.route.snapshot.queryParamMap.get('tab');
    if (tab === 'predictions' || tab === 'played') {
      this.activeTab = tab;
    }

    this.matchService
      .getMatches()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data: Match[]) => {
        this.matches = data;
        this.cdr.detectChanges();

        const playedMatches = data.filter((m) => m.homeGoals !== null);
        if (playedMatches.length > 0) {
          forkJoin(
            playedMatches.map((m) => this.predictionService.evaluatePredictions(m.id)),
          ).subscribe(() => this.auth.refreshCurrentUser());
        }
      });

    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.userId = user ? user.id : null;
      if (user) this.loadUserPredictions(user.id);
      else this.predictionByUser = [];
    });

    this.matchService.getMatches().subscribe((data) => {
      console.log(data[0]?.matchDate);
    });
  }

  loadUserPredictions(userId: number) {
    this.predictionService.getPredictionsByUser(userId).subscribe((data: Prediction[]) => {
      this.predictionByUser = data;
      this.cdr.detectChanges();
    });
  }

  getPredictionForMatch(matchId: number): Prediction | null {
    return this.predictionByUser.find((p) => p.match.id === matchId) ?? null;
  }

  setActiveTab(tab: 'all' | 'predictions' | 'played') {
    this.activeTab = tab;
    this.selectedResult = 'all';
  }

  predictionSaved() {
    if (this.userId) {
      this.loadUserPredictions(this.userId);
    }
  }

  onSearchChange() {
    this.cdr.detectChanges();
  }

  clearSearch() {
    this.searchQuery = '';
    this.cdr.detectChanges();
  }

  get isSegmentedView(): boolean {
    return this.sortOrder === 'closest';
  }

  private getFilteredBase(): Match[] {
    let result = this.matches;

    if (this.activeTab === 'predictions') {
      result = result.filter((match) => this.getPredictionForMatch(match.id) !== null);
    } else if (this.activeTab === 'played') {
      result = result.filter((match) => match.homeGoals !== null && match.awayGoals !== null);
    }

    if (this.selectedPhase !== 'all') {
      const phase = this.phases.find((p) => p.key === this.selectedPhase);
      if (phase) result = result.filter((m) => phase.test(m.round));
    }

    if (this.selectedGroup !== 'all') {
      result = result.filter((match) => match.group === this.selectedGroup);
    }

    if (this.selectedResult !== 'all') {
      result = result.filter((match) => {
        const pred = this.getPredictionForMatch(match.id);
        if (this.selectedResult === 'exact')        return pred?.correctWinner === true  && pred?.correctScore === true;
        if (this.selectedResult === 'winner')       return pred?.correctWinner === true  && pred?.correctScore === false;
        if (this.selectedResult === 'failed')       return pred?.correctWinner === false;
        if (this.selectedResult === 'pending')      return pred !== null && pred.correctWinner === null;
        if (this.selectedResult === 'unpredicted')  return pred === null;
        return true;
      });
    }

    if (this.searchQuery.trim()) {
      const q = normalizeText(this.searchQuery.trim());
      result = result.filter(
        (match) =>
          normalizeText(match.homeTeam ?? '').includes(q) ||
          normalizeText(match.awayTeam ?? '').includes(q) ||
          normalizeText(getTeamName(match.homeTeam)).includes(q) ||
          normalizeText(getTeamName(match.awayTeam)).includes(q) ||
          normalizeText(match.group ?? '').includes(q),
      );
    }

    return result;
  }

  getMatchesFiltered(): Match[] {
    return this.getFilteredBase().slice().sort((a, b) => {
      const dateA = new Date(a.matchDate).getTime();
      const dateB = new Date(b.matchDate).getTime();
      const diff = dateA - dateB;
      return this.sortOrder === 'asc' ? diff : -diff;
    });
  }

  getUpcomingFiltered(): Match[] {
    const now = Date.now();
    return this.getFilteredBase()
      .filter((m) => m.homeGoals === null || m.awayGoals === null)
      .sort((a, b) => {
        const dateA = new Date(a.matchDate).getTime();
        const dateB = new Date(b.matchDate).getTime();
        return Math.abs(dateA - now) - Math.abs(dateB - now);
      });
  }

  getPlayedFiltered(): Match[] {
    return this.getFilteredBase()
      .filter((m) => m.homeGoals !== null && m.awayGoals !== null)
      .sort((a, b) => new Date(b.matchDate).getTime() - new Date(a.matchDate).getTime());
  }
}
