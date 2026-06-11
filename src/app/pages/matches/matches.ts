import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { getTeamName } from '../../utils/team-names';
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
  ) {}

  userId: number | null = null;
  activeTab: 'all' | 'predictions' | 'played' = 'all';
  sortOrder: 'asc' | 'desc' = 'asc';
  selectedGroup: string = 'all';
  searchQuery: string = '';

  get availableGroups(): string[] {
    return [...new Set(this.matches.map((m) => m.group).filter(Boolean))].sort();
  }

  ngOnInit() {
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

  getMatchesFiltered(): Match[] {
    let result = this.matches;

    if (this.activeTab === 'predictions') {
      result = result.filter((match) => this.getPredictionForMatch(match.id) !== null);
    } else if (this.activeTab === 'played') {
      result = result.filter((match) => match.homeGoals !== null && match.awayGoals !== null);
    }

    if (this.selectedGroup !== 'all') {
      result = result.filter((match) => match.group === this.selectedGroup);
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.toLowerCase().trim();
      result = result.filter(
        (match) =>
          match.homeTeam?.toLowerCase().includes(q) ||
          match.awayTeam?.toLowerCase().includes(q) ||
          getTeamName(match.homeTeam)?.toLowerCase().includes(q) ||
          getTeamName(match.awayTeam)?.toLowerCase().includes(q) ||
          match.group?.toLowerCase().includes(q),
      );
    }

    return result.slice().sort((a, b) => {
      const diff = new Date(a.matchDate).getTime() - new Date(b.matchDate).getTime();
      return this.sortOrder === 'asc' ? diff : -diff;
    });
  }
}
