/* =========================================================
   REGISTRO - registro elettronico (progetto scolastico)
   Tutti i dati sono salvati sul telefono (localStorage).
   ========================================================= */
'use strict';

/* ---------- Utilità per le date ---------- */
const MESI = ['gennaio', 'febbraio', 'marzo', 'aprile', 'maggio', 'giugno', 'luglio', 'agosto', 'settembre', 'ottobre', 'novembre', 'dicembre'];
const GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
const GG = ['DOM', 'LUN', 'MAR', 'MER', 'GIO', 'VEN', 'SAB'];
const pad = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const oggi = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const capWords = s => s.split(' ').map(cap).join(' ');
const fmtShort = s => { const d = parse(s); return `${d.getDate()} ${cap(MESI[d.getMonth()].slice(0, 3))}`; };   // 14 Ott
const fmtLong = s => { const d = parse(s); return `${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`; }; // sabato 17 ottobre
const fmtFull = s => { const d = parse(s); return `${cap(GIORNI[d.getDay()])}, ${d.getDate()} ${cap(MESI[d.getMonth()])} ${d.getFullYear()}`; };
const fmtNum = s => { const d = parse(s); return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`; };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const fmtVoto = v => (Math.round(v * 100) / 100).toString();

/* ---------- Giorni festivi ---------- */
function pasqua(y) { // algoritmo di Gauss/Meeus
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4;
  const f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mese = Math.floor((h + l - 7 * m + 114) / 31), giorno = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(y, mese - 1, giorno);
}
const FESTE = { '01-01': 'Capodanno', '01-06': 'Epifania', '04-25': 'Festa della Liberazione', '05-01': 'Festa del Lavoro', '06-02': 'Festa della Repubblica', '08-15': 'Ferragosto', '11-01': 'Ognissanti', '12-08': 'Immacolata Concezione', '12-25': 'Natale', '12-26': 'Santo Stefano' };
function festivo(s) { // restituisce il motivo se il giorno è festivo, altrimenti null
  const d = parse(s), md = s.slice(5);
  const ev = DB.agenda.find(e => e.data === s && e.tipo === 'Giorno festivo');
  if (ev) return ev.titolo;
  if (FESTE[md]) return FESTE[md];
  const p = pasqua(d.getFullYear());
  if (iso(p) === s) return 'Pasqua';
  if (iso(addDays(p, 1)) === s) return 'Lunedì dell\'Angelo';
  if (d >= addDays(p, -3) && d <= addDays(p, 2)) return 'Vacanze di Pasqua';
  if ((d.getMonth() === 11 && d.getDate() >= 23) || (d.getMonth() === 0 && d.getDate() <= 6)) return 'Vacanze di Natale';
  if ((d.getMonth() === 5 && d.getDate() > 10) || d.getMonth() === 6 || d.getMonth() === 7 || (d.getMonth() === 8 && d.getDate() < 10)) return 'Vacanze estive';
  if (d.getDay() === 0) return 'Domenica';
  return null;
}

/* ---------- Periodi scolastici ---------- */
function annoInizio(d = oggi()) { return d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1; }
function periodi() {
  const y = annoInizio();
  return {
    T1: { l: 'Primo Trimestre', da: `${y}-09-01`, a: `${y}-12-31` },
    P2: { l: 'Secondo Pentamestre', da: `${y + 1}-01-01`, a: `${y + 1}-08-31` },
    AN: { l: 'Anno Intero', da: `${y}-09-01`, a: `${y + 1}-08-31` }
  };
}
const periodoCorrente = () => (oggi().getMonth() >= 8 ? 'T1' : 'P2');
const nelPeriodo = (s, p) => { const P = periodi()[p]; return s >= P.da && s <= P.a; };

/* ---------- Materie e orario ---------- */
const MATERIE = ["GEST. PROG. ORG. D'IMPR.", 'INFORMATICA', 'INGLESE', 'ITALIANO', 'MATEMATICA', 'SCIENZE MOTORIE E SPORTIVE', 'SIS. E RETI', 'STORIA', 'T.P.S.I.T.'];
const DOCENTI = {
  "GEST. PROG. ORG. D'IMPR.": 'MATTAREI DANIELA', 'INFORMATICA': 'URSOMANDO ALESSANDRO / ANNINO SANTO DOMENICO', 'ITALIANO': 'PANTANO GIULIANO',
  'INGLESE': 'GUALANO RUBEN', 'MATEMATICA': 'CROCE ROBERTA', 'SCIENZE MOTORIE E SPORTIVE': 'VICENTINI MAURIZIO', 'SIS. E RETI': 'PATTI ALESSANDRO / ANNINO SANTO DOMENICO',
  'STORIA': 'PANTANO GIULIANO', 'T.P.S.I.T.': 'SANTORO MARTINA / MATTAREI DANIELA'
};
const COLORI = { 'INGLESE': '#e7b9c6', 'INFORMATICA': '#9ed79b', 'MATEMATICA': '#9cc8f0', 'ITALIANO': '#f2c98a', 'STORIA': '#d5b8ec', 'SIS. E RETI': '#8fd6d0', 'T.P.S.I.T.': '#f3a59a', "GEST. PROG. ORG. D'IMPR.": '#c7c58c', 'SCIENZE MOTORIE E SPORTIVE': '#b5d97a' };
const ORE = [['08:00', '08:50'], ['08:50', '09:40'], ['09:40', '10:30'], ['10:30', '11:20'], ['11:20', '12:10'], ['12:10', '13:00']];
const ORARIO = { // 1 = lunedì ... 6 = sabato
  1: ["GEST. PROG. ORG. D'IMPR.", "GEST. PROG. ORG. D'IMPR.", 'SIS. E RETI', 'SIS. E RETI', 'MATEMATICA', 'T.P.S.I.T.'],
  2: ['ITALIANO', 'ITALIANO', 'STORIA', 'INFORMATICA', 'INFORMATICA', 'INFORMATICA'],
  3: ['ITALIANO', 'INGLESE', 'MATEMATICA', 'SIS. E RETI', 'T.P.S.I.T.', 'INGLESE'],
  4: ["GEST. PROG. ORG. D'IMPR.", 'STORIA', 'STORIA', 'SIS. E RETI', 'SIS. E RETI', 'SIS. E RETI'],
  5: ['SCIENZE MOTORIE E SPORTIVE', 'SCIENZE MOTORIE E SPORTIVE', 'T.P.S.I.T.', 'T.P.S.I.T.', 'ITALIANO', 'INFORMATICA'],
  6: ['INGLESE', 'MATEMATICA', 'MATEMATICA', 'INFORMATICA', 'INFORMATICA']
};
const docente = m => (DOCENTI[m] || 'DOCENTE').split(' / ')[0];

/* ---------- Dati (salvati sul telefono) ---------- */
const KEY = 'registro_dati_v1';
let DB;
function giornoScuola(n) { // data relativa a oggi che non cade di domenica
  let d = addDays(oggi(), n);
  if (d.getDay() === 0) d = addDays(d, n < 0 ? -1 : 1);
  return iso(d);
}
function datiEsempio() {
  return {
    studente: { nome: 'MOUAD', cognome: 'BIAZ', classe: '5AIN', anno: `${annoInizio()}/${annoInizio() + 1}` },
    account: { utente: '107447', password: 'fda3db968e7ae', istituto: 'Istituto di Istruzione Superiore "Marie Curie (TN)"' },
    voti: [],
    argomenti: [
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-10", testo: "Laboratorio - ip calculator" },
      { id: uid(), materia: "STORIA", data: "2026-09-10", testo: "Presentazione programma" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-09-10", testo: "Saluti alla classe - presentazione materia" },
      { id: uid(), materia: "ITALIANO", data: "2026-09-11", testo: "A. Manzoni" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-11", testo: "Ripasso programma 4" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-12", testo: "visione globale del programma" },
      { id: uid(), materia: "INGLESE", data: "2026-09-12", testo: "Living in a smart world - the AI revolution pag. 20-21" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-14", testo: "Sistemi distribuiti: generalità" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-14", testo: "Saluti alla classe e presentazione del programma" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-14", testo: "Laboratorio - IP Calculator" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-14", testo: "Ripasso - ripasso indirizzamento IP" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-09-14", testo: "Introduzione organizzazione aziendale - Introduzione ai concetti base: azienda, impresa, settori, bilancio, costi, ricavi, profitto" },
      { id: uid(), materia: "INFORMATICA", data: "2026-09-15", testo: "Introduzione a HTML e CSS. Definizione di HTML, attributo, elemento, tag, marcatore, proprietà CSS, dichiarazione, struttura di una pagina HTML, struttura di un progetto, strumenti per sviluppare pagine web, file di reset, attributo globale style. Esercizi." },
      { id: uid(), materia: "INGLESE", data: "2026-09-15", testo: "The Internet of things IOT" },
      { id: uid(), materia: "ITALIANO", data: "2026-09-15", testo: "Manzoni Promessi sposi" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-16", testo: "Derivate funzioni : ripasso" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-16", testo: "Test di ripasso - indirizzamento IP" },
      { id: uid(), materia: "INGLESE", data: "2026-09-16", testo: "smart solution for smart cities" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-17", testo: "Laboratorio - Continuazione progetto IP Calculator" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-17", testo: "Ripasso - Test su Routing" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-17", testo: "Correzione Test su indirizzi IP -" },
      { id: uid(), materia: "STORIA", data: "2026-09-17", testo: "Accordi di Plombieres" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-09-17", testo: "aziende e mercati - microeconomia e macroeconomia, cenni sull'analisi della formazione del prezzo" },
      { id: uid(), materia: "INFORMATICA", data: "2026-09-18", testo: "Elemento style. Concetto di regola CSS. Concetto di selettore. Presentazione del manualetto CSS. L'elemento a." },
      { id: uid(), materia: "ITALIANO", data: "2026-09-18", testo: "Manzoni Promessi sposi" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-18", testo: "sistemi distribuiti - Classificazione di Flynn: definizione e applicazioni reali" },
      { id: uid(), materia: "INFORMATICA", data: "2026-09-19", testo: "Calcio" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-19", testo: "Revisione derivate: esercizi" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-19", testo: "Revisione derivate" },
      { id: uid(), materia: "INGLESE", data: "2026-09-19", testo: "lavoro di gruppo: ask your mate about IOT" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-21", testo: "Approfondimento individuale classificazione di Flynn" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-21", testo: "Derivate di funzioni : ripasso" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-21", testo: "Protocolli a livello Applicativo - Introduzione a DNS" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-09-21", testo: "Costi aziendali - Gestione dei costi" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-24", testo: "I Protocolli a livello Applicazione - Gerarchia dei Server DNS, query ricorsiva e iterativa" },
      { id: uid(), materia: "STORIA", data: "2026-09-24", testo: "Spedizione dei Mille" },
      { id: uid(), materia: "ITALIANO", data: "2026-09-25", testo: "Manzoni. Conclusione" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-25", testo: "XML introduzione" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-26", testo: "Test ingresso università: esempi" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-26", testo: "Test ingresso università: esempi" },
      { id: uid(), materia: "INGLESE", data: "2026-09-26", testo: "generation Alpha" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-28", testo: "Cluster computing" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-28", testo: "Derivate composte: potenza di funzione. Esempi funzioni razionali e irrazionali." },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-28", testo: "I Protocolli a livello Applicazione - tipologia di record DNS e ripasso query iterative e ricorsive" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-09-28", testo: "Prezzi e Costi - Costi indiretti e cost diretti Tipologie di concorrenza" },
      { id: uid(), materia: "INFORMATICA", data: "2026-09-29", testo: "Correzione esercizio. Visione di una prova d'esame. Visione di un filmato sul labelling per addestramento IA" },
      { id: uid(), materia: "ITALIANO", data: "2026-09-29", testo: "Manzoni. Conclusione" },
      { id: uid(), materia: "INGLESE", data: "2026-09-30", testo: "Reading: pag. 26 Smartphones; use of abuse" },
      { id: uid(), materia: "INGLESE", data: "2026-09-30", testo: "generation Alpha and the Attention Economy" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-09-30", testo: "Grid Computing" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-09-30", testo: "I Protocolli a Livello Applicazione - DNS tipi di record, struttura query" },
      { id: uid(), materia: "MATEMATICA", data: "2026-09-30", testo: "Derivate funzioni composte: potenze, esponenziale. Esempi" },
      { id: uid(), materia: "ITALIANO", data: "2026-09-30", testo: "Leopardi, Vita e opere." },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-01", testo: "Organizzazione - introduzione all'organizzazione aziendale" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-02", testo: "Sistema informativo e sistema informatico: introduzione." },
      { id: uid(), materia: "ITALIANO", data: "2026-10-02", testo: "Proclamazione del Regno d'Italia" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-02", testo: "Esercitazione XML" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-03", testo: "Prova di verifica su tecn web modulo 1 Introduzione a ERP, EDP e database." },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-03", testo: "Derivate funzione composta logaritmo" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-03", testo: "Derivate funzioni composte, esempi con funzioni e potenze" },
      { id: uid(), materia: "INGLESE", data: "2026-10-03", testo: "i plurali irregolari in inglese - i nomi collettivi police, family, money. people" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-05", testo: "Derivate funzioni composte" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-10-05", testo: "La Crittografia - Introduzione alla crittografia" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-05", testo: "Gestione aziendale - Test auto-valutativo di ripasso" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-06", testo: "Tabelle, colori, classi, id e pseudoclassi. Esercizi" },
      { id: uid(), materia: "ITALIANO", data: "2026-10-06", testo: "Verifica di Storia" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-07", testo: "Orientamento in uscita Kairos" },
      { id: uid(), materia: "INGLESE", data: "2026-10-07", testo: "Orientamento in Uscita al Kairos" },
      { id: uid(), materia: "ITALIANO", data: "2026-10-07", testo: "Dalla Beat generation al '68" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-08", testo: "organizzazione aziendale - Micro organizzazione" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-09", testo: "Verifica tecn web lez 2" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-09", testo: "XML - Esercitazione 2 su Classroom" },
      { id: uid(), materia: "SCIENZE MOTORIE E SPORTIVE", data: "2026-10-09", testo: "esercizi a corpo libero -" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-10", testo: "Completato modulo sui sistemi informativi aziendali" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-10", testo: "Esercizi derivate funzioni composte" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-10", testo: "Derivate e funzioni composte." },
      { id: uid(), materia: "INGLESE", data: "2026-10-10", testo: "Unit 2 : From workstation to supercomputers" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-12", testo: "sistemi distribuiti - cloud computing" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-10-12", testo: "Laboratorio - Intelligenza Artificiale per la Robotica Umanoide" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-12", testo: "intro macrogranizzazione" },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-12", testo: "interrogazione" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-13", testo: "Orientamento in uscita - Incontro al Kairos" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-13", testo: "Orientamento in uscita - Incontro al Kairos" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-13", testo: "Orientamento in uscita - Incontro al Kairos" },
      { id: uid(), materia: "ITALIANO", data: "2026-10-13", testo: "Leopardi. Operette morali" },
      { id: uid(), materia: "INGLESE", data: "2026-10-14", testo: "Quantum computers" },
      { id: uid(), materia: "INGLESE", data: "2026-10-14", testo: "interrogazione" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-14", testo: "preparazione intervento Kairos" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-10-14", testo: "Ripasso -" },
      { id: uid(), materia: "ITALIANO", data: "2026-10-14", testo: "Leopardi, Canto notturno...." },
      { id: uid(), materia: "GEST. PROG. ORG. D'IMPR.", data: "2026-10-15", testo: "organizzazione aziendale - Organigramma - ricerca esempi estrapolazione caratteristiche tipologie" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-16", testo: "Box model, i punti cardinali" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-16", testo: "XML - DTD" },
      { id: uid(), materia: "SCIENZE MOTORIE E SPORTIVE", data: "2026-10-16", testo: "coordinazione-forza- -" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-17", testo: "Verifica primo modulo teoria: sistemi informativi e db Modulo 2: analisi" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-17", testo: "Problemi di ottimizzazione" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-17", testo: "Esercizi derivate composte" },
      { id: uid(), materia: "INGLESE", data: "2026-10-17", testo: "Video on quantum Computers The Race to Harness Quantum Computing's Mind-Bending Power | The Future With Hannah Fry - https://www.youtube.com/watch?v=1_gJp2uAjO0" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-19", testo: "Discussione" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-20", testo: "Visione film: The zero theorem. Visione del cortometraggio: The prompt." },
      { id: uid(), materia: "ITALIANO", data: "2026-10-20", testo: "Leopardi. Dialogo della natura e di un islandese" },
      { id: uid(), materia: "INGLESE", data: "2026-10-21", testo: "proseguo film" },
      { id: uid(), materia: "INGLESE", data: "2026-10-21", testo: "visione film in lingua" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-10-21", testo: "La Crittografia - cifrario a trasposizione colonnare" },
      { id: uid(), materia: "ITALIANO", data: "2026-10-21", testo: "Leopardi, Quiete dopo la tempesta, Sabato del villaggio" },
      { id: uid(), materia: "SIS. E RETI", data: "2026-10-22", testo: "Orientamento in uscita -" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-23", testo: "Introduzione allo schema concettuale ER" },
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-23", testo: "XML - Esercitazioni su Classroom (da consegnare)" },
      { id: uid(), materia: "INFORMATICA", data: "2026-10-24", testo: "Concetto di associazione in un diagramma ER. Partecipazioni. Esempi" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-24", testo: "Verifica scritta" },
      { id: uid(), materia: "MATEMATICA", data: "2026-10-24", testo: "Verifica scritta" },
      { id: uid(), materia: "INGLESE", data: "2026-10-24", testo: "interrogazione" }
    ],
    compiti: [
      { id: uid(), materia: "T.P.S.I.T.", data: "2026-10-23", testo: "XML - Esercitazioni su Classroom (da consegnare)" }
    ],
    agenda: [
      { id: uid(), titolo: "Verifica lab info - tecn web lez 1", tipo: "Verifica", materia: "INFORMATICA", data: "2026-10-03", oraInizio: "10:50", oraFine: "10:50", desc: "", inserito: "03/10/2026 - 08:00", autore: "URSOMANDO ALESSANDRO" },
      { id: uid(), titolo: "Orientamento post diploma", tipo: "Evento", materia: "", data: "2026-10-07", oraInizio: "09:00", oraFine: "13:00", desc: "presso Auditorium Kairos", inserito: "07/10/2026 - 08:00", autore: "Didattica Sei" },
      { id: uid(), titolo: "Verifica lab info - tecn web lez 2", tipo: "Verifica", materia: "INFORMATICA", data: "2026-10-09", oraInizio: "10:50", oraFine: "10:50", desc: "", inserito: "09/10/2026 - 08:00", autore: "URSOMANDO ALESSANDRO" },
      { id: uid(), titolo: "Orientamento post diploma", tipo: "Evento", materia: "", data: "2026-10-13", oraInizio: "08:50", oraFine: "13:00", desc: "presso Auditorium Don Milani di Pergine", inserito: "13/10/2026 - 08:00", autore: "Didattica Sei" },
      { id: uid(), titolo: "Corsa campestre - fase d'Istituto", tipo: "Evento", materia: "", data: "2026-10-14", oraInizio: "09:40", oraFine: "13:00", desc: "", inserito: "14/10/2026 - 08:00", autore: "Didattica Sette" },
      { id: uid(), titolo: "Verifica di informatica (Sistemi Informativi Aziendali)", tipo: "Verifica", materia: "INFORMATICA", data: "2026-10-17", oraInizio: "10:30", oraFine: "11:30", desc: "", inserito: "17/10/2026 - 08:00", autore: "URSOMANDO ALESSANDRO" },
      { id: uid(), titolo: "Orientamento post diploma - 22 ottobre 2026", tipo: "Evento", materia: "", data: "2026-10-22", oraInizio: "08:50", oraFine: "13:00", desc: "Pergine, Auditorium I.C. Pergine 1", inserito: "22/10/2026 - 08:00", autore: "Didattica Due" },
      { id: uid(), titolo: "Verifica di matematica", tipo: "Verifica", materia: "MATEMATICA", data: "2026-10-24", oraInizio: "08:50", oraFine: "10:25", desc: "Derivate funzioni composte e problemi di ottimizzazione", inserito: "24/10/2026 - 08:00", autore: "CROCE ROBERTA" },
      { id: uid(), titolo: "Verifica scritta (recupero assenti del 24)", tipo: "Verifica", materia: "MATEMATICA", data: "2026-10-26", oraInizio: "11:20", oraFine: "12:10", desc: "", inserito: "26/10/2026 - 08:00", autore: "CROCE ROBERTA" },
      { id: uid(), titolo: "Verifica TPSIT", tipo: "Verifica", materia: "T.P.S.I.T.", data: "2026-11-06", oraInizio: "09:40", oraFine: "11:20", desc: "XML e DTD", inserito: "06/11/2026 - 08:00", autore: "SANTORO MARTINA" },
      { id: uid(), titolo: "Giornata \"A scuola di sicurezza\" - Teatro Santa Chiara - Trento", tipo: "Evento", materia: "", data: "2026-11-18", oraInizio: "12:22", oraFine: "12:22", desc: "", inserito: "18/11/2026 - 08:00", autore: "URSOMANDO ALESSANDRO" }
    ],
    assenze: [],
    note: [],
    annotazioni: []
  };
}
function carica() {
  try { const s = localStorage.getItem(KEY); if (s) DB = JSON.parse(s); } catch (e) { /* nessun salvataggio disponibile */ }
  if (!DB) DB = datiEsempio();
  if (!DB.account) DB.account = { utente: 'Mouad.Biaz', password: '10082008', istituto: 'Istituto di Istruzione Superiore "Marie Curie (TN)"' };
  salva();
}
const SESS = 'registro_sessione_v1', SESS_U = 'registro_utente_v1';
const leggi = k => { try { return localStorage.getItem(k); } catch (e) { return null; } };
const scrivi = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* non disponibile */ } };
function salva() { try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) { /* salvataggio non disponibile */ } pushCloud(); }

/* ---------- Sincronizzazione online (Firebase) ---------- */
let cloud = null, cloudOn = false, lastSync = '';
function initCloud() {
  try {
    const cfg = window.firebaseConfig;
    if (!cfg || !cfg.databaseURL || typeof firebase === 'undefined') return;
    if (!firebase.apps || !firebase.apps.length) firebase.initializeApp(cfg);
    cloud = firebase.database().ref('registro');
    cloudOn = true;
    cloud.on('value', snap => {
      const val = snap.val();
      if (!val) { pushCloud(); return; }        // database vuoto: carico i dati di questo dispositivo
      const js = JSON.stringify(val);
      if (js === lastSync) return;               // è una modifica fatta da noi
      lastSync = js;
      DB = val;
      if (!DB.account) DB.account = { utente: DEF_USER, password: DEF_PASS, istituto: 'Istituto di Istruzione Superiore "Marie Curie (TN)"' };
      try { localStorage.setItem(KEY, JSON.stringify(DB)); } catch (e) {}
      const a = document.activeElement, dentroForm = a && /INPUT|TEXTAREA|SELECT/.test(a.tagName);
      if (S.logged && !document.getElementById('mback') && !dentroForm) render(true);   // aggiorna le schermate all'istante
    }, () => { cloudOn = false; });
  } catch (e) { cloudOn = false; }
}
function pushCloud() {
  if (!cloudOn || !cloud) return;
  try { lastSync = JSON.stringify(DB); cloud.set(DB); } catch (e) { /* riprova al prossimo salvataggio */ }
}

/* ---------- Icone (SVG) ---------- */
const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
const I = {
  menu: sv('<path d="M3 6h18M3 12h18M3 18h18" stroke-width="2.2"/>'),
  home: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>`,
  chev: sv('<path d="M9 4l8 8-8 8" stroke-width="2"/>'),
  left: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18 3v18L4 12z"/></svg>`,
  right: `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3v18l14-9z"/></svg>`,
  filter: sv('<path d="M3 6h18M7 12h10M10 18h4" stroke-width="2"/>', 'class="filt"'),
  check: sv('<path d="M4 12l5 5L20 6" stroke-width="2"/>'),
  trash: sv('<path d="M4 7h16M10 11v6M14 11v6M5 7l1 13h12l1-13M9 7V4h6v3"/>'),
  agenda: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M7 14h2M11 14h2M15 14h2M7 17h2M11 17h2M15 17l1 1 2-2"/>'),
  annot: sv('<path d="M11 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-6"/><path d="M18.5 2.5a2.1 2.1 0 0 1 3 3L12 15l-4 1 1-4z"/>'),
  argom: sv('<rect x="3" y="4" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="3" y="16" width="4" height="4"/><path d="M10 5h11M10 8h8M10 11h11M10 14h8M10 17h11M10 20h8"/>'),
  assenze: sv('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9.5 13l5 5M14.5 13l-5 5"/>'),
  compiti: sv('<path d="M5 3h11v18H5zM3 7h4M3 11h4M3 15h4M9 7h4"/><path d="M19.5 9.5l1 1-7 7H12v-1.5z"/>'),
  note: sv('<path d="M12 3l10 18H2z"/><path d="M12 10v5M12 18v.5" stroke-width="2"/>'),
  orario: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 3"/>'),
  pagella: sv('<path d="M6 2h9l3 3v17H6z"/><path d="M9 9l3-1.5L15 9l-3 1.5zM10 9.5V11c1 1 3 1 4 0V9.5M9 15h6M9 18h4"/>'),
  voti: sv('<path d="M4 20h16M7 16v-4M12 16V7M17 16v-7"/>'),
  docente: sv('<circle cx="9" cy="8" r="4"/><path d="M2 21v-1a7 7 0 0 1 11-5.7M18 14v7M14.5 17.5h7"/>'),
  back: sv('<path d="M15 5l-7 7 7 7" stroke-width="2.2"/>'),
  eye: sv('<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/>'),
  logout: sv('<path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 12h10M17 9l3 3-3 3M10 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/>'),
  documenti: sv('<path d="M7 2h7l5 5v15H7z"/><path d="M14 2v5h5M10 12h6M10 16h5M10 8h3"/>'),
  gear: sv('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>')
};
const LOGO = `<svg viewBox="0 0 512 512" aria-label="Logo Registro"><rect width="512" height="512" rx="112" fill="#1b3557"/><g fill="none" stroke="#4fa3ec" stroke-width="22" stroke-linecap="round" stroke-linejoin="round"><circle cx="186" cy="150" r="52"/><path d="M96 318v-26c0-50 40-88 90-88s90 38 90 88v26z"/><circle cx="326" cy="150" r="52"/><path d="M286 210c12-4 26-6 40-6 50 0 90 38 90 88v26H300"/></g><rect x="96" y="352" width="320" height="10" rx="5" fill="#ecc506"/><text x="256" y="430" text-anchor="middle" font-family="Ubuntu, Arial, sans-serif" font-weight="700" font-size="64" letter-spacing="2" fill="#fff">REGISTRO</text></svg>`;

