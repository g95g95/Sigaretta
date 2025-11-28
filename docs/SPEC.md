# Sigaretta - Specifica Tecnica Completa

## 1. Panoramica del Progetto

**Sigaretta** è un gioco multiplayer collaborativo in tempo reale dove i giocatori creano storie assurde scrivendo risposte a domande sequenziali, senza vedere cosa hanno scritto gli altri. Al termine, le storie vengono rivelate creando racconti esilaranti.

### 1.1 Meccanica di Gioco

1. Un host crea una stanza con parametri configurabili
2. I giocatori entrano tramite codice stanza
3. Nella lobby, i giocatori si preparano
4. La partita consiste in **8 turni** con domande specifiche:
   - Turno 1: "Chi è lui?"
   - Turno 2: "Chi è lei?"
   - Turno 3: "Dove si trovano?"
   - Turno 4: "Cosa fanno?"
   - Turno 5: "Cosa dice lui?"
   - Turno 6: "Cosa dice lei?"
   - Turno 7: "Chi arriva?"
   - Turno 8: "Cosa dice chi arriva?"
5. Ogni turno, i giocatori scrivono risposte (con limite parole)
6. I "fogli" vengono passati al giocatore successivo
7. Alla fine, le storie vengono rivelate riga per riga

---

## 2. Architettura del Sistema

### 2.1 Stack Tecnologico

| Componente | Tecnologia | Motivazione |
|------------|------------|-------------|
| **Frontend** | React 18 + Vite | Build veloce, HMR, ottimo DX |
| **State Management** | Zustand | Leggero, semplice, perfetto per app medio-piccole |
| **Styling** | CSS Variables + Inline Styles | Nessuna dipendenza extra, performante |
| **Animazioni** | Framer Motion | Animazioni fluide e dichiarative |
| **Backend** | Node.js + Express | Standard de facto, ampio ecosistema |
| **Real-time** | Socket.io | Gestione WebSocket robusta, fallback automatici |
| **Database** | In-memory con pruning | Partite temporanee, nessun dato persistente necessario |

### 2.2 Motivazione Scelte Architetturali

#### Zustand vs Redux Toolkit
Scelto **Zustand** perché:
- L'app ha uno stato relativamente semplice (room, players, game state)
- Meno boilerplate di Redux
- Integrazione naturale con React hooks
- Bundle size minore (~1KB vs ~10KB)

#### In-memory vs Database
Scelto **In-memory storage con pruning automatico** perché:
- Le partite sono effimere (durano minuti)
- Non serve persistenza storica
- Semplicità di deploy (nessun DB da configurare)
- Performance ottimali
- Pruning automatico delle room inattive dopo 1 ora

---

## 3. Modello Dati

### 3.1 Room (Stanza)

```typescript
interface Room {
  code: string;                   // Codice stanza univoco (6 caratteri)
  name: string;                   // Nome stanza
  hostId: string;                 // ID del creatore/host
  settings: RoomSettings;
  players: Map<string, Player>;   // Mappa ID -> Player
  state: RoomState;
  sheets: Sheet[];                // Array di fogli (uno per giocatore iniziale)
  currentTurn: number;            // 0-7 (turni 1-8)
  turnStartTime: Date | null;
  createdAt: Date;
  lastActivity: Date;
}

interface RoomSettings {
  maxPlayers: number;             // 2-8
  wordLimit: number;              // 10-40
  hostOnlyStart: boolean;         // Solo host può avviare
  turnTimeout: number | null;     // Timeout AFK in secondi (null = disabilitato)
}

type RoomState = 'lobby' | 'playing' | 'reveal' | 'ended';
```

### 3.2 Player (Giocatore)

```typescript
interface Player {
  id: string;                     // UUID univoco
  name: string;                   // Nome visualizzato
  socketId: string;               // Socket.io ID corrente
  isHost: boolean;                // È l'host della stanza
  isReady: boolean;               // Pronto in lobby
  isConnected: boolean;           // Stato connessione
  currentSheetIndex: number;      // Indice del foglio iniziale
  hasSubmittedTurn: boolean;      // Ha inviato risposta per turno corrente
  joinedAt: Date;
  lastActivity: Date;
}
```

### 3.3 Sheet (Foglio)

```typescript
interface Sheet {
  id: string;                     // UUID
  originalOwnerId: string;        // Chi ha iniziato il foglio
  entries: SheetEntry[];          // 8 risposte (una per turno)
}

interface SheetEntry {
  turn: number;                   // 0-7
  playerId: string;               // Chi ha scritto
  content: string;                // Testo della risposta
  timestamp: Date;
}
```

---

## 4. Diagramma Logica Turni

