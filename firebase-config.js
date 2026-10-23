// ============================================================
//  CONFIGURAZIONE FIREBASE  (sincronizzazione PC <-> telefono)
// ============================================================
// Finché questo file resta vuoto, l'app funziona lo stesso ma
// SOLO su questo dispositivo (senza sincronizzazione).
//
// Per attivare la sincronizzazione in tempo reale:
//  1) Vai su  https://console.firebase.google.com  (accedi con Google)
//  2) "Crea un progetto" (nome a piacere, puoi saltare Analytics)
//  3) Menu a sinistra -> "Realtime Database" -> "Crea database"
//       - scegli una zona (es. europe-west1)
//       - avvia in "modalità test"
//  4) In alto, icona ingranaggio -> "Impostazioni progetto"
//       -> scorri a "Le tue app" -> icona </> (Web) -> registra l'app
//  5) Copia l'oggetto  firebaseConfig  che ti mostra e incollalo qui sotto,
//     al posto di quello di esempio (tieni le virgolette).
//
// Importante: deve essere presente la riga "databaseURL".
// ============================================================

window.firebaseConfig = {
  // apiKey: "AIza........................",
  // authDomain: "mio-registro.firebaseapp.com",
  // databaseURL: "https://mio-registro-default-rtdb.europe-west1.firebasedatabase.app",
  // projectId: "mio-registro",
  // storageBucket: "mio-registro.appspot.com",
  // messagingSenderId: "000000000000",
  // appId: "1:000000000000:web:xxxxxxxxxxxxxxxx"
};