/* ---------- Stato dell'interfaccia ---------- */
const S = {
  page: 'home', homeDay: iso(oggi()),
  agMese: iso(new Date(oggi().getFullYear(), oggi().getMonth(), 1)), agSel: iso(oggi()),
  argDay: iso(oggi()), argMat: '', compMat: '', orDay: iso(oggi()),
  votiPer: periodoCorrente(), annPer: periodoCorrente(), votiMat: '', docTab: 'voto', docErr: '',
  logged: false, loginUser: '', loginSave: true, loginErr: '',
  docAuth: false, docLoginErr: ''
};

/* ---------- Componenti riutilizzabili ---------- */
const prossimiCompiti = () => DB.compiti.filter(c => c.data >= iso(oggi())).sort((a, b) => a.data.localeCompare(b.data));
const badge = () => { const n = prossimiCompiti().length; return n ? `<span class="badge">${n}</span>` : ''; };

function header(titolo) {
  return `<header class="topbar">
    <div class="tb-left"><button class="hamb" data-act="menu" aria-label="Apri il menu">${I.menu}${badge()}</button><span class="mini-logo">${LOGO}</span></div>
    <h1 class="tb-title ${titolo.length > 11 ? 'long' : ''}">${esc(titolo)}</h1>
    <button class="tb-right" data-act="go" data-p="home" aria-label="Torna alla home">${I.home}</button>
  </header>`;
}

