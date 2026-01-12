import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import { GameService } from '../../services/game.service';

interface SpinResult {
  winningNumber: number;
  winningColor: 'red' | 'black' | 'green';
  winAmount: number;
}

@Component({
  selector: 'app-roulette',
  templateUrl: './roulette.component.html',
  styleUrls: ['./roulette.component.scss']
})
export class RouletteComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  
  // Numeri della roulette (1-36 più 0)
  numbers: number[] = Array.from({length: 36}, (_, i) => i + 1);
  wheelNumbers: number[] = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  
  // Stato del gioco
  isSpinning = false;
  ballPosition = 0;
  winningNumber: number | null = null;
  
  // Puntata
  betAmount = 10;
  minBet = 10;
  maxBet = 500;
  betAmounts = [10, 25, 50, 100, 250];
  
  // Scommessa selezionata
  selectedBet: 'number' | 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36' | null = null;
  selectedValue: any = null;
  
  // Risultato ultima partita
  lastResult: SpinResult | null = null;
  lastNumber: number | null = null;

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

  // Controlla se un numero è rosso (numeri dispari nella sequenza americana)
  isRed(number: number): boolean {
    const redNumbers = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
    return redNumbers.includes(number);
  }

  isBlack(number: number): boolean {
    return number !== 0 && !this.isRed(number);
  }

  setBetAmount(amount: number) {
    if (amount >= this.minBet && amount <= this.maxBet) {
      this.betAmount = amount;
    }
  }

  // Scommessa su numero specifico
  placeNumberBet(number: number) {
    this.selectedBet = 'number';
    this.selectedValue = number;
  }

  // Scommessa esterna (rosso/nero/pari/dispari)
  placeOutsideBet(betType: 'red' | 'black' | 'even' | 'odd' | '1-18' | '19-36') {
    this.selectedBet = betType;
    this.selectedValue = betType;
  }

  canSpin(): boolean {
    return !this.isSpinning && 
           this.user !== null && 
           this.userData !== null && 
           this.userData.credits >= this.betAmount &&
           this.selectedBet !== null;
  }

  async spin() {
    if (!this.canSpin()) {
      if (!this.user) {
        alert('Devi accedere per giocare!');
      } else if (this.userData && this.userData.credits < this.betAmount) {
        alert('Crediti insufficienti!');
      } else if (!this.selectedBet) {
        alert('Seleziona una scommessa prima di giocare!');
      }
      return;
    }

    this.isSpinning = true;
    this.lastResult = null;
    this.winningNumber = null;

    // Animazione della rotazione
    await this.animateSpin();

    // Determina il risultato
    const result = this.determineResult();
    
    // Aggiorna l'utente
    const won = result.winAmount > 0;
    await this.userService.updateGameStats(
      this.user.uid,
      'roulette',
      won,
      result.winAmount
    );

    // Registra la transazione
    await this.gameService.recordTransaction({
      uid: this.user.uid,
      gameType: 'roulette',
      betAmount: this.betAmount,
      winAmount: result.winAmount,
      result: won ? 'win' : 'loss',
      timestamp: new Date(),
      details: {
        betType: this.selectedBet,
        betValue: this.selectedValue,
        winningNumber: result.winningNumber,
        winningColor: result.winningColor
      }
    });

    // Mostra il risultato
    this.lastResult = result;
    this.lastNumber = result.winningNumber;
    this.winningNumber = result.winningNumber;

    // Ricarica i dati utente
    if (this.user) {
      this.userService.getUserData(this.user.uid).subscribe((data) => {
        this.userData = data;
      });
    }

    this.isSpinning = false;
  }

  private async animateSpin(): Promise<void> {
    const spinDuration = 3000; // 3 secondi
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / spinDuration;
        
        // Rotazione esponenziale (rallenta verso la fine)
        const rotation = 3600 * (1 - Math.pow(1 - progress, 3));
        this.ballPosition = rotation;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      animate();
    });
  }

  private determineResult(): SpinResult {
    // Genera numero vincente 0-36
    const winningNumber = Math.floor(Math.random() * 37);
    let winningColor: 'red' | 'black' | 'green' = 'green';
    
    if (winningNumber !== 0) {
      winningColor = this.isRed(winningNumber) ? 'red' : 'black';
    }

    // Calcola se la scommessa vince
    let win = false;
    let multiplier = 1;

    switch (this.selectedBet) {
      case 'number':
        win = (this.selectedValue === winningNumber);
        multiplier = 35; // Paga 35:1
        break;
      
      case 'red':
        win = (winningColor === 'red');
        multiplier = 2; // Paga 2:1
        break;
      
      case 'black':
        win = (winningColor === 'black');
        multiplier = 2;
        break;
      
      case 'even':
        win = (winningNumber !== 0 && winningNumber % 2 === 0);
        multiplier = 2;
        break;
      
      case 'odd':
        win = (winningNumber !== 0 && winningNumber % 2 === 1);
        multiplier = 2;
        break;
      
      case '1-18':
        win = (winningNumber >= 1 && winningNumber <= 18);
        multiplier = 2;
        break;
      
      case '19-36':
        win = (winningNumber >= 19 && winningNumber <= 36);
        multiplier = 2;
        break;
    }

    const winAmount = win ? this.betAmount * multiplier : 0;

    return {
      winningNumber,
      winningColor,
      winAmount
    };
  }

  getBetTypeName(): string {
    if (!this.selectedBet) return '';
    
    const names: {[key: string]: string} = {
      'number': 'Numero',
      'red': 'Rosso',
      'black': 'Nero',
      'even': 'Pari',
      'odd': 'Dispari',
      '1-18': '1-18',
      '19-36': '19-36'
    };
    
    return names[this.selectedBet];
  }

  getPotentialWin(): number {
    if (!this.selectedBet) return 0;
    
    const multipliers: {[key: string]: number} = {
      'number': 35,
      'red': 2,
      'black': 2,
      'even': 2,
      'odd': 2,
      '1-18': 2,
      '19-36': 2
    };
    
    return this.betAmount * (multipliers[this.selectedBet] || 1);
  }

  resetBet() {
    this.selectedBet = null;
    this.selectedValue = null;
  }
}
