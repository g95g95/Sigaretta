# Sigaretta – Il gioco della Sigaretta online

Questo progetto offre una versione web cooperativa del gioco della sigaretta. L’esperienza è
pensata per essere distribuita su GitHub Pages (o qualunque hosting statico) e utilizza il network
peer-to-peer di [Gun.js](https://gun.eco) per sincronizzare in tempo reale le risposte fra i giocatori.

## Funzionalità principali

- Configurazione di nuove partite con scelta del nome del gruppo, del numero massimo di
  partecipanti (fino a 8) e del limite di parole per risposta.
- Generazione automatica di un link condivisibile con cui i giocatori possono accedere alla stanza.
- Lobby con elenco dei partecipanti e gestione automatica dell’host.
- Sequenza completa degli otto turni del gioco della sigaretta, con passaggio virtuale dei fogli e
  blocco del turno finché non hanno risposto tuttə.
- Rivelazione finale con interfaccia “da grattare”: ogni riga della storia si svela con un click.
- Design responsive, elegante e moderno, pronto per essere pubblicato su GitHub Pages.

## Avvio in locale

1. Clona il repository e apri `index.html` con un qualsiasi server statico (ad esempio usando
   l’estensione “Live Server” di VS Code oppure `python -m http.server`).
2. Condividi l’URL generato dal server con le persone con cui vuoi giocare.

> **Nota:** la sincronizzazione si appoggia ai relay pubblici di Gun.js. In produzione puoi
> configurare peer personalizzati modificando l’array `GUN_PEERS` in `src/gun-service.js`.

## Pubblicazione su GitHub Pages

1. Esegui il push di questi file su un repository GitHub.
2. Abilita GitHub Pages dalle impostazioni del repository scegliendo il branch desiderato (di
   default `main`) e la directory radice.
3. L’applicazione sarà immediatamente raggiungibile dal dominio GitHub Pages assegnato.

## Struttura del progetto

```
├── index.html          # entry point dell’applicazione (inclusi font e script)
├── styles.css          # stile globale a tema soft-gradient
└── src
    ├── main.js         # web component principale basato su Lit
    ├── gun-service.js  # integrazione con Gun.js (creazione stanze, turni, sincronizzazione)
    ├── prompts.js      # domande dei turni
    └── utils.js        # funzioni di supporto (slugify, conteggio parole, ecc.)
```

## Tecnologie utilizzate

- [Lit](https://lit.dev) per la costruzione di componenti web reattivi senza bisogno di bundler.
- [Gun.js](https://gun.eco) come database realtime decentralizzato accessibile direttamente dal
  browser.
- CSS moderno (gradients, glassmorphism) per un look minimalista ed elegante.

## Personalizzazioni suggerite

- Aggiorna l’array `PROMPTS` in `src/prompts.js` per variare le domande del gioco.
- Modifica le palette colore in `styles.css` per adattare il tema al tuo gruppo.
- Imposta relay Gun privati per sessioni completamente dedicate al tuo collettivo.

Divertiti a creare storie surreali con i tuoi amici e colleghə!
