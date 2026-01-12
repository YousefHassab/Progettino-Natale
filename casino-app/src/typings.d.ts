// Ignora errori di tipo per rxfire e altre librerie problematiche
declare module 'rxfire/firestore/lite/interfaces' {
  export interface CountSnapshot {
    // Definizione temporanea
  }
}

// Aggiungi altre dichiarazioni se necessario
declare module '*';
