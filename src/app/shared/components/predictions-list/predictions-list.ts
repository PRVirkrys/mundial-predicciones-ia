import { Component, Input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Prediction } from '../../../core/models/prediction.model';
import { getTeamName } from '../../../utils/team-names';

@Component({
  selector: 'app-predictions-list',
  imports: [DatePipe],
  templateUrl: './predictions-list.html',
  styleUrl: './predictions-list.css',
})
export class PredictionsList {
  @Input() predictions: Prediction[] = [];
  @Input() limit: number | null = null;
  @Input() sortOrder: 'asc' | 'desc' | 'closest' = 'desc';

  get displayedPredictions(): Prediction[] {
    const sorted = [...this.predictions].sort((a, b) => {
      const dateA = new Date(a.match.matchDate).getTime();
      const dateB = new Date(b.match.matchDate).getTime();
      if (this.sortOrder === 'closest') {
        const now = Date.now();
        return Math.abs(dateA - now) - Math.abs(dateB - now);
      }
      return this.sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
    return this.limit ? sorted.slice(0, this.limit) : sorted;
  }

  teamName(code: string): string {
    return getTeamName(code) || code;
  }

  getBadgeClass(p: Prediction): string {
    const base = 'badge badge-soft badge-sm';
    if (p.correctWinner === null) return `${base} badge-neutral`;
    if (p.correctWinner && p.correctScore) return `${base} badge-success`;
    if (p.correctWinner && !p.correctScore) return `${base} badge-warning`;
    return `${base} badge-error`;
  }

  getBadgeLabel(p: Prediction): string {
    if (p.correctWinner === null) return 'Pendiente';
    if (p.correctWinner && p.correctScore) return 'Exacto ✓';
    if (p.correctWinner && !p.correctScore) return 'Ganador ✓';
    return 'Fallado ✗';
  }
}
