import { ChangeDetectorRef, Component, DestroyRef, OnInit } from '@angular/core';
import { Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { forkJoin } from 'rxjs';
import { LucideAngularModule } from 'lucide-angular';
import { PredictionsList } from '../../shared/components/predictions-list/predictions-list';
import { UserService } from '../../core/services/user.service';
import { PredictionService } from '../../core/services/prediction.service';
import { User } from '../../core/models/user.model';
import { Prediction } from '../../core/models/prediction.model';

@Component({
  selector: 'app-player-profile',
  imports: [PredictionsList, LucideAngularModule],
  templateUrl: './player-profile.html',
  styleUrl: './player-profile.css',
})
export class PlayerProfile implements OnInit {
  user: User | null = null;
  predictions: Prediction[] = [];
  loading = true;
  showAll = false;

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

  get displayLimit(): number | null {
    return this.showAll ? null : 4;
  }

  get hasMore(): boolean {
    return this.predictions.length > 4;
  }

  goBack() {
    this.location.back();
  }
}