function tendina(id, opzioni, valore) {
  const cur = opzioni.find(o => o.v === valore) || opzioni[0];
  return `<div class="dd" id="dd-${id}">
    <button class="dd-btn" data-act="dd" data-id="${id}" aria-haspopup="listbox">${I.filter}<span>${esc(cur.l)}</span><i class="caret"></i></button>
    <div class="dd-list" role="listbox" hidden>${opzioni.map(o => `<button class="dd-opt ${o.v === cur.v ? 'sel' : ''}" data-act="ddpick" data-id="${id}" data-v="${esc(o.v)}">${esc(o.l)}</button>`).join('')}</div>
  </div>`;
}
const opzMaterie = () => [{ v: '', l: 'Tutte le materie' }, ...MATERIE.map(m => ({ v: m, l: m }))];
const opzPeriodi = () => Object.entries(periodi()).map(([v, p]) => ({ v, l: p.l }));

function settimana(chiave, segna) {
  const sel = parse(S[chiave]);
  const lun = addDays(sel, -((sel.getDay() + 6) % 7)), dom = addDays(lun, 6);
  const tit = lun.getMonth() === dom.getMonth()
    ? `${lun.getDate()} - ${dom.getDate()} ${MESI[dom.getMonth()]}`
    : `${lun.getDate()} ${MESI[lun.getMonth()].slice(0, 3)} - ${dom.getDate()} ${MESI[dom.getMonth()].slice(0, 3)}`;
  let celle = '';
  for (let i = 0; i < 7; i++) {
    const d = addDays(lun, i), s = iso(d);
    celle += `<button class="wd ${s === S[chiave] ? 'sel' : ''} ${segna && segna(s) ? 'mark' : ''}" data-act="setday" data-k="${chiave}" data-d="${s}"><b>${d.getDate()}</b><small>${GG[d.getDay()]}</small></button>`;
  }
  return `<div class="week">
    <div class="week-head"><button class="tri" data-act="shift" data-k="${chiave}" data-n="-7" aria-label="Settimana precedente">${I.left}</button><h3>${tit}</h3><button class="tri" data-act="shift" data-k="${chiave}" data-n="7" aria-label="Settimana successiva">${I.right}</button></div>
    <div class="week-days">${celle}</div>
  </div>`;
}

