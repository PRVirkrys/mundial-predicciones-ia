import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Prediction } from '../models/prediction.model';

@Injectable({
  providedIn: 'root',
})
export class PredictionService {
  private apiUrl = `http://${window.location.hostname}:8081`;

  constructor(private http: HttpClient) {}

  getPredictions(): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${this.apiUrl}/predictions`);
  }

  getPredictionsByUser(userId: number): Observable<Prediction[]> {
    return this.http.get<Prediction[]>(`${this.apiUrl}/predictions/${userId}`);
  }

  createPrediction(
    userId: number,
    matchId: number,
    homeGoals: number,
    awayGoals: number,
  ): Observable<Prediction> {
    const url = `${this.apiUrl}/predictions?userId=${userId}&matchId=${matchId}&homeGoals=${homeGoals}&awayGoals=${awayGoals}`;
    return this.http.post<Prediction>(url, null);
  }

  updatePrediction(
    predictionId: number,
    homeGoals: number,
    awayGoals: number,
  ): Observable<Prediction> {
    const url = `${this.apiUrl}/predictions/${predictionId}?homeGoals=${homeGoals}&awayGoals=${awayGoals}`;
    return this.http.put<Prediction>(url, null);
  }

  evaluatePredictions(matchId: number): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/predictions/evaluate/${matchId}`, null);
  }
}
