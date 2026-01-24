import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { UserService, UserData } from '../../services/user.service';
import { GameService } from '../../services/game.service';

@Component({
  selector: 'app-slot-machine',
  templateUrl: './slot-machine.component.html',
  styleUrls: ['./slot-machine.component.scss']
})
export class SlotMachineComponent implements OnInit {
  user: any = null;
  userData: UserData | null = null;
  isSpinning = false;
  reels: string[] = Array(20).fill('?'); // Griglia 4x5
  betAmount = 10;
  betAmounts = [10, 25, 50, 100];
  lastResult: any = null;

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private gameService: GameService
  ) {}

  ngOnInit() {
    this.authService.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.userService.getUserData(user.uid).subscribe(data => this.userData = data);
      }
    });
  }

  setBetAmount(amount: number) { this.betAmount = amount; }

  canSpin(): boolean {
    return !this.isSpinning && this.user && this.userData && this.userData.credits >= this.betAmount;
  }

  async spin() {
    if (!this.canSpin()) return;

    this.isSpinning = true;
    this.lastResult = null;

    await this.animateSpin();

    const result = this.gameService.spinSlotMachine(this.betAmount);
    this.reels = result.symbols;

    const won = result.winAmount > 0;
    await this.userService.updateGameStats(this.user.uid, 'slotMachine', won, result.winAmount);
    
    this.lastResult = {
      winAmount: result.winAmount,
      message: won ? result.winType : 'Riprova!'
    };

    this.isSpinning = false;
  }

  private async animateSpin(): Promise<void> {
    const symbols = ['🍒', '🍋', '🍊', '⭐', '🔔', '7️⃣'];
    for (let i = 0; i < 15; i++) {
      this.reels = Array.from({ length: 20 }, () => symbols[Math.floor(Math.random() * symbols.length)]);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}