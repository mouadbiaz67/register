# Registro – registro elettronico (progetto di Informatica)

Web app installabile (PWA) scritta in **HTML, CSS e JavaScript**, senza librerie esterne.
Funziona su iPhone e Android: si aggiunge alla schermata Home e si apre a schermo intero come un'app.

## File del progetto
| File | A cosa serve |
|---|---|
| `index.html` | Struttura della pagina, collegamento a manifest, icone e stile |
| `style.css` | Grafica: colori, card, calendari, tendine, menu laterale |
| `app.js` | Logica: schermate, calendario, festivi, medie, salvataggio dati, area docente |
| `manifest.json` | Rende il sito "installabile" (nome, icona, colori, schermo intero) |
| `sw.js` | Service worker: salva i file così l'app funziona anche offline |
| `icons/` | Icona dell'app (due persone + scritta REGISTRO) |

## Accesso
All'apertura l'app mostra la schermata di **Login**.
- Nome utente: **Mouad.Biaz**
- Password: **10082008**

Con "Salva credenziali" attivo non devi più rientrare le volte successive. Per uscire: menu ☰ → **Esci**. Puoi cambiare utente e password dall'**Area docente → Studente**.

> Nota: essendo un progetto, il controllo del login avviene nel codice JavaScript sul telefono (nessun server). Va benissimo per la verifica, ma non è una password "sicura" come quella di un registro vero: chi apre il codice la può leggere.

## Funzioni
- **Home**: materie da monitorare (media sotto 6), assenze da giustificare, giorno navigabile con frecce, striscia rossa *Giornata Festiva* la domenica e nei festivi (Natale, Pasqua calcolata con l'algoritmo di Gauss, 25 aprile, ecc.), attività del giorno e prossimi compiti.
- **Agenda**: calendario mensile, giorni toccabili, trattino giallo nei giorni con verifiche/eventi.
- **Argomenti**, **Compiti**: tendina "Tutte le materie" che filtra per una sola materia.
- **Assenze**: conteggio, giustifica singola (motivazione, campo libero con "Altro") e *Giustifica Tutto*.
- **Voti**: media con grafico ad anello, filtro per periodo (trimestre, pentamestre, anno), dettaglio per materia.
- **Orario scolastico**, **Note**, **Annotazioni**, **Pagelle**.
- **Area docente**: si aggiungono voti, argomenti, compiti, verifiche in agenda, ritardi/assenze/uscite, note e annotazioni. Tutto compare subito nelle schermate dello studente.

I dati sono salvati nel telefono con `localStorage` (formato JSON) e, se colleghi Firebase, anche online per sincronizzarsi tra PC e telefono.

## Sincronizzazione PC ↔ telefono (Firebase, gratis)
Di base ogni dispositivo tiene i propri dati. Per far comparire all'istante su tutti i dispositivi quello che inserisci (voti, assenze, agenda, compiti...), collega un database gratuito:
1. Vai su `https://console.firebase.google.com` e accedi con un account Google. Crea un progetto (nome a piacere).
2. Nel menu a sinistra apri **Realtime Database** → **Crea database** → scegli una zona (es. *europe-west1*) → avvia in **modalità test**.
3. Icona ingranaggio in alto → **Impostazioni progetto** → sezione **Le tue app** → icona **</>** (Web) → registra l'app.
4. Copia l'oggetto `firebaseConfig` che compare e incollalo dentro il file **`firebase-config.js`** (al posto di quello di esempio, tenendo le virgolette). Deve esserci la riga `databaseURL`.
5. Ricarica l'app su PC e telefono: nell'**Area docente** vedrai *"☁ Sincronizzazione online attiva"*. Ora quello che scrivi dal PC appare subito sul telefono.

Nota: la "modalità test" lascia il database aperto (va bene per il progetto e per la demo, ma non è protetto). Se vuoi, più avanti si possono aggiungere delle regole di sicurezza.

## Come metterla online gratis (GitHub Pages) e installarla sull'iPhone
1. Crea un account su github.com e un nuovo repository pubblico, ad esempio `registro`.
2. Carica tutti i file di questa cartella (anche la cartella `icons`) con *Add file → Upload files*.
3. Vai in *Settings → Pages*, scegli *Branch: main* e *Save*. Dopo un minuto il sito è su `https://TUONOME.github.io/registro/`.
4. Sull'iPhone apri quell'indirizzo con **Safari**, tocca **Condividi** (quadrato con freccia) → **Aggiungi alla schermata Home** → **Aggiungi**.
5. Sulla Home compare l'icona **Registro**: si apre a schermo intero e funziona anche senza internet.

Per provarla sul PC basta aprire `index.html` con Chrome o Edge.
