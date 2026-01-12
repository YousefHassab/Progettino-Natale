import { Injectable } from '@angular/core';
import { Firestore, collection, addDoc, query, where, orderBy, getDocs } from '@angular/fire/firestore';

export interface GameTransaction {
  uid: string;
  gameType: 'slotMachine' | 'blackjack' | 'roulette';
  betAmount: number;
  winAmount: number;
  result: 'win' | 'loss' | 'draw';
  timestamp: Date;
  details?: any;
}

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private demoTransactions: GameTransaction[] = [];

  constructor(private firestore: Firestore) {}

  // Registra una transazione di gioco
  async recordTransaction(transaction: GameTransaction): Promise<string> {
    // Prima prova Firestore
    if (this.firestore) {
      try {
        const transactionsRef = collection(this.firestore, 'gameTransactions');
        const docRef = await addDoc(transactionsRef, {
          ...transaction,
          timestamp: new Date()
        });
        return docRef.id;
      } catch (error) {
        console.log('Firestore non disponibile, salvando in demo');
      }
    }
    
    // Demo mode
    this.demoTransactions.push({
      ...transaction,
      timestamp: new Date()
    });
    
    // Limita a 100 transazioni per performance
    if (this.demoTransactions.length > 100) {
      this.demoTransactions = this.demoTransactions.slice(-100);
    }
    
    // Salva in localStorage
    localStorage.setItem('demoTransactions', JSON.stringify(this.demoTransactions));
    
    return 'demo-' + Date.now();
  }

  // Ottieni la cronologia delle transazioni di un utente
  async getUserTransactions(uid: string, limit: number = 10): Promise<GameTransaction[]> {
    // Carica da localStorage se disponibile
    const saved = localStorage.getItem('demoTransactions');
    if (saved) {
      try {
        this.demoTransactions = JSON.parse(saved);
      } catch (e) {
        console.error('Error loading transactions', e);
      }
    }
    
    // Filtra per uid e ordina per timestamp
    const userTransactions = this.demoTransactions
      .filter(t => t.uid === uid)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
    
    return userTransactions;
  }

  // Logica per la slot machine
  spinSlotMachine(bet: number): { symbols: string[], winAmount: number, winType: string } {
    const symbols = ['🍒', '🍋', '🍊', '⭐', '🔔', '7️⃣'];
    const result = [
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)],
      symbols[Math.floor(Math.random() * symbols.length)]
    ];

    let winAmount = 0;
    let winType = 'nessuna vincita';

    // Controlla le vincite
    if (result[0] === result[1] && result[1] === result[2]) {
      // Tre simboli uguali - JACKPOT
      if (result[0] === '7️⃣') {
        winAmount = bet * 100; // Jackpot 7-7-7
        winType = 'JACKPOT!';
      } else if (result[0] === '⭐') {
        winAmount = bet * 50;
        winType = 'Tre stelle!';
      } else {
        winAmount = bet * 10;
        winType = 'Tre simboli uguali!';
      }
    } else if (result[0] === result[1] || result[1] === result[2] || result[0] === result[2]) {
      // Due simboli uguali
      winAmount = bet * 2;
      winType = 'Due simboli uguali!';
    }

    return {
      symbols: result,
      winAmount,
      winType
    };
  }

  // Logica per il blackjack (semplificata)
  playBlackjack(bet: number, userAction: 'hit' | 'stand'): { 
    userCards: number[], 
    dealerCards: number[], 
    userTotal: number, 
    dealerTotal: number, 
    result: 'win' | 'loss' | 'draw',
    winAmount: number 
  } {
    // Distribuisci carte iniziali
    let userCards = [this.drawCard(), this.drawCard()];
    let dealerCards = [this.drawCard(), this.drawCard()];

    let userTotal = this.calculateHandTotal(userCards);
    let dealerTotal = this.calculateHandTotal(dealerCards);

    let result: 'win' | 'loss' | 'draw' = 'draw';
    let winAmount = 0;

    // Logica del gioco
    if (userAction === 'hit') {
      userCards.push(this.drawCard());
      userTotal = this.calculateHandTotal(userCards);

      if (userTotal > 21) {
        result = 'loss'; // Sballato
        winAmount = 0;
      }
    }

    // Dealer gioca
    if (result !== 'loss') {
      while (dealerTotal < 17) {
        dealerCards.push(this.drawCard());
        dealerTotal = this.calculateHandTotal(dealerCards);
      }

      // Determina il vincitore
      if (dealerTotal > 21 || userTotal > dealerTotal) {
        result = 'win';
        winAmount = bet * 2; // Vince il doppio della puntata
      } else if (userTotal < dealerTotal) {
        result = 'loss';
        winAmount = 0;
      } else {
        result = 'draw';
        winAmount = bet; // Restituisce la puntata
      }
    }

    return {
      userCards,
      dealerCards,
      userTotal,
      dealerTotal,
      result,
      winAmount
    };
  }

  // Logica per la roulette (base)
  spinRoulette(bet: number, betType: 'number' | 'color' | 'evenOdd', betValue: any): { 
    winningNumber: number, 
    winningColor: 'red' | 'black' | 'green',
    result: 'win' | 'loss',
    winAmount: number 
  } {
    // Genera numero vincente 0-36
    const winningNumber = Math.floor(Math.random() * 37);
    let winningColor: 'red' | 'black' | 'green' = 'green'; // 0 è verde
    
    if (winningNumber !== 0) {
      winningColor = (winningNumber % 2 === 0) ? 'black' : 'red';
    }

    let winAmount = 0;
    let win = false;

    // Controlla la vincita in base al tipo di puntata
    switch (betType) {
      case 'number':
        win = (betValue === winningNumber);
        if (win) winAmount = bet * 35; // Paga 35:1
        break;
      
      case 'color':
        win = (betValue === winningColor);
        if (win) winAmount = bet * 2; // Paga 2:1
        break;
      
      case 'evenOdd':
        if (winningNumber !== 0) {
          const isEven = winningNumber % 2 === 0;
          win = (betValue === 'even' && isEven) || (betValue === 'odd' && !isEven);
          if (win) winAmount = bet * 2; // Paga 2:1
        }
        break;
    }

    return {
      winningNumber,
      winningColor,
      result: win ? 'win' : 'loss',
      winAmount
    };
  }

  // Helper functions
  private drawCard(): number {
    return Math.min(Math.floor(Math.random() * 11) + 1, 10); // Carte 1-10
  }

  private calculateHandTotal(cards: number[]): number {
    let total = cards.reduce((sum, card) => sum + card, 0);
    
    // Gestisci l'asso (qui semplificato)
    if (cards.includes(1) && total <= 11) {
      total += 10; // Asso vale 11
    }
    
    return total;
  }
}
