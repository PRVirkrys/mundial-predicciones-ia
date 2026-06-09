import { ChangeDetectorRef, Component } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import { Auth } from '../../core/services/auth';
import { FormsModule } from '@angular/forms';
import { timeout, TimeoutError } from 'rxjs';

@Component({
  selector: 'app-login',
  imports: [LucideAngularModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  user: string = '';
  password: string = '';
  loading: boolean = false;
  error: string = '';

  constructor(
    private auth: Auth,
    private cdr: ChangeDetectorRef,
  ) {}

  logIn() {
    this.error = '';
    this.loading = true;

    this.auth.onLogin(this.user, this.password).pipe(timeout(8000)).subscribe({
      next: (user) => {
        localStorage.setItem('user', JSON.stringify(user));
        this.auth.setCurrentUser(user);
        window.location.replace('/');
      },
      error: (err) => {
        this.loading = false;
        if (err instanceof TimeoutError) {
          this.error = 'No se pudo conectar con el servidor. Verifica que el backend esté activo.';
        } else {
          this.error = `Error ${err.status || ''}: ${err.error?.message ?? err.message ?? 'Credenciales incorrectas'}`;
        }
        this.cdr.detectChanges();
      },
    });
  }
}
