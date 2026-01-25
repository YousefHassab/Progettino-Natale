import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-blackjack',
  templateUrl: './blackjack.component.html',
  styleUrls: ['./blackjack.component.css']
})
export class BlackjackComponent implements OnInit {
  balance: number = 0;
  bet: number = 0;
  gameStarted = false;
  gameOver = false;
  message = '';
  deck: any[] = [];
  playerHand: any[] = [];
  dealerHand: any[] = [];
  playerScore = 0;
  dealerScore = 0;
  canDouble = false;

  constructor(private auth: AuthService, private router: Router) {}
  ngOnInit() { this.auth.userBalance$.subscribe(b => this.balance = b); }

  createDeck() {
    const suits = ['♠','♥','♦','♣'];
    const values = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    this.deck = [];
    for(let s of suits) for(let v of values) this.deck.push({val:v, suit:s});
  }

  draw() {
    const idx = Math.floor(Math.random() * this.deck.length);
    return this.deck.splice(idx, 1)[0];
  }

  calc(hand: any[]) {
    let score = 0, aces = 0;
    for(let c of hand) {
      if(['J','Q','K'].includes(c.val)) score+=10;
      else if(c.val==='A') { score+=11; aces++; }
      else score+=parseInt(c.val);
    }
    while(score>21 && aces>0) { score-=10; aces--; }
    return score;
  }

  startGame(amt: number) {
    if(amt > this.balance) { alert("Saldo insufficiente!"); return; }
    this.bet = amt;
    this.balance -= amt;
    this.createDeck();
    this.playerHand = [this.draw(), this.draw()];
    this.dealerHand = [this.draw()];
    this.gameStarted = true;
    this.gameOver = false; // Reset importante
    this.message = '';     // Reset importante
    this.canDouble = true;
    this.updateScores();

    if(this.playerScore === 21) this.endGame('BLACKJACK! 💎', 2.5);
  }

  hit() {
    this.canDouble = false;
    this.playerHand.push(this.draw());
    this.updateScores();
    if(this.playerScore > 21) this.endGame('HAI SBALLATO 💥', 0);
  }

  double() {
    if(this.balance < this.bet) return;
    this.balance -= this.bet;
    this.bet *= 2;
    this.playerHand.push(this.draw());
    this.updateScores();
    if(this.playerScore > 21) this.endGame('SBALLATO (2X) 💥', 0);
    else this.stand();
  }

  async stand() {
    while(this.dealerScore < 17) {
      this.dealerHand.push(this.draw());
      this.updateScores();
      await new Promise(r => setTimeout(r, 800));
    }
    if(this.dealerScore > 21) this.endGame('DEALER SBALLATO! 🏆', 2);
    else if(this.dealerScore > this.playerScore) this.endGame('IL BANCO VINCE 😞', 0);
    else if(this.dealerScore < this.playerScore) this.endGame('HAI VINTO! 🎉', 2);
    else this.endGame('PAREGGIO 🤝', 1);
  }

  updateScores() {
    this.playerScore = this.calc(this.playerHand);
    this.dealerScore = this.calc(this.dealerHand);
  }

  endGame(msg: string, multiplier: number) {
    this.message = msg;
    this.balance += this.bet * multiplier;
    this.auth.saveBalance(this.balance);
    this.gameOver = true; // Questo fa apparire il messaggio
  }

  // Nuova funzione per chiudere il messaggio e resettare il tavolo
  resetTable() {
    this.gameOver = false;
    this.gameStarted = false; // Torna alla scelta fiches
    this.message = '';
    this.playerHand = [];
    this.dealerHand = [];
  }

  goHome() { this.router.navigate(['/home']); }
}
