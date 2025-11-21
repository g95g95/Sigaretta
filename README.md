# Sigaretta – Il gioco della Sigaretta online

Questo progetto offre una versione web cooperativa del gioco della sigaretta. Ora è pronto come
web service da deployare su Render (o qualsiasi hosting Node) con un backend Express che integra
Gun come relay realtime, così da mantenere vive le stanze per tutta la sessione.

## Funzionalità principali

- Configurazione di nuove partite con scelta del nome del gruppo, del numero massimo di
  partecipanti (fino a 8) e del limite di parole per risposta.
- Generazione automatica di un link condivisibile con cui i giocatori possono accedere alla stanza.
- Lobby con elenco dei partecipanti e gestione automatica dell’host, con opzione “Solo io posso
  avviare la partita” per trattenere l’avvio al/la creatore/trice della stanza.
- Sequenza completa degli otto turni del gioco della sigaretta, con passaggio virtuale dei fogli e
  blocco del turno finché non hanno risposto tuttə.
- Rivelazione finale con interfaccia “da grattare”: ogni riga della storia si svela con un click.
- Design responsive, elegante e moderno, pronto per essere pubblicato su GitHub Pages.
- Monitoraggio delle connessioni ai relay Gun con messaggi di stato più chiari in caso di problemi
  di rete.

## Avvio in locale (server dinamico)

1. Installa le dipendenze (`npm install`).
2. Avvia il server con `npm start`. Verrà esposto su `http://localhost:3000`.
3. Il relay Gun risponderà su `/gun` e l’endpoint di salute su `/health`.

> **Nota:** la sincronizzazione usa prima il relay locale (`/gun`) e poi i peer pubblici di Gun.
> Puoi personalizzare l’array `GUN_PEERS` in `public/src/gun-service.js`.

## Deploy su Render

1. Crea un nuovo servizio “Web Service” puntando a questo repository.
2. Imposta il comando di start su `npm start` e la porta su `3000` (Render la mappa
   automaticamente con `$PORT`).
3. Il servizio risponderà su `/` con l’app e su `/health` per i check di disponibilità.

## Struttura del progetto

```
├── public
│   ├── index.html          # entry point dell’applicazione (inclusi font e script)
│   ├── styles.css          # stile globale a tema soft-gradient e hero
│   └── src
│       ├── main.js         # web component principale basato su Lit
│       ├── gun-service.js  # integrazione con Gun.js (creazione stanze, turni, sincronizzazione)
│       ├── prompts.js      # domande dei turni
│       └── utils.js        # funzioni di supporto (slugify, conteggio parole, ecc.)
├── server.js               # backend Express + Gun relay pronto per Render
└── package.json            # script di avvio e dipendenze
```

## Tecnologie utilizzate

- [Lit](https://lit.dev) per la costruzione di componenti web reattivi senza bisogno di bundler.
- [Gun.js](https://gun.eco) come database realtime decentralizzato accessibile direttamente dal
  browser.
- CSS moderno (gradients, glassmorphism) per un look minimalista ed elegante.

## Personalizzazioni suggerite

- Aggiorna l’array `PROMPTS` in `public/src/prompts.js` per variare le domande del gioco.
- Modifica le palette colore in `public/styles.css` per adattare il tema al tuo gruppo.
- Imposta relay Gun privati per sessioni completamente dedicate al tuo collettivo.

## Percorso di test suggerito

1. Un host crea la stanza, attiva l’opzione “Solo io posso avviare la partita” e condivide il link.
2. Due giocatori aprono il link, inseriscono il nome e completano i turni fino a quando l’host
   avvia la partita.
3. Si procede turno dopo turno: ognunə compila il foglio assegnato e attende lo stato “Prontə”.
4. A fine partita ogni giocatore riceve la propria “sigaretta” da svelare cliccando su ogni riga.

Divertiti a creare storie surreali con i tuoi amici e colleghə!
