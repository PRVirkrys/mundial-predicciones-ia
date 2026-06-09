import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Match } from '../../../core/models/match.model';
import { Prediction } from '../../../core/models/prediction.model';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PredictionService } from '../../../core/services/prediction.service';
import { Auth } from '../../../core/services/auth';
import { User } from '../../../core/models/user.model';

@Component({
  selector: 'app-prediction-form',
  imports: [LucideAngularModule, DatePipe, FormsModule],
  templateUrl: './prediction-form.html',
  styleUrl: './prediction-form.css',
})
export class PredictionForm {
  constructor(
    private predictionService: PredictionService,
    private auth: Auth,
  ) {}

  userHomeGoals: number | null = null;
  userAwayGoals: number | null = null;

  @Input({ required: true }) match!: Match;
  @Input() prediction: Prediction | null = null;
  //poner output aqui de event saved para un toast o algo asi
  @Output() predictionSaved: EventEmitter<void> = new EventEmitter<void>();

  @ViewChild('predictionModal')
  predictionModal!: ElementRef<HTMLDialogElement>;

  openModal(): void {
    this.userHomeGoals = this.prediction?.predictedHomeGoals ?? null;
    this.userAwayGoals = this.prediction?.predictedAwayGoals ?? null;
    this.predictionModal.nativeElement.showModal();
  }

  savePrediction() {
    if (this.userHomeGoals === null || this.userAwayGoals === null) {
      return; //esto saca de la funcion
      //aqui podrai agregar un mensaje de error con los inputs
    } else if (this.prediction?.id != null) {
      console.log(`${this.prediction}`);
      this.predictionService
        .updatePrediction(this.prediction.id, this.userHomeGoals, this.userAwayGoals)
        .subscribe({
          next: () => {
            console.log(`Prediddcion actualizada`);
            this.predictionModal.nativeElement.close();
            this.predictionSaved.emit();
          },
          error: () => {
            console.log('Error al actualizar la prediccion');
          },
        });
    } else {
      const user: User | null = this.auth.getCurrentUser();
      if (!user) return;
      this.predictionService
        .createPrediction(user.id, this.match.id, this.userHomeGoals, this.userAwayGoals)
        .subscribe({
          next: () => {
            console.log(`Prediddcion guardada`);
            this.predictionModal.nativeElement.close();
            this.predictionSaved.emit();
          },
          error: () => {
            console.log('Error al guardar la prediccion');
          },
        });
    }
  }
}
