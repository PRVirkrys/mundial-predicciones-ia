import { ChangeDetectorRef, Component, DestroyRef } from '@angular/core';
import { Router } from '@angular/router';
import { PredictionsList } from '../../shared/components/predictions-list/predictions-list';
import { Auth } from '../../core/services/auth';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PredictionService } from '../../core/services/prediction.service';
import { Prediction } from '../../core/models/prediction.model';

@Component({
  selector: 'app-profile',
  imports: [PredictionsList],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  constructor(
    private auth: Auth,
    private destroyRef: DestroyRef,
    private predictionService: PredictionService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  userId: number | null = null;
  userName = '';
  userScore = 0;
  predictionByUser: Prediction[] = [];
  predictionsByUserAcertedExact: Prediction[] = [];
  predictionAcertedByUserOnlyWinnerTeam: Prediction[] = [];

  ngOnInit() {
    this.auth.currentUser$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((user) => {
      this.userName = user ? user.name || '' : '';
      this.userScore = user ? user.totalScore || 0 : 0;
      this.userId = user ? user.id : null;
      if (user) this.loadUserPredictions(user.id);
      else this.predictionByUser = [];
    });
  }

  loadUserPredictions(userId: number) {
    this.predictionService.getPredictionsByUser(userId).subscribe((data: Prediction[]) => {
      this.predictionByUser = data;

      this.predictionsByUserAcertedExact = this.predictionByUser.filter(
        (p) => p.correctWinner === true && p.correctScore === true,
      );

      this.predictionAcertedByUserOnlyWinnerTeam = this.predictionByUser.filter(
        (p) => p.correctWinner === true && p.correctScore === false,
      );

      this.cdr.detectChanges();
    });
  }

  get showViewAll(): boolean {
    return this.predictionByUser.length > 4;
  }

  goToAllPredictions() {
    this.router.navigate(['/'], { queryParams: { tab: 'predictions' } });
  }
}
