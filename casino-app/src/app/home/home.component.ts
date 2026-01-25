import { Component, OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  currentBalance: number = 0;
  user: any = null;

  constructor(public authService: AuthService, private router: Router) {}

  ngOnInit() {
    // Monitora lo stato dell'utente (Loggato o No)
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
    });

    // Monitora il saldo in tempo reale
    this.authService.userBalance$.subscribe(val => {
      this.currentBalance = val;
    });
  }

  goTo(game: string) {
    this.router.navigate(['/' + game]);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/']);
  }

  // Metodi per i nuovi pulsanti della grafica Royal
  showLogin() { this.router.navigate(['/']); }
  showRegister() { this.router.navigate(['/']); }
  
  async demoLogin() {
    try {
      await this.authService.login('demo@casino.it', 'demo123');
    } catch (e) {
      alert("Crea prima l'utente demo su Firebase o registrati!");
    }
  }
}