function riga(o) { // elemento di lista con barra colorata e freccia
  return `<button class="item" data-act="det" data-c="${o.c}" data-id="${o.id}">
    <span class="txt" style="border-left-color:${o.bar || 'var(--yellow)'}">
      <span class="t1 ${o.nocase ? 'nocase' : ''}">${esc(o.t1)}</span>
      ${o.t2 ? `<span class="t2">${esc(o.t2)}</span>` : ''}
      ${o.t3 ? `<span class="t3">${esc(o.t3)}</span>` : ''}
      ${o.t4 ? `<span class="t4">${o.t4}</span>` : ''}
    </span><span class="chev">${I.chev}</span></button>`;
}

function testoAssenza(a, lungo) {
  if (a.tipo === 'ritardo') return `Entrata alle ore ${a.ora}${lungo ? ` del ${fmtShort(a.data)}` : ''}`;
  if (a.tipo === 'uscita') return `Uscita alle ore ${a.ora}${lungo ? ` del ${fmtShort(a.data)}` : ''}`;
  return lungo ? `Assenza del ${fmtShort(a.data)}` : 'Assenza giornaliera';
}

function media(lista) { return lista.length ? lista.reduce((s, v) => s + Number(v.voto), 0) / lista.length : null; }
function materieDaMonitorare() {
  const out = [];
  MATERIE.forEach(m => {
    const v = DB.voti.filter(x => x.materia === m && nelPeriodo(x.data, periodoCorrente()));
    const md = media(v);
    if (md !== null && md < 6) out.push({ m, md });
  });
  return out;
}

/* ---------- Pagine ---------- */
const PAGES = {};

PAGES.home = () => {
  const st = DB.studente, giorno = S.homeDay, d = parse(giorno);
  const mon = materieDaMonitorare();
  const daGiust = DB.assenze.filter(a => !a.giustificata).sort((a, b) => b.data.localeCompare(a.data));
  const fest = festivo(giorno);
  const eventi = DB.agenda.filter(e => e.data === giorno && e.tipo !== 'Giorno festivo');
  const arg = DB.argomenti.filter(a => a.data === giorno);
  const votiG = DB.voti.filter(v => v.data === giorno);
  let fascia;
  if (fest) fascia = `<div class="strip red">Giornata Festiva</div>`;
  else {
    const assente = DB.assenze.some(a => a.tipo === 'assenza' && a.data === giorno);
    const oggiStesso = giorno === iso(oggi());
    const primaDelle8 = oggiStesso && new Date().getHours() < 8;   // la mattina presto non risulta ancora presente
    if (assente) fascia = `<div class="strip red">${esc(st.nome)} oggi è assente</div>`;
    else if (primaDelle8) fascia = `<div class="strip yellow">Nessuna informazione disponibile per oggi</div>`;
    else fascia = `<div class="strip green">${esc(st.nome)} oggi è presente</div>`;
  }
  const comp = prossimiCompiti().slice(0, 3);

  return `<header class="topbar home">
      <div class="tb-left"><button class="hamb" data-act="menu" aria-label="Apri il menu">${I.menu}${badge()}</button><span class="mini-logo">${LOGO}</span></div>
      <div class="home-name"><b>${esc(st.nome)}</b><span>${esc(st.anno)} ${esc(st.classe)}</span></div><span></span>
    </header>
    <section class="home-band">
      <div class="ycard"><h2>Materie da monitorare</h2>
        ${mon.length ? `<div style="padding:8px 0">${mon.map(x => `<button class="row-link" data-act="vmat" data-m="${esc(x.m)}"><span>${esc(x.m)} <b style="color:var(--red)">${fmtVoto(x.md)}</b></span><span class="chev">${I.chev}</span></button>`).join('')}</div>`
      : `<div class="body">Molto bene!<br>Nessuna materia da monitorare!</div>`}
      </div>
      <div class="ycard"><h2>Assenze da giustificare</h2>
        ${daGiust.length ? daGiust.map(a => `<button class="row-link" data-act="go" data-p="assenze"><span>${testoAssenza(a, true)}</span><span class="chev">${I.chev}</span></button>`).join('')
      : `<div class="body">Nessuna assenza da giustificare<br>Ottimo!</div>`}
      </div>
    </section>
    <section class="daycard">
      <div class="daynav"><button class="tri" data-act="shift" data-k="homeDay" data-n="-1" aria-label="Giorno precedente">${I.left}</button><h3>${capWords(`${GIORNI[d.getDay()]} ${d.getDate()} ${MESI[d.getMonth()]}`)}</h3><button class="tri" data-act="shift" data-k="homeDay" data-n="1" aria-label="Giorno successivo">${I.right}</button></div>
      ${fascia}
      <div class="daybody">
        <h4>ATTIVITA' DI OGGI</h4>
        ${fest && fest !== 'Domenica' ? `<p class="empty-line"><b>${esc(fest)}</b></p>` : ''}
        ${eventi.length || arg.length || votiG.length ? `<div class="items flush">${eventi.map(e => riga({ c: 'agenda', id: e.id, t1: e.titolo, nocase: true, t2: `Ore: ${e.oraInizio} - ${e.oraFine}` })).join('')}${votiG.map(v => riga({ c: 'voti', id: v.id, t1: v.materia, t2: `Voto ${fmtVoto(v.voto)} (${v.tipo.toLowerCase()})`, bar: v.voto < 6 ? 'var(--red)' : 'var(--green-dark)' })).join('')}${arg.map(a => riga({ c: 'argomenti', id: a.id, t1: a.materia, t2: a.testo })).join('')}</div>`
      : `<p class="empty-line">Nessuna attività prevista per oggi!</p>`}
        <h4 class="sub">Prossimi compiti</h4>
        ${comp.length ? `<div class="items flush">${comp.map(c => riga({ c: 'compiti', id: c.id, t1: c.materia, t2: c.testo, t3: fmtFull(c.data) })).join('')}</div>` : `<p class="empty-line">Nessun compito in programma</p>`}
      </div>
    </section>`;
};

