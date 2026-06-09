import { DatePipe, NgClass } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PredictionForm } from '../prediction-form/prediction-form';
import { Match } from '../../../core/models/match.model';
import { Prediction } from '../../../core/models/prediction.model';
import { getTeamName } from '../../../utils/team-names';

@Component({
  selector: 'app-match-card',
  imports: [LucideAngularModule, NgClass, PredictionForm, DatePipe],
  templateUrl: './match-card.html',
  styleUrl: './match-card.css',
})
export class MatchCard {
  @Input() match!: Match;
  @Input() prediction: Prediction | null = null;
  @Output() predictionSaved: EventEmitter<void> = new EventEmitter<void>();

  get isPredicted(): boolean {
    return this.prediction !== null;
  }

  get isPlayed(): boolean {
    return this.match?.homeGoals != null;
  }

  get isPredictionCorrect(): boolean {
    return this.prediction?.correctWinner === true;
  }

  teamName(name: string): string {
    return getTeamName(name);
  }

  onPredictionSaved() {
    this.predictionSaved.emit();
  }
}
