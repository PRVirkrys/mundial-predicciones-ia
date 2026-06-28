import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PredictionsList } from '../../shared/components/predictions-list/predictions-list';
import { UserService } from '../../core/services/user.service';
import { PredictionService } from '../../core/services/prediction.service';
import { getTeamName, normalizeText } from '../../utils/team-names';
import { User } from '../../core/models/user.model';
import { Prediction } from '../../core/models/prediction.model';

@Component({
  selector: 'app-player-profile',
  imports: [PredictionsList, LucideAngularModule, FormsModule],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.css',
})
export class PlayerProfile implements OnInit {
  user: User | null = null;
  predictions: Prediction[] = [];
  loading = true;
  showAll = false;

  searchQuery = '';
  selectedPhase = 'all';
  selectedGroup = 'all';
  selectedResult: 'all' | 'exact' | 'winner' | 'failed' | 'pending' = 'all';
  sortOrder: 'asc' | 'desc' | 'closest' = 'closest';

  readonly phases = [
    { key: 'group',   label: 'Fase de Grupos', test: (r: string) => r?.startsWith('Matchday') },
    { key: 'round32', label: 'Dieciseisavos',   test: (r: string) => r === 'Round of 32' },
    { key: 'round16', label: 'Octavos',          test: (r: string) => r === 'Round of 16' },
    { key: 'qf',      label: 'Cuartos',          test: (r: string) => r === 'Quarter-final' },
    { key: 'sf',      label: 'Semifinal',         test: (r: string) => r === 'Semi-final' },
    { key: 'final',   label: 'Final',             test: (r: string) => r === 'Final' },
  ];

  get availablePhases() {
    return this.phases.filter((p) => this.predictions.some((pred) => p.test(pred.match.round)));
  }

  get availableGroups(): string[] {
    return [...new Set(this.predictions.map((p) => p.match.group).filter(Boolean))].sort();
  }

  get isGroupPhase(): boolean {
    return this.selectedPhase === 'all' || this.selectedPhase === 'group';
  }

  get filteredPredictions(): Prediction[] {
    let result = this.predictions;

    if (this.selectedPhase !== 'all') {
      const phase = this.phases.find((p) => p.key === this.selectedPhase);
      if (phase) result = result.filter((p) => phase.test(p.match.round));
    }

    if (this.selectedGroup !== 'all') {
      result = result.filter((p) => p.match.group === this.selectedGroup);
    }

    if (this.selectedResult !== 'all') {
      result = result.filter((p) => {
        if (this.selectedResult === 'exact')   return p.correctWinner === true  && p.correctScore === true;
        if (this.selectedResult === 'winner')  return p.correctWinner === true  && p.correctScore === false;
        if (this.selectedResult === 'failed')  return p.correctWinner === false;
        if (this.selectedResult === 'pending') return p.correctWinner === null;
        return true;
      });
    }

    if (this.searchQuery.trim()) {
      const q = normalizeText(this.searchQuery.trim());
      result = result.filter(
        (p) =>
          normalizeText(p.match.homeTeam ?? '').includes(q) ||
          normalizeText(p.match.awayTeam ?? '').includes(q) ||
          normalizeText(getTeamName(p.match.homeTeam)).includes(q) ||
          normalizeText(getTeamName(p.match.awayTeam)).includes(q) ||
          normalizeText(p.match.group ?? '').includes(q),
      );
    }

    return result;
  }

  clearSearch() {
    this.searchQuery = '';
  }

  constructor(
    private route: ActivatedRoute,
    private userService: UserService,
    private predictionService: PredictionService,
    private location: Location,
    private destroyRef: DestroyRef,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit() {
    this.route.paramMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const id = Number(params.get('id'));
      if (!id) return;

      forkJoin({
        user: this.userService.getUserById(id),
        predictions: this.predictionService.getPredictionsByUser(id),
      }).subscribe(({ user, predictions }) => {
        this.user = user;
        this.predictions = predictions;
        this.loading = false;
        this.cdr.detectChanges();
      });
    });
  }

  get initials(): string {
    if (!this.user) return '';
    return this.user.name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  get exactPredictions(): Prediction[] {
    return this.predictions.filter((p) => p.correctWinner === true && p.correctScore === true);
  }

  get winnerOnlyPredictions(): Prediction[] {
    return this.predictions.filter((p) => p.correctWinner === true && p.correctScore === false);
  }

  get hasActiveFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.selectedPhase !== 'all' || this.selectedGroup !== 'all';
  }

  goBack() {
    this.location.back();
  }
}
