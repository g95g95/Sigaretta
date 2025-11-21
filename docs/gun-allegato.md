# Gun: panoramica e integrazione con Node.js

Questo allegato di circa 1000 parole descrive cos'è Gun, perché è interessante per applicazioni collaborative e come si integra con Node.js sia lato server sia lato client. Offre un quadro pratico per passare da un deploy statico a un servizio web dinamico.

## Che cos'è Gun

Gun è un database grafico distribuito e open source, pensato per sincronizzare dati in tempo reale tra peer senza una singola autorità centrale. Ogni entità è rappresentata come nodo del grafo e i link tra nodi definiscono le relazioni. La replica avviene con un modello di consistenza eventuale basato su CRDT; ogni aggiornamento è identificato da un timestamp logico che consente ai nodi di convergere anche in presenza di modifiche concorrenti.

Punti chiave che distinguono Gun: decentralizzazione (ogni peer può fungere da client e relay), approccio offline-first (memoria e localStorage nel browser, adapter di storage su Node.js) e API minimaliste (`get`, `put`, `set`, `on`, `once`) che permettono di modellare il grafo senza boilerplate. Le mutazioni sono applicate subito in locale e replicate appena la rete lo consente.

## Architettura a tre livelli

Un'installazione tipica coinvolge:

1. **Relay**: un server (spesso Node.js) che espone l'endpoint Gun via HTTP/WebSocket e, opzionalmente, persiste i dati.
2. **Client**: codice frontend o altri servizi Node che si collegano a uno o più relay, pubblicano dati e si sottoscrivono ai nodi di interesse.
3. **Storage adapter**: modulo che scrive i nodi del grafo su filesystem, LevelDB, Redis, S3 o altri back-end.

Questi componenti collaborano in modo che la disconnessione di un peer non blocchi l'intero sistema: i messaggi in sospeso vengono inoltrati quando i nodi tornano online e i relay alternativi possono prendere in carico la sincronizzazione.

## Come Gun risolve i conflitti

Il grafo di Gun sfrutta CRDT a granularità di campo. Ogni proprietà ha un valore e uno "state" (timestamp logico). Se due peer scrivono sullo stesso campo, prevale il valore con lo state più recente. Non esistono lock globali: la convergenza è deterministica non appena i messaggi raggiungono i peer. Per conflitti semantici più complessi si possono modellare contatori o log applicativi, ma il merge di default copre molti casi pratici.

## Setup con Node.js

### Installazione

Aggiungere Gun alle dipendenze di produzione:

```bash
npm install gun
```

Su Render o su altri PaaS è consigliabile includere anche `express` per un endpoint HTTP e un healthcheck.

### Relay Express minimale

```js
import express from 'express';
import Gun from 'gun';

const app = express();
const port = process.env.PORT || 3000;

app.use(Gun.serve);
app.get('/health', (_req, res) => res.json({ ok: true }));

const server = app.listen(port, () => {
  console.log(`Server on ${port}`);
});

const gun = Gun({
  web: server,
  file: 'data', // disattiva o sostituisci in ambienti stateless
});
```

`Gun({ web: server })` collega il relay al server HTTP, abilitando WebSocket e fallback HTTP. L'opzione `file` salva i dati su disco: utile con storage persistente, da disattivare se il file system è effimero.

### Client web

Nel frontend basta puntare ai relay disponibili:

```js
import Gun from 'gun';

const gun = Gun([
  'https://tuo-relay.onrender.com/gun',
]);

const room = gun.get('rooms').get('demo');
room.get('players').map().on((player) => {
  console.log('Giocatore:', player);
});

room.get('state').put({ turno: 'alice', mosse: 1 });
```

`on` mantiene una sottoscrizione reattiva: ogni cambiamento pubblicato da un peer viene propagato immediatamente agli altri.

## Buone pratiche di deploy su Render

- **Persistenza**: il file system è effimero; per dati durevoli usare adapter esterni oppure accettare relay come bridge temporaneo.
- **Healthcheck**: endpoint `/health` rapido per le sonde di liveness.
- **CORS e HTTPS**: abilitarli quando frontend e backend vivono su domini diversi.
- **Timeout WebSocket**: verificare che il provider supporti socket persistenti.
- **Scaling orizzontale**: elencare più URL di relay; se ogni replica ha storage locale, i dati devono comunque propagare tra peer.

## Modellare una room di gioco

Per uno scenario con master e due giocatori che rivelano una "sigaretta" personale, la modellazione può essere:

- `rooms/<id>`: nodo principale con metadata (creatore, timestamp, stato generale).
- `rooms/<id>/players`: set dei giocatori attivi, ciascuno con id e nickname.
- `rooms/<id>/state`: nodo che racchiude turno corrente, round e progressi condivisi.
- `rooms/<id>/items/<playerId>`: nodi dedicati agli oggetti privati; ogni clic aggiorna campi come `scoperto`, `punti`, `storia`.

Il master crea la room pubblicando un nodo `rooms/<id>`. I giocatori si collegano allo stesso id e si sottoscrivono ai sottografi di interesse. Le UI reagiscono agli eventi `on` mostrando in tempo reale rivelazioni di punti o cambio turno. Poiché Gun non impone schema, è facile estendere il modello con badge o cronologia mosse.

## Testing multi-utente

Per verificare il flusso richiesto:

1. **Avvio relay**: `npm start`; verificare `/health`.
2. **Sessione master**: aprire la UI, creare la room e copiare il link generato.
3. **Giocatori**: aprire due finestre in incognito e incollare il link; controllare che la lista dei giocatori si popoli in tempo reale.
4. **Interazioni**: cliccare sugli elementi della "sigaretta" e vedere che i campi personali cambino senza interferenze. In console si può eseguire `gun.get('rooms').get(id).get('items').map().once(console.log)`.
5. **Resilienza**: ricaricare una finestra o simulare offline/online; Gun riallinea i peer.

Automatizzare è possibile con Playwright o Cypress orchestrando tre contesti (master + due giocatori) e attendendo gli eventi `on` con timeout adeguati.

## Pattern consigliati

- **Namespace espliciti**: prefissare i nodi con versione e ambiente riduce collisioni tra release.
- **Autenticazione con SEA**: utile se alcuni campi non devono essere leggibili da tutti i peer.
- **Filtro dei dati**: sottoscriversi solo ai nodi necessari e separare rami pubblici/privati.
- **Backup**: se c'è storage locale, pianificare backup o usare adapter più durevoli.
- **Osservabilità**: `gun.on('hi')` e `gun.on('bye')` aiutano a tracciare peer connessi.

## Conclusione

Gun combina un modello a grafo con una replica ottimistica e decentralizzata, rendendolo adatto a giochi multiplayer, chat e strumenti collaborativi. Con poche righe di codice si può montare un relay Express, collegare i client e modellare room, giocatori e oggetti privati come nodi del grafo. Pianificando correttamente persistenza, CORS e scalabilità, Gun si integra bene in ambienti PaaS come Render e consente di offrire un flusso fluido tra master e giocatori con aggiornamenti in tempo reale.