PAGES.agenda = () => {
  const m0 = parse(S.agMese), y = m0.getFullYear(), mo = m0.getMonth();
  const start = addDays(m0, -((m0.getDay() + 6) % 7));
  const ultimo = new Date(y, mo + 1, 0);
  const settimane = Math.ceil((((m0.getDay() + 6) % 7) + ultimo.getDate()) / 7);
  let celle = ['LU', 'MA', 'ME', 'GI', 'VE', 'SA', 'DO'].map(g => `<div class="mh">${g}</div>`).join('');
  for (let i = 0; i < settimane * 7; i++) {
    const d = addDays(start, i), s = iso(d);
    if (d.getMonth() !== mo) { celle += `<div class="mc out">${d.getDate()}</div>`; continue; }
    const ev = DB.agenda.some(e => e.data === s);
    celle += `<button class="mc ${festivo(s) ? 'fest' : ''} ${s === S.agSel ? 'sel' : ''} ${ev ? 'mark' : ''}" data-act="agday" data-d="${s}" aria-label="${fmtLong(s)}">${d.getDate()}</button>`;
  }
  const lista = DB.agenda.filter(e => e.data === S.agSel).sort((a, b) => a.oraInizio.localeCompare(b.oraInizio));
  const fest = festivo(S.agSel);
  return header('Agenda') + `<main class="page">
    <div class="month">
      <div class="month-head"><button class="tri" data-act="agmese" data-n="-1" aria-label="Mese precedente">${I.left}</button><h3>${MESI[mo]} ${y}</h3><button class="tri" data-act="agmese" data-n="1" aria-label="Mese successivo">${I.right}</button></div>
      <div class="month-grid">${celle}</div>
    </div>
    ${lista.length ? `<div class="items">${lista.map(e => riga({ c: 'agenda', id: e.id, t1: e.titolo, nocase: true, t4: `Ore: ${esc(e.oraInizio)} - ${esc(e.oraFine)}<br>Inserito il ${esc(e.inserito)} da ${esc(e.autore)}` })).join('')}</div>`
      : `<p class="center-msg">${fest && fest !== 'Domenica' ? esc(fest) : 'Nessun evento per ' + fmtLong(S.agSel)}</p>`}
  </main>`;
};

PAGES.annotazioni = () => {
  const lista = DB.annotazioni.filter(a => nelPeriodo(a.data, S.annPer)).sort((a, b) => b.data.localeCompare(a.data));
  return header('Annotazioni') + `<main class="page">
    ${tendina('annPer', opzPeriodi(), S.annPer)}
    ${lista.length ? `<div class="items">${lista.map(a => riga({ c: 'annotazioni', id: a.id, t1: a.materia || 'ANNOTAZIONE', t2: a.testo, t3: fmtFull(a.data) })).join('')}</div>`
      : `<p class="center-msg low">Non ci sono annotazioni nel periodo selezionato</p>`}
  </main>`;
};

PAGES.argomenti = () => {
  const filtro = a => !S.argMat || a.materia === S.argMat;
  const lista = DB.argomenti.filter(a => a.data === S.argDay && filtro(a));
  return header('Argomenti') + `<main class="page">
    ${tendina('argMat', opzMaterie(), S.argMat)}
    ${settimana('argDay', s => DB.argomenti.some(a => a.data === s && filtro(a)))}
    ${lista.length ? `<p class="group-title">Argomenti di ${fmtLong(S.argDay)}</p><div class="items">${lista.map(a => riga({ c: 'argomenti', id: a.id, t1: a.materia, t2: a.testo })).join('')}</div>`
      : `<p class="group-title" style="margin-top:30px">Nessun argomento presente</p>`}
  </main>`;
};

PAGES.assenze = () => {
  const A = DB.assenze, n = t => A.filter(a => a.tipo === t).length;
  const daG = A.filter(a => !a.giustificata).length;
  const lista = [...A].sort((a, b) => b.data.localeCompare(a.data));
  return header('Assenze') + `<main class="page">
    <h2 class="sec-title">CONTEGGIO ASSENZE</h2>
    <div class="count-table">
      <div><span>Assenze</span><span>${n('assenza')}</span></div>
      <div><span>Ritardi</span><span>${n('ritardo')}</span></div>
      <div><span>Uscite anticipate</span><span>${n('uscita')}</span></div>
      <div class="red"><span>Da giustificare</span><span>${daG}</span></div>
    </div>
    ${daG ? `<div class="right"><button class="btn-dark" data-act="giustTutto">Giustifica Tutto</button></div>` : ''}
    <h2 class="sec-title">ELENCO ASSENZE</h2>
    ${lista.length ? lista.map(a => `<div class="abs ${a.giustificata ? 'ok' : ''}">
        <div class="date"><b>${parse(a.data).getDate()}</b><small>${cap(MESI[parse(a.data).getMonth()].slice(0, 3))}</small></div>
        <div class="what">${testoAssenza(a, false)}</div>
        ${a.giustificata ? `<div class="why">${a.motivo ? 'Giustificata: ' + esc(a.motivo) : 'Giustificata'}</div>` : `<button class="btn-dark" data-act="giust" data-id="${a.id}">Giustifica</button>`}
      </div>`).join('') : `<p class="center-msg">Nessuna assenza registrata</p>`}
  </main>`;
};

PAGES.compiti = () => {
  const lista = DB.compiti.filter(c => !S.compMat || c.materia === S.compMat).sort((a, b) => a.data.localeCompare(b.data));
  const gruppi = {};
  lista.forEach(c => (gruppi[c.data] = gruppi[c.data] || []).push(c));
  return header('Compiti') + `<main class="page">
    ${tendina('compMat', opzMaterie(), S.compMat)}
    ${lista.length ? Object.keys(gruppi).map(g => `<p class="group-title" id="g-${g}">Compiti per ${fmtLong(g)}</p><div class="items">${gruppi[g].map(c => riga({ c: 'compiti', id: c.id, t1: c.materia, t2: c.testo, bar: COLORI[c.materia] })).join('')}</div>`).join('')
      : `<p class="center-msg">Nessun compito presente</p>`}
  </main>`;
};

PAGES.note = () => {
  const lista = [...DB.note].sort((a, b) => b.data.localeCompare(a.data));
  return header('Note') + `<main class="page">
    ${lista.length ? `<div class="items">${lista.map(n => riga({ c: 'note', id: n.id, t1: 'Nota disciplinare', nocase: true, t2: n.testo, t3: `${fmtFull(n.data)} - ${n.docente}`, bar: 'var(--red)' })).join('')}</div>`
      : `<p class="center-msg" style="padding-top:110px">Non ci sono note da visualizzare</p>`}
  </main>`;
};

PAGES.orario = () => {
  const d = parse(S.orDay), mat = ORARIO[d.getDay()] || [];
  const fest = festivo(S.orDay);
  return header('Orario scolastico') + `<main class="page">
    ${settimana('orDay')}
    <p class="group-title">Orario di ${fmtLong(S.orDay)}</p>
    ${mat.length && (!fest || fest === 'Domenica') ? `<div>${mat.map((m, i) => `<div class="lesson"><div class="hrs"><span>${ORE[i][0]}</span><span>${ORE[i][1]}</span></div><div class="sub"><b>${esc(m)}</b><span>${esc(DOCENTI[m])} (${esc(DB.studente.classe)})</span></div></div>`).join('')}</div>`
      : `<p class="center-msg">${fest && fest !== 'Domenica' ? esc(fest) + ': nessuna lezione' : 'Nessuna lezione in programma'}</p>`}
  </main>`;
};

PAGES.pagDoc = () => header('Pagelle (documenti)') + `<main class="page"><p class="center-msg low">Nessuna pagella</p></main>`;
PAGES.pagRiep = () => header('Pagelle (riepilogo)') + `<main class="page" style="background:var(--white)"><h2 class="big-grey">Pagelle (riepilogo)</h2><p class="grey-msg">Nessuna pagella disponibile.</p></main>`;

function ciambella(md) {
  const r = 52, c = 2 * Math.PI * r, frac = md === null ? 0 : Math.max(0, Math.min(1, md / 10));
  const col = md === null ? '#c9ced6' : md >= 6 ? 'var(--green-dark)' : 'var(--red)';
  return `<svg class="donut" viewBox="0 0 140 140" aria-hidden="true">
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="#e6e9ee" stroke-width="18"/>
    <circle cx="70" cy="70" r="${r}" fill="none" stroke="${col}" stroke-width="18" stroke-dasharray="${(c * frac).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 70 70)" stroke-linecap="butt"/>
  </svg>`;
}

