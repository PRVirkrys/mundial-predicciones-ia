import { DatePipe } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { PredictionForm } from '../prediction-form/prediction-form';
import { Match } from '../../../core/models/match.model';
import { Prediction } from '../../../core/models/prediction.model';
import { getTeamName } from '../../../utils/team-names';

@Component({
  selector: 'app-match-card',
  imports: [LucideAngularModule, PredictionForm, DatePipe],
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

  get isExact(): boolean {
    return this.prediction?.correctWinner === true && this.prediction?.correctScore === true;
  }

  get isWinnerOnly(): boolean {
    return this.prediction?.correctWinner === true && this.prediction?.correctScore === false;
  }

  get isFailed(): boolean {
    return this.prediction?.correctWinner === false;
  }

  get groupOrRound(): string {
    if (this.match.group) return this.match.group;
    const labels: Record<string, string> = {
      'Round of 32':  'Dieciseisavos',
      'Round of 16':  'Octavos',
      'Quarter-final': 'Cuartos de final',
      'Semi-final':   'Semifinal',
      'Final':        'Final',
    };
    return labels[this.match.round] ?? this.match.round;
  }

  teamName(name: string): string {
    return getTeamName(name);
  }

  onPredictionSaved() {
    this.predictionSaved.emit();
  }
}
