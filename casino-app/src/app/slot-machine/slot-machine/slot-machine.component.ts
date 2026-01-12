import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import { GameService } from '../../services/game.service';

interface SpinResult {
  symbols: string[];
  winAmount: number;
  message: string;
}

@Component({
  selector: 'app-slot-machine',
  templateUrl: './slot-machine.component.html',
  styleUrls: ['./slot-machine.component.scss']
})
export class SlotMachineComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  isSpinning = false;
  reels: string[] = ['?', '?', '?'];
  betAmount = 10;
  minBet = 10;
  maxBet = 100;
  betAmounts = [10, 25, 50, 100];
  lastResult: SpinResult | null = null;

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

  canSpin(): boolean {
    return !this.isSpinning && this.user !== null && this.userData !== null && 
           this.userData.credits >= this.betAmount;
  }

  async spin() {
    if (!this.canSpin()) {
      if (!this.user) {
        alert('Devi accedere per giocare!');
      } else if (this.userData && this.userData.credits < this.betAmount) {
        alert('Crediti insufficienti!');
      }
      return;
    }

    this.isSpinning = true;
    this.lastResult = null;

    // Simula l'animazione di rotazione
    await this.animateSpin();

    // Esegue il gioco
    const result = this.gameService.spinSlotMachine(this.betAmount);
    this.reels = result.symbols;

    // Aggiorna i dati dell'utente
    const won = result.winAmount > 0;
    await this.userService.updateGameStats(
      this.user.uid,
      'slotMachine',
      won,
      result.winAmount
    );

    // Registra la transazione
    await this.gameService.recordTransaction({
      uid: this.user.uid,
      gameType: 'slotMachine',
      betAmount: this.betAmount,
      winAmount: result.winAmount,
      result: won ? 'win' : 'loss',
      timestamp: new Date(),
      details: { symbols: result.symbols, winType: result.winType }
    });

    // Mostra il risultato
    this.lastResult = {
      symbols: result.symbols,
      winAmount: result.winAmount,
      message: won ? result.winType : 'Nessuna vincita! Riprova!'
    };

    // Ricarica i dati utente
    if (this.user) {
      this.userService.getUserData(this.user.uid).subscribe((data) => {
        this.userData = data;
      });
    }

    this.isSpinning = false;
  }

  private async animateSpin(): Promise<void> {
    const symbols = ['🍒', '🍋', '🍊', '⭐', '🔔', '7️⃣'];
    const spinDuration = 2000; // 2 secondi
    const interval = 100; // Cambia simbolo ogni 100ms
    const steps = spinDuration / interval;

    return new Promise((resolve) => {
      let step = 0;
      const animation = setInterval(() => {
        this.reels = [
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)],
          symbols[Math.floor(Math.random() * symbols.length)]
        ];
        
        step++;
        if (step >= steps) {
          clearInterval(animation);
          resolve();
        }
      }, interval);
    });
  }
}
