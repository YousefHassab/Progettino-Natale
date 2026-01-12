import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-blackjack',
  templateUrl: './blackjack.component.html',
  styleUrls: ['./blackjack.component.scss']
})
export class BlackjackComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  
  // Stato del gioco
  gameStarted = false;
  gameOver = false;
  gameResult: 'win' | 'loss' | 'draw' | null = null;
  dealerPlaying = false;
  
  // Puntata
  betAmount = 50;
  minBet = 10;
  maxBet = 500;
  betAmounts = [10, 25, 50, 100, 250];
  winAmount = 0;
  
  // Carte
  playerCards: number[] = [];
  dealerCards: number[] = [];
  playerTotal = 0;
  dealerTotal = 0;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private gameService: GameService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(async (user) => {
      this.user = user;
      if (user) {
        this.userService.getUserData(user.uid).subscribe((data) => {
          this.userData = data;
        });
      }
    });
  }

  setBetAmount(amount: number) {
    if (amount >= this.minBet && amount <= this.maxBet) {
      this.betAmount = amount;
    }
  }

  canStartGame(): boolean {
    return !this.gameStarted && this.user !== null && this.userData !== null && 
           this.userData.credits >= this.betAmount;
  }

  getCardDisplay(card: number): string {
    if (card === 1) return 'A';
    if (card === 11) return 'J';
    if (card === 12) return 'Q';
    if (card === 13) return 'K';
    return card.toString();
  }

  async startGame() {
    if (!this.canStartGame()) {
      if (!this.user) {
        alert('Devi accedere per giocare!');
      } else if (this.userData && this.userData.credits < this.betAmount) {
        alert('Crediti insufficienti!');
      }
      return;
    }

    // Sottrai la puntata
    await this.userService.subtractCredits(this.user.uid, this.betAmount);
    
    this.gameStarted = true;
    this.gameOver = false;
    this.gameResult = null;
    this.dealerPlaying = false;
    this.winAmount = 0;
    
    // Distribuisci carte iniziali
    this.playerCards = [this.drawCard(), this.drawCard()];
    this.dealerCards = [this.drawCard(), this.drawCard()];
    
    this.calculateTotals();
    
    // Controlla blackjack immediato
    if (this.playerTotal === 21) {
      setTimeout(() => this.stand(), 1000);
    }
  }

  async hit() {
    if (!this.gameStarted || this.gameOver || this.dealerPlaying) return;
    
    this.playerCards.push(this.drawCard());
    this.calculateTotals();
    
    // Controlla se il giocatore ha sballato
    if (this.playerTotal > 21) {
      await this.endGame('loss');
    }
  }

  async stand() {
    if (!this.gameStarted || this.gameOver || this.dealerPlaying) return;
    
    this.dealerPlaying = true;
    
    // Riveliamo la seconda carta del dealer
    this.calculateTotals();
    
    // Il banco gioca
    await this.dealerPlay();
    
    this.dealerPlaying = false;
  }

  private async dealerPlay() {
    while (this.dealerTotal < 17) {
      await this.delay(1000);
      this.dealerCards.push(this.drawCard());
      this.calculateTotals();
    }
    
    // Determina il vincitore dopo che il dealer ha finito
    await this.determineWinner();
  }

  private async determineWinner() {
    if (this.dealerTotal > 21 || this.playerTotal > this.dealerTotal) {
      await this.endGame('win');
    } else if (this.playerTotal < this.dealerTotal) {
      await this.endGame('loss');
    } else {
      await this.endGame('draw');
    }
  }

  private async endGame(result: 'win' | 'loss' | 'draw') {
    this.gameOver = true;
    this.gameResult = result;
    
    // Calcola la vincita
    let multiplier = 1;
    if (result === 'win') {
      // Blackjack naturale (21 con 2 carte)
      if (this.playerCards.length === 2 && this.playerTotal === 21) {
        multiplier = 2.5;
      } else {
        multiplier = 2;
      }
      this.winAmount = this.betAmount * multiplier;
    } else if (result === 'draw') {
      this.winAmount = this.betAmount;
    } else {
      this.winAmount = 0;
    }
    
    // Aggiorna i dati dell'utente
    if (this.user) {
      const won = result === 'win';
      await this.userService.updateGameStats(
        this.user.uid,
        'blackjack',
        won,
        this.winAmount
      );
      
      // Registra la transazione
      await this.gameService.recordTransaction({
        uid: this.user.uid,
        gameType: 'blackjack',
        betAmount: this.betAmount,
        winAmount: this.winAmount,
        result: result,
        timestamp: new Date(),
        details: {
          playerCards: this.playerCards,
          dealerCards: this.dealerCards,
          playerTotal: this.playerTotal,
          dealerTotal: this.dealerTotal
        }
      });
      
      // Ricarica i dati utente
      this.userService.getUserData(this.user.uid).subscribe((data) => {
        this.userData = data;
      });
    }
  }

  resetGame() {
    this.gameStarted = false;
    this.gameOver = false;
    this.gameResult = null;
    this.dealerPlaying = false;
    this.playerCards = [];
    this.dealerCards = [];
    this.playerTotal = 0;
    this.dealerTotal = 0;
    this.winAmount = 0;
  }

  getResultMessage(): string {
    switch (this.gameResult) {
      case 'win':
        return this.playerCards.length === 2 && this.playerTotal === 21 
          ? 'BLACKJACK! 🎉' 
          : 'HAI VINTO! 🎉';
      case 'loss':
        return this.playerTotal > 21 ? 'SBALLATO! 💥' : 'HAI PERSO 😔';
      case 'draw':
        return 'PAREGGIO 🤝';
      default:
        return '';
    }
  }

  private drawCard(): number {
    // Carte da 1 a 13 (A, 2-10, J, Q, K)
    const card = Math.floor(Math.random() * 13) + 1;
    // Le figure valgono 10
    return card > 10 ? 10 : card;
  }

  private calculateTotals() {
    // Calcola totale giocatore
    this.playerTotal = this.calculateHandTotal(this.playerCards);
    
    // Calcola totale banco
    if (this.gameOver || !this.gameStarted || this.dealerPlaying) {
      this.dealerTotal = this.calculateHandTotal(this.dealerCards);
    } else {
      // Durante il gioco, mostra solo il valore della prima carta del dealer
      const firstCard = this.dealerCards[0];
      this.dealerTotal = firstCard > 10 ? 10 : firstCard;
    }
  }

  private calculateHandTotal(cards: number[]): number {
    let total = 0;
    let aces = 0;
    
    // Prima somma tutte le carte, considerando le figure come 10
    for (const card of cards) {
      if (card === 1) {
        aces++;
        total += 1;
      } else if (card > 10) {
        total += 10;
      } else {
        total += card;
      }
    }
    
    // Gestisci gli assi
    for (let i = 0; i < aces; i++) {
      if (total + 10 <= 21) {
        total += 10;
      }
    }
    
    return total;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
