# 🚬 Sigaretta

**Il gioco delle storie assurde** - Un party game multiplayer in tempo reale dove i giocatori creano storie esilaranti scrivendo risposte a domande senza vedere cosa hanno scritto gli altri.

## 📖 Come si gioca

1. **Crea una stanza** - Scegli un nome, configura le opzioni e invita i tuoi amici
2. **Entra con il codice** - Condividi il codice a 6 caratteri con gli altri giocatori
3. **Rispondi alle 8 domande**:
   - Chi è lui?
   - Chi è lei?
   - Dove si trovano?
   - Cosa fanno?
   - Cosa dice lui?
   - Cosa dice lei?
   - Chi arriva?
   - Cosa dice chi arriva?
4. **I fogli vengono passati** - Ogni turno scrivi su un foglio diverso senza vedere le risposte precedenti
5. **Rivela le storie** - Alla fine, scoprite insieme le storie assurde create!

## 🛠️ Stack Tecnologico

### Frontend
- **React 18** + **Vite** - Build veloce e sviluppo moderno
- **Zustand** - State management leggero e intuitivo
- **Framer Motion** - Animazioni fluide
- **Socket.io Client** - Comunicazione real-time

### Backend
- **Node.js** + **Express** - Server HTTP robusto
- **Socket.io** - WebSocket per sync in tempo reale
- **In-memory storage** - Nessun database necessario (le partite sono temporanee)

## 🚀 Installazione e Avvio

### Prerequisiti
- Node.js 18+ 
- npm o yarn

### Sviluppo Locale

```bash
# Clona il repository
git clone <repo-url>
cd sigaretta

# Installa dipendenze backend
cd backend
npm install

# Installa dipendenze frontend
cd ../frontend
npm install
```

### Avvio

Apri due terminali:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
Il server sarà disponibile su `http://localhost:3001`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```
L'app sarà disponibile su `http://localhost:5173`

## 📦 Deploy su Render

### Metodo 1: Blueprint (Consigliato)

1. Fai fork del repository su GitHub
2. Vai su [Render Dashboard](https://dashboard.render.com)
3. Clicca "New" → "Blueprint"
4. Connetti il tuo repository
5. Render creerà automaticamente entrambi i servizi usando `render.yaml`

### Metodo 2: Deploy Manuale

#### Backend
1. Crea un nuovo "Web Service" su Render
2. Connetti il repository
3. Configura:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Environment:** Node
4. Aggiungi variabili d'ambiente:
   - `NODE_ENV=production`
   - `CORS_ORIGIN=https://your-frontend-url.onrender.com`

#### Frontend
1. Crea un nuovo "Static Site" su Render
2. Connetti il repository
3. Configura:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Aggiungi variabili d'ambiente:
   - `VITE_API_URL=https://your-backend-url.onrender.com`
   - `VITE_WS_URL=https://your-backend-url.onrender.com`
5. Aggiungi regola di rewrite: `/* → /index.html` (per SPA routing)

## 🔧 Configurazione

### Variabili d'Ambiente Backend

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `PORT` | 3001 | Porta del server |
| `NODE_ENV` | development | Ambiente (development/production) |
| `CORS_ORIGIN` | http://localhost:5173 | URL del frontend per CORS |

### Variabili d'Ambiente Frontend

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `VITE_API_URL` | (vuoto) | URL base API backend |
| `VITE_WS_URL` | (vuoto) | URL WebSocket backend |

## 📡 API Reference

### REST Endpoints

| Metodo | Endpoint | Descrizione |
|--------|----------|-------------|
| `POST` | `/api/rooms` | Crea nuova stanza |
| `GET` | `/api/rooms/:code` | Info stanza |
| `GET` | `/api/rooms/:code/exists` | Verifica esistenza |
| `GET` | `/api/admin/rooms` | Lista stanze (admin) |
| `GET` | `/api/admin/stats` | Statistiche server |
| `DELETE` | `/api/admin/rooms/:code` | Elimina stanza |

### WebSocket Events

#### Client → Server
- `join_room` - Entra nella stanza
- `leave_room` - Lascia la stanza
- `set_ready` - Imposta stato pronto
- `start_game` - Avvia la partita
- `submit_answer` - Invia risposta
- `return_to_lobby` - Torna in lobby
- `request_export` - Esporta storia

#### Server → Client
- `room_joined` - Conferma join
- `player_joined` / `player_left` - Aggiornamenti giocatori
- `game_started` - Partita iniziata
- `turn_started` - Nuovo turno
- `game_reveal` - Fase reveal
- `room_error` - Errori

## 🎨 Architettura

```
sigaretta/
├── backend/
│   ├── src/
│   │   ├── config/         # Configurazioni
│   │   ├── controllers/    # REST handlers
│   │   ├── models/         # Room, Player, Sheet
│   │   ├── repositories/   # Data access (in-memory)
│   │   ├── routes/         # Express routes
│   │   ├── services/       # Business logic
│   │   ├── websocket/      # Socket.io handlers
│   │   ├── middleware/     # Error handling
│   │   └── utils/          # Helpers
│   └── server.js
│
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route components
│   │   ├── store/          # Zustand store
│   │   ├── services/       # API & Socket
│   │   ├── styles/         # CSS
│   │   └── utils/          # Helpers
│   └── index.html
│
├── render.yaml             # Render deploy config
└── README.md
```

## 🔒 Sicurezza

- Validazione input su tutti i campi
- Sanitizzazione HTML nelle risposte
- Rate limiting implicito tramite WebSocket
- Nessun dato sensibile persistente

## 🎯 Possibili Migliorie Future

- [ ] Sistema di punteggio/votazione storie
- [ ] Pack di prompt tematici
- [ ] Modalità spettatore
- [ ] Persistenza storie preferite
- [ ] Condivisione social
- [ ] Effetti sonori
- [ ] Supporto multilingua
- [ ] Modalità torneo

## 📄 Licenza

MIT License - Usa liberamente per i tuoi progetti!

---

Creato con ❤️ per serate di risate tra amici.