PAGES.voti = () => {
  const vp = DB.voti.filter(v => nelPeriodo(v.data, S.votiPer));
  const md = media(vp);
  const perMat = MATERIE.map(m => ({ m, v: vp.filter(x => x.materia === m).sort((a, b) => a.data.localeCompare(b.data)) })).filter(x => x.v.length);
  return header('Voti') + `<main class="page">
    ${tendina('votiPer', opzPeriodi(), S.votiPer)}
    <div class="avg-card">${ciambella(md)}<div><div class="lbl">Media voti</div><div class="num">${md === null ? '-' : fmtVoto(md)}</div></div></div>
    ${perMat.length ? perMat.map(x => `<div class="subj">
        <button class="subj-head" data-act="vmat" data-m="${esc(x.m)}"><span>${esc(x.m)}</span><span class="chev">${I.chev}</span></button>
        <div class="grade-bar ${media(x.v) < 6 ? 'bad' : ''}">${x.v.map(v => `<button class="chip" data-act="det" data-c="voti" data-id="${v.id}"><b>${fmtVoto(v.voto)}</b><small>${fmtShort(v.data)}</small></button>`).join('')}</div>
      </div>`).join('') : `<p class="center-msg">Nessun voto nel periodo selezionato</p>`}
  </main>`;
};

PAGES.votiMateria = () => {
  const m = S.votiMat, lista = DB.voti.filter(v => v.materia === m && nelPeriodo(v.data, S.votiPer)).sort((a, b) => b.data.localeCompare(a.data));
  const md = media(lista);
  return header('Voti') + `<main class="page">
    <button class="subj-head" data-act="go" data-p="voti"><span>‹ Tutte le materie</span></button>
    <div class="avg-card">${ciambella(md)}<div><div class="lbl">${esc(m)}</div><div class="num">${md === null ? '-' : fmtVoto(md)}</div></div></div>
    ${lista.length ? `<div class="vdet">${lista.map(v => `<div class="vrow"><div class="vv ${v.voto < 6 ? 'bad' : ''}">${fmtVoto(v.voto)}</div><div class="vi"><b>${esc(v.tipo)} - ${fmtFull(v.data)}</b><small>${esc(v.desc || 'Nessuna descrizione')}</small></div></div>`).join('')}</div>`
      : `<p class="center-msg">Nessun voto in ${esc(m)} nel periodo selezionato</p>`}
  </main>`;
};

/* ---------- Area docente (inserimento dati) ---------- */
const OGGI = () => iso(oggi());
const FORMS = {
  voto: { tab: 'Voto', col: 'voti', titolo: 'Aggiungi un voto', campi: [['materia', 'Materia', 'materia'], ['voto', 'Voto (da 1 a 10)', 'voto'], ['data', 'Data', 'date'], ['tipo', 'Tipo di prova', ['Scritto', 'Orale', 'Pratico']], ['desc', 'Descrizione (facoltativa)', 'text']] },
  argomento: { tab: 'Argomento', col: 'argomenti', titolo: 'Aggiungi un argomento di lezione', campi: [['materia', 'Materia', 'materia'], ['data', 'Data della lezione', 'date'], ['testo', 'Argomento svolto', 'area']] },
  compito: { tab: 'Compito', col: 'compiti', titolo: 'Assegna un compito', campi: [['materia', 'Materia', 'materia'], ['data', 'Da consegnare per il', 'date'], ['testo', 'Compito', 'area']] },
  agenda: { tab: 'Agenda', col: 'agenda', titolo: 'Aggiungi in agenda (verifica, progetto...)', campi: [['tipo', 'Tipo', ['Verifica', 'Progetto', 'Evento', 'Giorno festivo']], ['materia', 'Materia (facoltativa)', 'materiaOpz'], ['titolo', 'Titolo (facoltativo)', 'text'], ['data', 'Data', 'date'], ['oraInizio', 'Dalle ore', 'time'], ['oraFine', 'Alle ore', 'time'], ['desc', 'Descrizione (facoltativa)', 'area']] },
  assenza: { tab: 'Ritardo / Assenza', col: 'assenze', titolo: 'Registra ritardo, assenza o uscita', campi: [['tipo', 'Tipo', [['ritardo', 'Ritardo (entrata posticipata)'], ['assenza', 'Assenza giornaliera'], ['uscita', 'Uscita anticipata']]], ['data', 'Data', 'date'], ['ora', 'Ora (per ritardo o uscita)', 'time']] },
  nota: { tab: 'Nota', col: 'note', titolo: 'Aggiungi una nota disciplinare', campi: [['docente', 'Docente', 'text'], ['data', 'Data', 'date'], ['testo', 'Testo della nota', 'area']] },
  annotazione: { tab: 'Annotazione', col: 'annotazioni', titolo: 'Aggiungi un\'annotazione', campi: [['materia', 'Materia (facoltativa)', 'materiaOpz'], ['data', 'Data', 'date'], ['testo', 'Testo', 'area']] },
  studente: { tab: 'Studente' }
};
const DEFAULT = { data: OGGI, oraInizio: () => '08:00', oraFine: () => '09:00', ora: () => '08:15' };

function campo([k, l, t]) {
  const id = `f-${S.docTab}-${k}`, def = DEFAULT[k] ? DEFAULT[k]() : '';
  let inp;
  if (t === 'materia' || t === 'materiaOpz') inp = `<select id="${id}" name="${k}">${t === 'materiaOpz' ? '<option value="">Nessuna</option>' : ''}${MATERIE.map(m => `<option>${esc(m)}</option>`).join('')}</select>`;
  else if (Array.isArray(t)) inp = `<select id="${id}" name="${k}">${t.map(o => Array.isArray(o) ? `<option value="${o[0]}">${o[1]}</option>` : `<option>${o}</option>`).join('')}</select>`;
  else if (t === 'area') inp = `<textarea id="${id}" name="${k}"></textarea>`;
  else if (t === 'voto') inp = `<input id="${id}" name="${k}" type="number" inputmode="decimal" min="1" max="10" step="0.25" placeholder="es. 7.5">`;
  else inp = `<input id="${id}" name="${k}" type="${t}" value="${def}">`;
  return `<label for="${id}">${l}${inp}</label>`;
}

function riassunto(col, x) {
  switch (col) {
    case 'voti': return [`${x.materia}: ${fmtVoto(x.voto)}`, `${x.tipo} - ${fmtFull(x.data)}`];
    case 'agenda': return [x.titolo, `${x.tipo} - ${fmtFull(x.data)} ${x.oraInizio}-${x.oraFine}`];
    case 'assenze': return [testoAssenza(x, true), x.giustificata ? 'Giustificata' : 'Da giustificare'];
    case 'note': return [x.testo, `${fmtFull(x.data)} - ${x.docente}`];
    default: return [`${x.materia || 'Annotazione'}: ${x.testo}`, fmtFull(x.data)];
  }
}

PAGES.docente = () => {
  if (!S.docAuth) return docLoginScreen();
  const tabs = Object.entries(FORMS).map(([k, f]) => `<button class="tab ${S.docTab === k ? 'on' : ''}" data-act="doctab" data-t="${k}">${f.tab}</button>`).join('');
  let corpo;
  if (S.docTab === 'studente') {
    const st = DB.studente;
    corpo = `<form class="form" data-form="studente" novalidate>
      <h3>Dati dello studente</h3>
      <div class="two"><label for="s-nome">Nome<input id="s-nome" name="nome" value="${esc(st.nome)}"></label><label for="s-cognome">Cognome<input id="s-cognome" name="cognome" value="${esc(st.cognome)}"></label></div>
      <div class="two"><label for="s-classe">Classe<input id="s-classe" name="classe" value="${esc(st.classe)}"></label><label for="s-anno">Anno scolastico<input id="s-anno" name="anno" value="${esc(st.anno)}"></label></div>
      ${S.docErr ? `<p class="err">${esc(S.docErr)}</p>` : ''}
      <button class="btn-yellow" type="submit">Salva dati</button>
    </form>
    <div class="form"><h3>Dati del registro</h3>
      <p class="hint">I dati sono salvati su questo telefono. Puoi ricaricare i tuoi dati (argomenti e agenda) oppure svuotare il registro e partire da zero.</p>
      <div class="row-btns"><button class="btn-line" data-act="reset">Carica i miei dati</button><button class="btn-line danger" data-act="svuota">Svuota registro</button></div>
    </div>`;
  } else {
    const f = FORMS[S.docTab];
    const ultimi = [...DB[f.col]].reverse().slice(0, 6);
    corpo = `<form class="form" data-form="${S.docTab}" novalidate>
      <h3>${f.titolo}</h3>
      ${f.campi.map(campo).join('')}
      ${S.docErr ? `<p class="err">${esc(S.docErr)}</p>` : ''}
      <button class="btn-yellow" type="submit">Salva</button>
    </form>
    <div class="inserted"><h4>Inseriti di recente</h4>
      ${ultimi.length ? ultimi.map(x => { const [a, b] = riassunto(f.col, x); return `<div class="ins"><div><b>${esc(a)}</b><span>${esc(b)}</span></div><button class="del" data-act="del" data-c="${f.col}" data-id="${x.id}" aria-label="Elimina">${I.trash}</button></div>`; }).join('') : '<p class="hint">Ancora niente.</p>'}
    </div>`;
  }
  const cloudHint = cloudOn
    ? '<p class="hint" style="color:#17a537">☁ Sincronizzazione online attiva: i dati compaiono su tutti i dispositivi collegati.</p>'
    : '<p class="hint">Sincronizzazione non configurata: i dati restano solo su questo dispositivo. (Vedi il file LEGGIMI per collegare il database gratuito.)</p>';
  return header('Documenti') + `<main class="page">
    <p class="hint">Qui il docente inserisce i dati. Appena salvi, li trovi nelle sezioni dello studente (Voti, Agenda, Argomenti, Assenze...).</p>
    ${cloudHint}
    <div class="tabs">${tabs}</div>
    ${corpo}
  </main>`;
};

