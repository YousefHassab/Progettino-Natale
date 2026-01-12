import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import { GameService, GameTransaction } from '../../services/game.service';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  transactions: GameTransaction[] = [];
  creditAmount: number = 500;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private gameService: GameService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(async (user) => {
      this.user = user;
      if (user) {
        // Carica dati utente
        this.userService.getUserData(user.uid).subscribe((data) => {
          this.userData = data;
        });

        // Carica transazioni
        this.loadTransactions(user.uid);
      }
    });
  }

  async loadTransactions(uid: string) {
    try {
      this.transactions = await this.gameService.getUserTransactions(uid, 20);
    } catch (error) {
      console.error('Error loading transactions:', error);
    }
  }

  getTotalGames(): number {
    if (!this.userData?.gamesPlayed) return 0;
    const games = this.userData.gamesPlayed;
    return (games.slotMachine || 0) + (games.blackjack || 0) + (games.roulette || 0);
  }

  getGameName(gameType: string): string {
    switch (gameType) {
      case 'slotMachine': return '🎰 Slot Machine';
      case 'blackjack': return '♠️ Blackjack';
      case 'roulette': return '🎲 Roulette';
      default: return gameType;
    }
  }

  getResultText(transaction: GameTransaction): string {
    switch (transaction.result) {
      case 'win': return 'VITTORIA';
      case 'loss': return 'PERDITA';
      case 'draw': return 'PAREGGIO';
      default: return transaction.result;
    }
  }

  async addCredits() {
    if (!this.user || !this.creditAmount || this.creditAmount < 100) return;

    try {
      await this.userService.addCredits(this.user.uid, this.creditAmount);
      
      // Ricarica i dati utente
      this.userService.getUserData(this.user.uid).subscribe((data) => {
        this.userData = data;
      });

      alert(`Aggiunti ${this.creditAmount} crediti con successo!`);
    } catch (error) {
      console.error('Error adding credits:', error);
      alert('Errore nell\'aggiungere crediti');
    }
  }

  updateCreditAmount(event: Event) {
    const input = event.target as HTMLInputElement;
    this.creditAmount = parseInt(input.value) || 0;
  }
}