```
┌─────────────────────────────────────────────────────────────────┐
│                         LOBBY                                    │
│  - Players join                                                  │
│  - Players set ready status                                      │
│  - Host can start when all ready                                 │
└─────────────────────┬───────────────────────────────────────────┘
                      │ START_GAME
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PLAYING (Turn 1-8)                            │
│                                                                  │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐         │
│  │  TURN_START  │──▶│   WRITING    │──▶│ TURN_COMPLETE│         │
│  │              │   │              │   │              │         │
│  │ - Show prompt│   │ - Timer runs │   │ - Pass sheets│         │
│  │ - Assign     │   │ - Players    │   │ - Next turn  │         │
│  │   sheets     │   │   write      │   │   or REVEAL  │         │
│  └──────────────┘   └──────────────┘   └──────────────┘         │
│                                                                  │
│  Sheet rotation: Player[i] gets Sheet[(i + turn) % numPlayers]  │
└─────────────────────┬───────────────────────────────────────────┘
                      │ TURN 8 COMPLETE
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        REVEAL                                    │
│  - Each player gets their original sheet                        │
│  - Stories revealed line by line (click to reveal)              │
│  - Export/Save options                                          │
└─────────────────────┬───────────────────────────────────────────┘
                      │ END_GAME
                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                        ENDED                                     │
│  - Return to lobby option                                        │
│  - Room cleanup after timeout                                    │
└─────────────────────────────────────────────────────────────────┘
```

### 4.1 Logica Rotazione Fogli

Con N giocatori, al turno T, il giocatore con indice P riceve il foglio:
```
sheetIndex = (P.currentSheetIndex + T) % N
```

Esempio con 4 giocatori:
```
Turno 0: P0→S0, P1→S1, P2→S2, P3→S3
Turno 1: P0→S1, P1→S2, P2→S3, P3→S0
Turno 2: P0→S2, P1→S3, P2→S0, P3→S1
...
```

---

## 5. API Contract

### 5.1 REST Endpoints

#### Rooms

| Method | Endpoint | Descrizione | Request Body | Response |
|--------|----------|-------------|--------------|----------|
| `POST` | `/api/rooms` | Crea stanza | `CreateRoomDTO` | `RoomDTO` |
| `GET` | `/api/rooms/:code` | Info stanza | - | `RoomDTO` |
| `GET` | `/api/rooms/:code/exists` | Verifica esistenza | - | `{ exists: boolean }` |

#### Debug/Admin

| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| `GET` | `/api/admin/rooms` | Lista tutte le stanze |
| `GET` | `/api/admin/stats` | Statistiche server |
| `GET` | `/api/admin/rooms/:code` | Dettagli stanza |
| `DELETE` | `/api/admin/rooms/:code` | Elimina stanza |

### 5.2 WebSocket Events

#### Client → Server

| Event | Payload | Descrizione |
|-------|---------|-------------|
| `join_room` | `{ roomCode, playerName }` | Entra nella stanza |
| `leave_room` | `{ roomCode }` | Lascia la stanza |
| `set_ready` | `{ roomCode, isReady }` | Imposta stato ready |
| `start_game` | `{ roomCode }` | Avvia la partita |
| `submit_answer` | `{ roomCode, answer }` | Invia risposta turno |
| `return_to_lobby` | `{ roomCode }` | Torna in lobby |
| `request_export` | `{ roomCode, sheetId }` | Richiede export storia |
| `reconnect_player` | `{ roomCode, playerId }` | Riconnessione |

#### Server → Client

| Event | Payload | Descrizione |
|-------|---------|-------------|
| `room_joined` | `{ room: RoomDTO, playerId }` | Conferma join + stato |
| `room_error` | `{ code, message }` | Errore operazione |
| `player_joined` | `PlayerDTO` | Nuovo giocatore |
| `player_left` | `{ playerId, newHostId? }` | Giocatore uscito |
| `player_disconnected` | `{ playerId, newHostId? }` | Giocatore disconnesso |
| `player_reconnected` | `{ playerId, playerName }` | Giocatore riconnesso |
| `player_ready_changed` | `{ playerId, isReady }` | Cambio stato ready |
| `host_changed` | `{ newHostId }` | Nuovo host |
| `game_started` | `TurnDTO` | Partita iniziata |
| `turn_started` | `TurnDTO` | Nuovo turno |
| `player_submitted` | `{ playerId }` | Giocatore ha risposto |
| `turn_complete` | `{ turn }` | Turno completato |
| `game_reveal` | `{ sheets: SheetRevealDTO[] }` | Fase reveal iniziata |
| `returned_to_lobby` | `{ room: RoomDTO }` | Tornati in lobby |
| `export_ready` | `{ story: string }` | Storia esportata |
| `room_closed` | `{ reason }` | Stanza chiusa |

### 5.3 DTO Definitions

```typescript
// Request DTOs
interface CreateRoomDTO {
  roomName: string;
  playerName: string;
  maxPlayers: number;        // 2-8
  wordLimit: number;         // 10-40
  hostOnlyStart: boolean;
  turnTimeout?: number;      // secondi, opzionale
}

// Response DTOs
interface RoomDTO {
  code: string;
  name: string;
  hostId: string;
  settings: RoomSettings;
  state: RoomState;
  players: PlayerDTO[];
  currentTurn: number;
}

interface PlayerDTO {
  id: string;
  name: string;
  isHost: boolean;
  isReady: boolean;
  isConnected: boolean;
  hasSubmittedTurn: boolean;
}

interface TurnDTO {
  turn: number;              // 0-7
  prompt: string;
  hint: string;
  sheetId: string;
  previousLine?: string;     // Ultima riga del foglio (contesto)
  timeRemaining?: number;
  wordLimit: number;
}

interface SheetRevealDTO {
  id: string;
  isYours: boolean;          // È il foglio originale del player
  entries: {
    turn: number;
    revealed: boolean;
    content: string;
    authorName: string;
  }[];
}
```