function salvaForm(form) {
  const tipo = form.dataset.form, v = Object.fromEntries(new FormData(form).entries());
  Object.keys(v).forEach(k => (v[k] = String(v[k]).trim()));
  const errore = msg => { S.docErr = msg; render(true); };
  if (tipo === 'studente') {
    if (!v.nome || !v.classe) return errore('Inserisci almeno nome e classe.');
    DB.studente = { nome: v.nome.toUpperCase(), cognome: v.cognome.toUpperCase(), classe: v.classe.toUpperCase(), anno: v.anno };
    salva(); S.docErr = ''; toast('Dati salvati'); return render(true);
  }
  if (!v.data) return errore('Scegli una data.');
  const ora = new Date(), inserito = `${fmtNum(iso(ora))} - ${pad(ora.getHours())}:${pad(ora.getMinutes())}`;
  let rec = { id: uid(), ...v };
  switch (tipo) {
    case 'voto': {
      const n = Number(v.voto.replace(',', '.'));
      if (!v.voto || isNaN(n) || n < 1 || n > 10) return errore('Il voto deve essere un numero da 1 a 10.');
      rec.voto = n; break;
    }
    case 'argomento': case 'compito': case 'nota': case 'annotazione':
      if (!v.testo) return errore('Scrivi il testo prima di salvare.');
      if (tipo === 'nota' && !v.docente) rec.docente = 'Docente';
      break;
    case 'agenda':
      if (!v.titolo) rec.titolo = v.tipo === 'Giorno festivo' ? 'Giorno festivo' : `${v.tipo}${v.materia ? ' di ' + capWords(v.materia.toLowerCase()) : ''}`;
      if (v.oraFine && v.oraInizio && v.oraFine < v.oraInizio) return errore('L\'ora di fine deve venire dopo l\'ora di inizio.');
      rec.inserito = inserito; rec.autore = v.materia ? docente(v.materia) : 'Docente';
      break;
    case 'assenza':
      if (v.tipo !== 'assenza' && !v.ora) return errore('Indica l\'ora del ritardo o dell\'uscita.');
      rec.giustificata = false; rec.motivo = '';
      if (v.tipo === 'assenza') rec.ora = '';
      break;
  }
  DB[FORMS[tipo].col].push(rec);
  salva(); S.docErr = '';
  toast(`${FORMS[tipo].tab} salvato`);
  render(true);
}

/* ---------- Dettaglio, finestre e avvisi ---------- */
function apriModale(html) {
  chiudiModale();
  const m = document.createElement('div');
  m.className = 'mback'; m.id = 'mback';
  m.innerHTML = html;
  m.addEventListener('click', e => { if (e.target === m) chiudiModale(); });
  document.body.appendChild(m);
}
function chiudiModale() { document.getElementById('mback')?.remove(); }

function dettaglio(col, id) {
  const x = DB[col].find(r => r.id === id);
  if (!x) return;
  const kv = (k, v) => v ? `<div><div class="k">${k}</div><p class="v">${esc(v)}</p></div>` : '';
  let titolo, corpo;
  if (col === 'agenda') { titolo = x.titolo; corpo = kv('Tipo', x.tipo) + kv('Materia', x.materia) + kv('Data', fmtFull(x.data)) + kv('Orario', `${x.oraInizio} - ${x.oraFine}`) + kv('Descrizione', x.desc) + kv('Inserito', `${x.inserito} da ${x.autore}`); }
  else if (col === 'voti') { titolo = `Voto ${fmtVoto(x.voto)}`; corpo = kv('Materia', x.materia) + kv('Tipo', x.tipo) + kv('Data', fmtFull(x.data)) + kv('Descrizione', x.desc) + kv('Docente', docente(x.materia)); }
  else if (col === 'note') { titolo = 'Nota disciplinare'; corpo = kv('Data', fmtFull(x.data)) + kv('Docente', x.docente) + kv('Testo', x.testo); }
  else { titolo = col === 'compiti' ? 'Compito' : col === 'argomenti' ? 'Argomento' : 'Annotazione'; corpo = kv('Materia', x.materia) + kv(col === 'compiti' ? 'Da consegnare per' : 'Data', fmtFull(x.data)) + kv('Testo', x.testo) + (x.materia ? kv('Docente', docente(x.materia)) : ''); }
  apriModale(`<div class="modal" role="dialog" aria-modal="true"><h3>${esc(titolo)}</h3><div class="det">${corpo}</div><div class="mact"><button data-act="chiudi">Chiudi</button></div></div>`);
}

const MOTIVI = ['Motivi di salute', 'Motivi famigliari', 'Mezzi di trasporto', 'Altro'];
let giust = { id: null, motivo: '', testo: '' };
function finestraGiustifica() {
  const pronto = giust.motivo && (giust.motivo !== 'Altro' || giust.testo.trim());
  const opz = [{ v: '', l: 'Seleziona motivazione' }, ...MOTIVI.map(m => ({ v: m, l: m }))];
  apriModale(`<div class="modal" role="dialog" aria-modal="true"><h3>Giustifica</h3>
    ${tendina('motivo', opz, giust.motivo).replace('<span>Seleziona motivazione</span>', '<span style="color:#9aa0a8">Seleziona motivazione</span>')}
    ${giust.motivo === 'Altro' ? `<input type="text" id="g-testo" placeholder="Motivazione" value="${esc(giust.testo)}">` : ''}
    <div class="mact"><button data-act="chiudi">Annulla</button><button data-act="confGiust" id="btn-conf" ${pronto ? '' : 'disabled'}>Conferma</button></div></div>`);
  const t = document.getElementById('g-testo');
  if (t) {
    t.addEventListener('input', () => { giust.testo = t.value; document.getElementById('btn-conf').disabled = !t.value.trim(); });
  }
}

function avviso(titolo, testo, onSi) {
  apriModale(`<div class="alert" role="alertdialog" aria-modal="true"><div class="at"><b>${esc(titolo)}</b><span>${esc(testo)}</span></div><div class="ab"><button data-act="chiudi">No</button><button id="btn-si">Sì</button></div></div>`);
  document.getElementById('btn-si').addEventListener('click', () => { chiudiModale(); onSi(); });
}

let toastTimer;
function toast(msg) {
  document.querySelector('.toast')?.remove();
  const t = document.createElement('div');
  t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t);
  clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2200);
}

/* ---------- Menu laterale ---------- */
function drawer() {
  const st = DB.studente;
  const voce = (p, ic, lb, extra = '', gold = false) => `<button class="dlink" data-act="go" data-p="${p}"><span class="ic ${gold ? 'gold' : ''}">${I[ic]}</span><span class="lb">${lb}${extra}</span></button>`;
  const n = prossimiCompiti().length;
  return `<div class="who"><span class="avatar">${esc(st.nome.charAt(0))}</span><span>${esc(st.cognome)} ${esc(st.nome)}</span>${I.check}</div>
    <h2 class="dsec">Didattica</h2>
    ${voce('agenda', 'agenda', 'Agenda')}${voce('annotazioni', 'annot', 'Annotazioni')}${voce('argomenti', 'argom', 'Argomenti')}${voce('assenze', 'assenze', 'Assenze')}
    ${voce('compiti', 'compiti', 'Compiti', n ? `<span class="badge">${n}</span>` : '')}${voce('note', 'note', 'Note')}${voce('orario', 'orario', 'Orario scolastico')}
    ${voce('pagDoc', 'pagella', 'Pagelle (documenti)')}${voce('pagRiep', 'pagella', 'Pagelle (riepilogo)')}${voce('voti', 'voti', 'Voti')}
    <h2 class="dsec">Amministrazione</h2>
    <button class="dlink" data-act="go" data-p="docente"><span class="ic" style="background:#4f9d5f">${I.documenti}</span><span class="lb">Documenti</span></button>
    <button class="dlink" data-act="logout"><span class="ic" style="background:#c0392b">${I.logout}</span><span class="lb">Esci</span></button>`;
}
function apriMenu() {
  document.getElementById('drawer').innerHTML = drawer();
  document.getElementById('drawer').classList.add('show');
  document.getElementById('overlay').classList.add('show');
}
function chiudiMenu() {
  document.getElementById('drawer').classList.remove('show');
  document.getElementById('overlay').classList.remove('show');
}

