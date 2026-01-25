import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  isRegistering = false;
  isLoading = false;
  message = '';
  successMessage = ''; // Nuovo messaggio verde per successo

  constructor(private authService: AuthService, private router: Router) {}

  toggleMode() {
    this.isRegistering = !this.isRegistering;
    this.message = '';
    this.successMessage = '';
  }

  async submit() {
    this.isLoading = true;
    this.message = '';
    this.successMessage = '';
    
    try {
      if (this.isRegistering) {
        // 1. REGISTRAZIONE
        await this.authService.register(this.email, this.password);
        
        // 2. IMPORTANTE: Disconnettiamo subito l'utente (Firebase fa auto-login)
        await this.authService.logout();
        
        // 3. Mostriamo messaggio di successo e torniamo al Login
        this.successMessage = "✅ Registrazione avvenuta con successo! Ora puoi accedere.";
        this.isRegistering = false; // Torna alla schermata di login
        this.password = ''; // Pulisce la password per sicurezza
      } else {
        // 4. LOGIN NORMALE
        await this.authService.login(this.email, this.password);
        this.router.navigate(['/home']);
      }
    } catch (e: any) {
      // Gestione errori più carina
      if (e.code === 'auth/email-already-in-use') {
        this.message = "Questa email è già registrata.";
      } else if (e.code === 'auth/weak-password') {
        this.message = "La password deve avere almeno 6 caratteri.";
      } else if (e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        this.message = "Email o Password errati.";
      } else {
        this.message = "Errore: " + e.message;
      }
    } finally {
      this.isLoading = false;
    }
  }
}