---

## 6. Struttura Directory Progetto

```
sigaretta/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── index.js           # Configurazioni
│   │   ├── controllers/
│   │   │   ├── roomController.js  # REST handlers
│   │   │   └── adminController.js # Admin endpoints
│   │   ├── services/
│   │   │   ├── roomService.js     # Business logic rooms
│   │   │   └── gameService.js     # Business logic game
│   │   ├── repositories/
│   │   │   └── roomRepository.js  # Data access layer
│   │   ├── models/
│   │   │   ├── Room.js
│   │   │   ├── Player.js
│   │   │   └── Sheet.js
│   │   ├── websocket/
│   │   │   ├── index.js           # Socket.io setup
│   │   │   ├── handlers.js        # Event handlers
│   │   │   └── emitters.js        # Event emitters
│   │   ├── routes/
│   │   │   ├── roomRoutes.js
│   │   │   └── adminRoutes.js
│   │   ├── middleware/
│   │   │   └── errorHandler.js
│   │   └── utils/
│   │       ├── codeGenerator.js
│   │       ├── prompts.js
│   │       └── validation.js
│   ├── server.js                  # Entry point
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── CreateRoom.jsx
│   │   │   ├── JoinRoom.jsx
│   │   │   ├── Lobby.jsx
│   │   │   ├── Game.jsx
│   │   │   └── Reveal.jsx
│   │   ├── store/
│   │   │   └── useGameStore.js    # Zustand store
│   │   ├── services/
│   │   │   ├── api.js             # REST API calls
│   │   │   └── socket.js          # Socket.io client
│   │   ├── utils/
│   │   │   ├── constants.js
│   │   │   └── helpers.js
│   │   ├── styles/
│   │   │   └── global.css
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── docs/
│   └── SPEC.md                    # Questo documento
│
├── render.yaml                    # Deploy config
└── README.md
```

---

## 7. Gestione Casi Particolari

### 7.1 Disconnessione Giocatore

**In Lobby:**
- Rimuovi giocatore dalla lista
- Se era host, passa host al primo giocatore connesso
- Emetti `player_left` + eventuale `host_changed`

**Durante Partita:**
- Marca come disconnesso (non rimuovere)
- Se ha risposta pendente, dopo 5 secondi genera risposta placeholder "..." 
- Continua il gioco normalmente

**Riconnessione:**
- Ripristina stato giocatore
- Invia stato attuale della partita
- Emetti `player_reconnected`

### 7.2 Tutti i Giocatori Escono

- Room marcata per eliminazione
- Cleanup dopo 5 minuti
- Emetti `room_closed` agli eventuali riconnessi

### 7.3 Host Lascia Durante Partita

- Passa host al prossimo giocatore connesso (per ordine di join)
- Partita continua normalmente
- Emetti `host_changed`

### 7.4 Timeout Risposta (se abilitato)

- Timer visibile frontend
- Allo scadere, auto-submit con risposta vuota
- Avanza al turno successivo

---

## 8. Sicurezza e Validazione

### 8.1 Validazioni Input

- Nome stanza: 3-30 caratteri, alfanumerico + spazi + caratteri italiani
- Nome giocatore: 2-20 caratteri
- Risposta: max `wordLimit` parole, no HTML/script
- Room code: esattamente 6 caratteri uppercase alfanumerici

### 8.2 Sanitization

- Escape HTML in tutte le stringhe user-generated
- Trim whitespace
- Normalizza unicode

---

## 9. Istruzioni Deploy su Render

### 9.1 Backend

1. Crea nuovo "Web Service" su Render
2. Collega repository GitHub
3. Settings:
   - Root Directory: `backend`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Environment: Node
4. Environment Variables:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend.onrender.com`

### 9.2 Frontend

1. Crea nuovo "Static Site" su Render
2. Collega repository GitHub
3. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`
4. Environment Variables:
   - `VITE_API_URL=https://your-backend.onrender.com`
   - `VITE_WS_URL=https://your-backend.onrender.com`
5. Rewrite rules: `/* → /index.html`

---

## 10. Possibili Migliorie Future

1. **Sistema di punteggio** - Votazione storie migliori
2. **Temi personalizzati** - Pack di prompt diversi
3. **Modalità spettatore** - Osservatori che non giocano
4. **Persistenza storie** - Salvataggio storie preferite
5. **Condivisione social** - Share diretto su social media
6. **Suoni e musica** - Effetti audio durante il gioco
7. **Tornei** - Modalità competitiva con bracket
8. **Localizzazione** - Supporto multilingua