/* ---------- Login ---------- */
function loginScreen() {
  const acc = DB.account;
  return `<header class="topbar login-top"><span class="tb-back">${I.back}</span><h1 class="tb-title">Login</h1><span></span></header>
    <main class="login">
      <h2 class="login-ist">${esc(acc.istituto)}</h2>
      <form id="login-form" novalidate autocomplete="off">
        <div class="lf"><input id="li-user" name="utente" placeholder="Nome utente" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(S.loginUser || REG_USER)}"></div>
        <div class="lf"><input id="li-pass" name="chiave" type="password" placeholder="Password" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" class="eye" data-act="eye" aria-label="Mostra o nascondi la password">${I.eye}</button></div>
        <label class="save"><span>Salva credenziali</span><span class="switch"><input type="checkbox" id="li-save" ${S.loginSave ? 'checked' : ''}><span class="knob"></span></span></label>
        ${S.loginErr ? `<p class="err center">${esc(S.loginErr)}</p>` : ''}
        <button class="btn-dark login-btn" type="submit">Login</button>
      </form>
    </main>`;
}
const REG_USER = '107447', REG_PASS = 'fda3db968e7ae';   // login del registro
const DOC_USER = 'Mouad.Biaz', DOC_PASS = '10082008';    // login dell'area Documenti
const DEF_USER = REG_USER, DEF_PASS = REG_PASS;
function credOk(u, pw) {
  return u.trim().toLowerCase() === REG_USER.toLowerCase() && pw.trim() === REG_PASS;
}
function docCredOk(u, pw) {
  return u.trim().toLowerCase() === DOC_USER.toLowerCase() && pw.trim() === DOC_PASS;
}
function login(form) {
  const u = String(form.utente.value || '').trim();
  const pw = String((form.chiave || form.password).value || '');
  const save = form.querySelector('#li-save').checked;
  S.loginUser = u; S.loginSave = save;
  if (credOk(u, pw)) {
    S.logged = true; S.loginErr = '';
    scrivi(SESS, '1');                       // resta loggato fino al logout
    if (save) scrivi(SESS_U, u); else { try { localStorage.removeItem(SESS_U); } catch (e) {} }
    S.page = 'home'; mostra(); window.scrollTo(0, 0);
  } else {
    S.loginErr = 'Nome utente o password non corretti.';
    mostra();
  }
}
function logout() {
  S.logged = false; S.loginErr = ''; S.docAuth = false; scrivi(SESS, '0');
  chiudiMenu(); chiudiModale(); mostra(); window.scrollTo(0, 0);
}
function mostra() {
  if (!S.logged) { document.getElementById('app').innerHTML = loginScreen(); chiudiMenu(); return; }
  render();
}
function docLoginScreen() {
  return header('Documenti') + `<main class="login">
    <h2 class="login-ist">Area riservata — Documenti</h2>
    <form id="doc-login-form" novalidate autocomplete="off">
      <div class="lf"><input id="dl-user" name="utente" placeholder="Nome utente" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"></div>
      <div class="lf"><input id="dl-pass" name="chiave" type="password" placeholder="Password" autocomplete="off" autocapitalize="none" autocorrect="off" spellcheck="false"><button type="button" class="eye" data-act="eyed" aria-label="Mostra o nascondi la password">${I.eye}</button></div>
      ${S.docLoginErr ? `<p class="err center">${esc(S.docLoginErr)}</p>` : ''}
      <button class="btn-dark login-btn" type="submit">Entra</button>
    </form>
  </main>`;
}
function docLogin(form) {
  const u = String(form.utente.value || '').trim();
  const pw = String((form.chiave || form.password).value || '');
  if (docCredOk(u, pw)) { S.docAuth = true; S.docLoginErr = ''; render(); window.scrollTo(0, 0); }
  else { S.docLoginErr = 'Nome utente o password non corretti.'; render(); }
}

/* ---------- Disegno e navigazione ---------- */
function render(mantieniScroll) {
  const y = window.scrollY;
  document.getElementById('app').innerHTML = PAGES[S.page]();
  if (mantieniScroll) window.scrollTo(0, y);
}
function vai(p) {
  if (p !== 'docente') S.docErr = '';
  S.page = p; chiudiMenu(); render(); window.scrollTo(0, 0);
  if (p === 'compiti') { // porta in vista i compiti di oggi o i prossimi
    const primo = prossimiCompiti()[0];
    const el = primo && document.getElementById('g-' + primo.data);
    if (el) el.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -170);
  }
}
function chiudiTendine(tranne) {
  document.querySelectorAll('.dd.open').forEach(dd => { if (dd !== tranne) { dd.classList.remove('open'); dd.querySelector('.dd-list').hidden = true; } });
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]');
  if (!e.target.closest('.dd')) chiudiTendine();
  if (!b) return;
  const a = b.dataset.act, ds = b.dataset;
  switch (a) {
    case 'menu': apriMenu(); break;
    case 'go': vai(ds.p); break;
    case 'dd': { const dd = b.closest('.dd'); const ap = !dd.classList.contains('open'); chiudiTendine(dd); dd.classList.toggle('open', ap); dd.querySelector('.dd-list').hidden = !ap; break; }
    case 'ddpick':
      if (ds.id === 'motivo') { giust.motivo = ds.v; finestraGiustifica(); }
      else { S[ds.id] = ds.v; render(true); }
      break;
    case 'setday': S[ds.k] = ds.d; render(true); break;
    case 'shift': S[ds.k] = iso(addDays(parse(S[ds.k]), Number(ds.n))); render(true); break;
    case 'agday': S.agSel = ds.d; render(true); break;
    case 'agmese': { const m = parse(S.agMese); const n = new Date(m.getFullYear(), m.getMonth() + Number(ds.n), 1); S.agMese = iso(n); S.agSel = iso(n.getMonth() === oggi().getMonth() && n.getFullYear() === oggi().getFullYear() ? oggi() : n); render(true); break; }
    case 'vmat': S.votiMat = ds.m; S.votiPer = S.page === 'home' ? periodoCorrente() : S.votiPer; vai('votiMateria'); break;
    case 'det': dettaglio(ds.c, ds.id); break;
    case 'chiudi': chiudiModale(); break;
    case 'giust': giust = { id: ds.id, motivo: '', testo: '' }; finestraGiustifica(); break;
    case 'confGiust': {
      const r = DB.assenze.find(x => x.id === giust.id);
      if (r) { r.giustificata = true; r.motivo = giust.motivo === 'Altro' ? giust.testo.trim() : giust.motivo; salva(); }
      chiudiModale(); toast('Assenza giustificata'); render(true); break;
    }
    case 'giustTutto':
      avviso('Giustifica Tutto', 'Sei sicuro di voler giustificare tutte le assenze?', () => {
        DB.assenze.forEach(x => { if (!x.giustificata) { x.giustificata = true; x.motivo = x.motivo || 'Giustificata'; } });
        salva(); toast('Tutte le assenze sono giustificate'); render(true);
      });
      break;
    case 'eye': { const i = document.getElementById('li-pass'); if (i) i.type = i.type === 'password' ? 'text' : 'password'; break; }
    case 'eyed': { const i = document.getElementById('dl-pass'); if (i) i.type = i.type === 'password' ? 'text' : 'password'; break; }
    case 'logout': avviso('Esci', 'Vuoi uscire dal registro?', logout); break;
    case 'doctab': S.docTab = ds.t; S.docErr = ''; render(true); break;
    case 'del':
      avviso('Elimina', 'Vuoi eliminare questo elemento dal registro?', () => {
        DB[ds.c] = DB[ds.c].filter(x => x.id !== ds.id); salva(); toast('Eliminato'); render(true);
      });
      break;
    case 'reset':
      avviso('Carica i miei dati', 'I dati attuali verranno sostituiti con gli argomenti e l\'agenda caricati. Continuare?', () => { DB = datiEsempio(); salva(); toast('I tuoi dati sono stati caricati'); render(true); });
      break;
    case 'svuota':
      avviso('Svuota registro', 'Verranno cancellati voti, compiti, argomenti, agenda e assenze. Continuare?', () => {
        ['voti', 'argomenti', 'compiti', 'agenda', 'assenze', 'note', 'annotazioni'].forEach(k => (DB[k] = []));
        salva(); toast('Registro svuotato'); render(true);
      });
      break;
  }
});
document.addEventListener('submit', e => { e.preventDefault(); if (e.target.id === 'login-form') login(e.target); else if (e.target.id === 'doc-login-form') docLogin(e.target); else salvaForm(e.target); });
document.getElementById('overlay').addEventListener('click', chiudiMenu);
document.addEventListener('keydown', e => { if (e.key === 'Escape') { chiudiModale(); chiudiMenu(); chiudiTendine(); } });

/* ---------- Avvio ---------- */
carica();
initCloud();
S.logged = leggi(SESS) === '1';
S.loginUser = leggi(SESS_U) || '';
mostra();
const _splash = document.getElementById('splash');
if (_splash) setTimeout(() => { _splash.classList.add('hide'); setTimeout(() => _splash.remove(), 600); }, 1700);
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.__NO_SW__) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* funziona anche senza */ });
}
