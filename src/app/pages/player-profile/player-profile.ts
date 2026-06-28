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
    { key: 'third',   label: 'Tercer puesto',     test: (r: string) => r === 'Match for third place' },
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

  get isSegmentedView(): boolean {
    return this.sortOrder === 'closest';
  }

  private get filteredBase(): Prediction[] {
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

  get filteredPredictions(): Prediction[] {
    return this.filteredBase;
  }

  get filteredUpcomingPredictions(): Prediction[] {
    return this.filteredBase.filter(
      (p) => p.match.homeGoals === null || p.match.awayGoals === null,
    );
  }

  get filteredPlayedPredictions(): Prediction[] {
    return this.filteredBase
      .filter((p) => p.match.homeGoals !== null && p.match.awayGoals !== null)
      .sort((a, b) => new Date(b.match.matchDate).getTime() - new Date(a.match.matchDate).getTime());
  }

  private readonly roundLabel: Record<string, string> = {
    'Round of 32':   'Dieciseisavos',
    'Round of 16':   'Octavos',
    'Quarter-final': 'Cuartos de final',
    'Semi-final':             'Semifinal',
    'Match for third place':  'Tercer puesto',
    'Final':                  'Final',
  };

  private buildSections(predictions: Prediction[]): { label: string; predictions: Prediction[] }[] {
    type Sec = { label: string; phaseKey: string; group: string | null; items: Prediction[] };
    const map = new Map<string, Sec>();
    const phaseOrder = ['group', 'round32', 'round16', 'qf', 'sf', 'third', 'final'];

    for (const p of predictions) {
      const phaseKey = this.phases.find((ph) => ph.test(p.match.round))?.key ?? 'unknown';
      const key = p.match.group ? `g_${p.match.group}` : phaseKey;
      const label = p.match.group ?? this.roundLabel[p.match.round] ?? p.match.round;
      if (!map.has(key)) map.set(key, { label, phaseKey, group: p.match.group ?? null, items: [] });
      map.get(key)!.items.push(p);
    }

    return [...map.values()]
      .sort((a, b) => {
        const oi = phaseOrder.indexOf(a.phaseKey);
        const oj = phaseOrder.indexOf(b.phaseKey);
        if (oi !== oj) return oi - oj;
        return (a.group ?? '').localeCompare(b.group ?? '');
      })
      .map((s) => ({ label: s.label, predictions: s.items }));
  }

  get sectionedAll(): { label: string; predictions: Prediction[] }[] {
    return this.buildSections(this.filteredBase);
  }

  get sectionedUpcoming(): { label: string; predictions: Prediction[] }[] {
    return this.buildSections(
      this.filteredBase.filter((p) => p.match.homeGoals === null || p.match.awayGoals === null),
    );
  }

  get sectionedPlayed(): { label: string; predictions: Prediction[] }[] {
    return this.buildSections(
      this.filteredBase.filter((p) => p.match.homeGoals !== null && p.match.awayGoals !== null),
    );
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
