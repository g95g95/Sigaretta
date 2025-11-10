import { html, css, LitElement, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { gunService } from './gun-service.js';
import { PROMPTS, TOTAL_TURNS } from './prompts.js';
import { slugify, randomId, countWords, clampWords, formatDateDistance } from './utils.js';

const STORAGE_KEYS = {
  playerId: 'sigaretta-player-id',
  playerName: 'sigaretta-player-name',
};

function generatePlayerId() {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID();
  }
  return randomId(12);
}

class SigarettaApp extends LitElement {
  static properties = {
    screen: { type: String },
    rooms: { state: true },
    joinGroupName: { state: true },
    configureData: { state: true },
    configureError: { state: true },
    configureSuccess: { state: true },
    roomId: { state: true },
    roomData: { state: true },
    prompts: { state: true },
    players: { state: true },
    playerId: { state: true },
    playerName: { state: true },
    isHost: { state: true },
    joinName: { state: true },
    joinError: { state: true },
    answers: { state: true },
    turnStatus: { state: true },
    assignments: { state: true },
    responseText: { state: true },
    waitingTurn: { state: true },
    revealState: { state: true },
  };

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
      background: transparent;
    }

    .container {
      max-width: min(1120px, 92vw);
      margin: 0 auto;
      padding: clamp(2rem, 5vw, 3.5rem) 0 clamp(3rem, 6vw, 4.5rem);
    }

    .card {
      background: var(--surface);
      backdrop-filter: blur(18px);
      border-radius: 28px;
      padding: clamp(1.8rem, 4vw, 2.6rem);
      box-shadow: 0 25px 70px rgba(15, 18, 63, 0.12);
      border: 1px solid var(--border);
    }

    h1,
    h2,
    h3,
    h4 {
      font-weight: 700;
      margin: 0 0 0.75em;
      letter-spacing: -0.01em;
    }

    p {
      margin: 0 0 1em;
      line-height: 1.5;
    }

    .actions {
      display: flex;
      gap: 0.75rem;
      flex-wrap: wrap;
      margin-top: 2.2rem;
    }

    button {
      border: none;
      cursor: pointer;
      border-radius: 999px;
      padding: 0.85rem 1.6rem;
      font-weight: 600;
      transition: transform 0.2s ease, box-shadow 0.2s ease;
      background: var(--accent);
      color: white;
      box-shadow: 0 15px 40px rgba(244, 93, 72, 0.35);
    }

    button.secondary {
      background: transparent;
      color: var(--fg);
      border: 1px solid rgba(22, 21, 36, 0.18);
      box-shadow: none;
    }

    button:disabled {
      opacity: 0.55;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    button:not(:disabled):hover {
      transform: translateY(-1px);
      box-shadow: 0 20px 50px rgba(244, 93, 72, 0.3);
    }

    .grid {
      display: grid;
      gap: 1.5rem;
    }

    .grid.columns {
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    }

    label {
      display: block;
      font-size: 0.9rem;
      font-weight: 600;
      margin-bottom: 0.4rem;
    }

    input,
    textarea,
    select {
      width: 100%;
      padding: 0.85rem 1rem;
      border-radius: 16px;
      border: 1px solid rgba(22, 21, 36, 0.12);
      font: inherit;
      background: var(--surface-strong);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    textarea {
      resize: vertical;
      min-height: 140px;
    }

    .tag {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      border-radius: 999px;
      background: rgba(244, 93, 72, 0.08);
      color: var(--accent-strong);
      padding: 0.35rem 0.85rem;
      font-size: 0.85rem;
      font-weight: 600;
    }

    .list {
      border-radius: 20px;
      border: 1px solid rgba(22, 21, 36, 0.08);
      padding: 1rem;
      background: rgba(255, 255, 255, 0.65);
    }

    .list-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      border-radius: 14px;
      transition: background 0.2s ease;
    }

    .list-item + .list-item {
      margin-top: 0.35rem;
    }

    .list-item:hover {
      background: rgba(244, 93, 72, 0.08);
    }

    .muted {
      color: var(--muted);
    }

    .highlight {
      color: var(--accent-strong);
    }

    .pill {
      border-radius: 999px;
      padding: 0.35rem 0.75rem;
      background: rgba(22, 21, 36, 0.08);
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--muted);
    }

    .room-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .waiting-overlay {
      position: fixed;
      inset: 0;
      display: grid;
      place-items: center;
      background: rgba(18, 17, 34, 0.55);
      backdrop-filter: blur(6px);
      color: white;
      font-size: 1.3rem;
      text-align: center;
      padding: 2rem;
      z-index: 20;
    }

    .story-card {
      border-radius: 24px;
      padding: 1.6rem;
      background: linear-gradient(145deg, rgba(18, 17, 34, 0.92), rgba(18, 17, 34, 0.78));
      color: white;
      box-shadow: 0 20px 45px rgba(18, 17, 34, 0.35);
    }

    .story-line {
      padding: 0.85rem 1rem;
      border-radius: 14px;
      margin-top: 0.75rem;
      background: rgba(255, 255, 255, 0.08);
      cursor: pointer;
      user-select: none;
      transition: background 0.2s ease, transform 0.2s ease;
    }

    .story-line.revealed {
      background: rgba(255, 255, 255, 0.16);
      transform: translateY(-1px);
    }

    .story-line span {
      display: block;
      opacity: 0.88;
    }

    .section-title {
      font-size: 1.1rem;
      font-weight: 700;
      margin: 0 0 0.6rem;
      letter-spacing: 0.02em;
      text-transform: uppercase;
      color: rgba(18, 17, 34, 0.65);
    }

    .error {
      color: var(--accent-strong);
      font-weight: 600;
    }

    .success {
      color: #0d9f6d;
      font-weight: 600;
    }

    @media (max-width: 640px) {
      .card {
        border-radius: 22px;
        padding: 1.6rem;
      }

      .room-header {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `;

  constructor() {
    super();
    this.screen = 'landing';
    this.rooms = [];
    this.joinGroupName = '';
    this.configureData = { groupName: '', maxPlayers: 6, maxWords: 12 };
    this.configureError = '';
    this.configureSuccess = '';
    this.roomId = null;
    this.roomData = null;
    this.prompts = PROMPTS;
    this.players = [];
    this.playerId = localStorage.getItem(STORAGE_KEYS.playerId) || generatePlayerId();
    localStorage.setItem(STORAGE_KEYS.playerId, this.playerId);
    this.playerName = localStorage.getItem(STORAGE_KEYS.playerName) || '';
    this.isHost = false;
    this.joinName = this.playerName;
    this.joinError = '';
    this.answers = new Map();
    this.turnStatus = new Map();
    this.assignments = new Map();
    this.responseText = '';
    this.waitingTurn = false;
    this.revealState = [];
    this.unsubscribeRoom = null;
    this.handlePopState = this.handlePopState.bind(this);
    window.addEventListener('popstate', this.handlePopState);

    this.unsubscribeIndex = gunService.watchRoomsIndex((rooms) => {
      this.rooms = rooms;
      this.requestUpdate();
    });

    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      this.openRoom(room, false);
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.unsubscribeIndex?.();
    this.unsubscribeRoom?.();
    window.removeEventListener('popstate', this.handlePopState);
  }

  update(changed) {
    super.update(changed);
    if (changed.has('roomData') || changed.has('players') || changed.has('turnStatus')) {
      this.evaluateTurnProgress();
    }
    if (changed.has('roomId')) {
      this.revealState = [];
      this.responseText = '';
      this.waitingTurn = false;
    }
    if (changed.has('roomData') && this.roomData?.status === 'reveal') {
      this.revealState = [];
      this.waitingTurn = false;
    }
  }

  navigate(screen) {
    this.screen = screen;
    if (screen !== 'room') {
      const url = new URL(window.location.href);
      url.searchParams.delete('room');
      window.history.replaceState({}, '', url);
    }
  }

  openRoom(roomId, pushHistory = true) {
    this.screen = 'room';
    this.roomId = roomId;
    if (pushHistory) {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.pushState({}, '', url);
    } else {
      const url = new URL(window.location.href);
      url.searchParams.set('room', roomId);
      window.history.replaceState({}, '', url);
    }
    this.subscribeToRoom(roomId);
  }

  handlePopState() {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      this.openRoom(room, false);
    } else {
      this.screen = 'landing';
      this.roomId = null;
    }
  }

  subscribeToRoom(roomId) {
    this.unsubscribeRoom?.();
    this.roomData = null;
    this.players = [];
    this.answers = new Map();
    this.turnStatus = new Map();
    this.assignments = new Map();
    this.unsubscribeRoom = gunService.subscribeToRoom(roomId, {
      onRoom: (data) => {
        if (!data) {
          this.roomData = null;
          return;
        }
        let prompts = PROMPTS;
        if (data.prompts) {
          try {
            prompts = Array.isArray(data.prompts) ? data.prompts : JSON.parse(data.prompts);
          } catch (error) {
            console.warn('Impossibile leggere le domande dalla stanza, uso default.', error);
            prompts = PROMPTS;
          }
        }
        this.roomData = { ...data, prompts };
        this.prompts = prompts;
        if (data.hostId && data.hostId === this.playerId) {
          this.isHost = true;
        }
      },
      onPlayers: (players) => {
        this.players = players;
        const hostId = this.roomData?.hostId;
        const hostStillPresent = hostId ? players.some((p) => p.id === hostId) : false;
        if (!hostId || !hostStillPresent) {
          if (players.length) {
            const newHost = players[0].id;
            gunService.updateRoom(this.roomId, { hostId: newHost });
            this.isHost = newHost === this.playerId;
          }
        } else {
          this.isHost = hostId === this.playerId;
        }
      },
      onAnswers: (answers) => {
        this.answers = answers;
      },
      onTurnStatus: (statusMap) => {
        this.turnStatus = statusMap;
        const currentKey = `${this.roomData?.currentTurn ?? 0}_${this.playerId}`;
        const entry = statusMap.get(currentKey);
        this.waitingTurn = entry?.state === 'done' && (this.roomData?.status === 'playing');
      },
      onAssignments: (assignments) => {
        this.assignments = assignments;
      },
    });
  }

  handleConfigureInput(field, value) {
    this.configureData = { ...this.configureData, [field]: value };
  }

  async createRoom(event) {
    event.preventDefault();
    this.configureError = '';
    this.configureSuccess = '';
    try {
      const result = await gunService.createRoom(this.configureData);
      const url = new URL(window.location.href);
      url.searchParams.set('room', result.roomId);
      this.configureSuccess = url.toString();
    } catch (error) {
      this.configureError = error.message || 'Impossibile creare la stanza.';
    }
  }

  joinExistingGroup(event) {
    event?.preventDefault();
    this.joinError = '';
    const slug = slugify(this.joinGroupName);
    if (!slug) {
      this.joinError = 'Inserisci un nome di gruppo valido.';
      return;
    }
    const exists = this.rooms.some((room) => room.id === slug);
    if (!exists) {
      this.joinError = 'Nessuna stanza trovata con questo nome.';
      return;
    }
    this.openRoom(slug);
  }

  async joinRoom(event) {
    event.preventDefault();
    if (!this.roomId) return;
    const name = (this.joinName || '').trim();
    if (!name) {
      this.joinError = 'Inserisci il tuo nome.';
      return;
    }
    if (this.players.some((p) => p.id === this.playerId)) {
      this.joinError = '';
      return;
    }
    if (this.roomData?.maxPlayers && this.players.length >= this.roomData.maxPlayers) {
      this.joinError = 'La stanza è piena.';
      return;
    }
    const payload = {
      name,
      joinedAt: Date.now(),
      lastActive: Date.now(),
    };
    await gunService.ensurePlayer(this.roomId, this.playerId, payload);
    localStorage.setItem(STORAGE_KEYS.playerName, name);
    this.playerName = name;
    this.joinError = '';
    if (!this.roomData?.hostId) {
      gunService.updateRoom(this.roomId, { hostId: this.playerId });
    }
  }

  leaveRoom() {
    if (this.roomId && this.playerId) {
      gunService.removePlayer(this.roomId, this.playerId);
    }
    this.roomId = null;
    this.roomData = null;
    this.players = [];
    this.screen = 'group-selection';
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url);
  }

  startGame() {
    if (!this.isHost || !this.roomId) return;
    gunService.clearCollection(this.roomId, 'answers');
    gunService.clearCollection(this.roomId, 'turnStatus');
    gunService.clearCollection(this.roomId, 'finalAssignments');
    gunService.updateRoom(this.roomId, {
      status: 'playing',
      currentTurn: 0,
      startedAt: Date.now(),
    });
    this.responseText = '';
    this.waitingTurn = false;
    this.joinError = '';
  }

  handleAnswerInput(event) {
    const value = event.target.value;
    const limited = clampWords(value, this.roomData?.maxWords || 0);
    if (limited !== value) {
      event.target.value = limited;
    }
    this.responseText = limited;
  }

  submitAnswer(event) {
    event.preventDefault();
    if (!this.roomData || !this.roomId) return;
    const currentTurn = this.roomData.currentTurn ?? 0;
    const players = this.players;
    const playerIndex = players.findIndex((p) => p.id === this.playerId);
    if (playerIndex < 0) {
      this.joinError = 'Prima unisciti alla stanza.';
      return;
    }
    const sheetIndex = this.computeSheetIndex(playerIndex, currentTurn, players.length);
    const key = `${currentTurn}_${sheetIndex}`;
    const text = (this.responseText || '').trim();
    if (!text) {
      this.joinError = 'Scrivi qualcosa prima di confermare.';
      return;
    }
    const payload = {
      text,
      playerId: this.playerId,
      turn: currentTurn,
      sheetIndex,
      timestamp: Date.now(),
    };
    gunService.writeAnswer(this.roomId, key, payload);
    gunService.setTurnStatus(this.roomId, `${currentTurn}_${this.playerId}`, {
      state: 'done',
      timestamp: Date.now(),
    });
    this.responseText = '';
    this.waitingTurn = true;
    this.joinError = '';
  }

  computeSheetIndex(playerIndex, turn, totalPlayers) {
    if (totalPlayers === 0) return 0;
    return ((playerIndex - turn) % totalPlayers + totalPlayers) % totalPlayers;
  }

  evaluateTurnProgress() {
    if (!this.roomData || this.roomData.status !== 'playing') return;
    if (!this.isHost) return;
    const players = this.players || [];
    if (!players.length) return;
    const currentTurn = this.roomData.currentTurn ?? 0;
    const expected = players.length;
    let completed = 0;
    players.forEach((player) => {
      const entry = this.turnStatus.get(`${currentTurn}_${player.id}`);
      if (entry?.state === 'done') {
        completed += 1;
      }
    });
    if (completed >= expected) {
      if (currentTurn + 1 >= TOTAL_TURNS) {
        this.finaliseAssignments();
      } else {
        gunService.clearCollection(this.roomId, 'turnStatus');
        gunService.updateRoom(this.roomId, {
          currentTurn: currentTurn + 1,
        });
      }
    }
  }

  finaliseAssignments() {
    if (!this.roomData) return;
    const players = this.players || [];
    if (!players.length) return;
    const assignments = new Map();
    players.forEach((player, index) => {
      const sheetIndex = (index + 1) % players.length;
      assignments.set(player.id, {
        sheetIndex,
        assignedAt: Date.now(),
      });
    });
    gunService.clearCollection(this.roomId, 'turnStatus');
    gunService.setAssignments(this.roomId, assignments);
    gunService.updateRoom(this.roomId, {
      status: 'reveal',
      currentTurn: TOTAL_TURNS - 1,
      finishedAt: Date.now(),
    });
  }

  revealLine(index) {
    if (!this.revealState.includes(index)) {
      this.revealState = [...this.revealState, index];
    }
  }

  render() {
    switch (this.screen) {
      case 'landing':
        return this.renderLanding();
      case 'group-selection':
        return this.renderGroupSelection();
      case 'configure':
        return this.renderConfigure();
      case 'room':
        return this.renderRoom();
      default:
        return this.renderLanding();
    }
  }

  renderLanding() {
    return html`
      <div class="container">
        <div class="card">
          <span class="tag">Il gioco della Sigaretta</span>
          <h1>Benvenutə nel teatro surreale più veloce del web.</h1>
          <p>
            Questo portale digitale reimmagina il gioco della sigaretta: prepara il tuo gruppo,
            passa i fogli virtuali, scrivi otto risposte nonsense e scopri le storie generate
            collettivamente. Tutto accade in tempo reale, anche a distanza.
          </p>
          <h2>Regolamento</h2>
          <ol>
            <li>Si può giocare in 2–8 persone.</li>
            <li>Ogni turno tutti rispondono alla domanda proposta.</li>
            <li>Dopo aver scritto, il foglio viene passato alla persona alla propria destra.</li>
            <li>Dopo otto giri il foglio passa tre volte in senso antiorario e poi si legge ad alta voce.</li>
          </ol>
          <div class="actions">
            <button @click=${() => this.navigate('group-selection')}>Continua al gioco</button>
            <button class="secondary" @click=${() => this.navigate('configure')}>
              Configura una partita
            </button>
          </div>
        </div>
      </div>
    `;
  }

  renderGroupSelection() {
    return html`
      <div class="container">
        <div class="card">
          <h1>Entra in un gruppo</h1>
          <p>Scegli il nome del gruppo oppure seleziona una stanza aperta qui sotto.</p>
          <form class="grid" @submit=${(e) => this.joinExistingGroup(e)}>
            <label>
              Nome del gruppo
              <input
                placeholder="es. Compagnia dei Sognatori"
                .value=${this.joinGroupName}
                @input=${(e) => (this.joinGroupName = e.target.value)}
              />
            </label>
            ${this.joinError
              ? html`<span class="error">${this.joinError}</span>`
              : nothing}
            <div class="actions">
              <button type="submit">Unisciti</button>
              <button type="button" class="secondary" @click=${() => this.navigate('landing')}>
                Torna alle regole
              </button>
              <button type="button" class="secondary" @click=${() => this.navigate('configure')}>
                Configura una partita
              </button>
            </div>
          </form>
          <h2>Stanze disponibili</h2>
          <div class="list">
            ${this.rooms.length === 0
              ? html`<div class="muted">Nessuna stanza configurata al momento.</div>`
              : this.rooms.map(
                  (room) => html`
                    <div class="list-item">
                      <div>
                        <strong>${room.groupName}</strong>
                        <div class="muted">
                          Creata ${room.createdAt ? formatDateDistance(room.createdAt) : 'da poco'}
                        </div>
                      </div>
                      <button class="secondary" @click=${() => this.openRoom(room.id)}>
                        Entra
                      </button>
                    </div>
                  `
                )}
          </div>
        </div>
      </div>
    `;
  }

  renderConfigure() {
    return html`
      <div class="container">
        <div class="card">
          <h1>Configura una nuova partita</h1>
          <p>
            Imposta i parametri del gruppo. Condividi il link generato con chi vuoi e attendi che
            tuttə entrino nella stanza prima di iniziare.
          </p>
          <form class="grid columns" @submit=${(e) => this.createRoom(e)}>
            <label>
              Nome del gruppo
              <input
                required
                placeholder="es. Sigaretta del Martedì"
                .value=${this.configureData.groupName}
                @input=${(e) => this.handleConfigureInput('groupName', e.target.value)}
              />
            </label>
            <label>
              Max partecipanti (max 8)
              <input
                type="number"
                min="2"
                max="8"
                .value=${this.configureData.maxPlayers}
                @input=${(e) => this.handleConfigureInput('maxPlayers', e.target.value)}
              />
            </label>
            <label>
              Max parole per risposta
              <input
                type="number"
                min="1"
                max="30"
                .value=${this.configureData.maxWords}
                @input=${(e) => this.handleConfigureInput('maxWords', e.target.value)}
              />
            </label>
            <div class="actions">
              <button type="submit">Genera link</button>
              <button type="button" class="secondary" @click=${() => this.navigate('group-selection')}>
                Torna all’elenco gruppi
              </button>
            </div>
          </form>
          ${this.configureError ? html`<div class="error">${this.configureError}</div>` : nothing}
          ${this.configureSuccess
            ? html`
                <div class="success">
                  Link generato:
                  <a href="${this.configureSuccess}">${this.configureSuccess}</a>
                </div>
                <div class="actions">
                  <button
                    type="button"
                    class="secondary"
                    @click=${() => navigator.clipboard?.writeText(this.configureSuccess)}
                  >
                    Copia link
                  </button>
                  <button type="button" @click=${() => this.openRoom(new URL(this.configureSuccess).searchParams.get('room'))}>
                    Vai alla stanza
                  </button>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }

  renderRoom() {
    if (!this.roomData) {
      return html`
        <div class="container">
          <div class="card">
            <h1>Caricamento stanza…</h1>
            <p class="muted">Verifica il link o attendi qualche secondo.</p>
            <div class="actions">
              <button class="secondary" @click=${() => this.navigate('group-selection')}>
                Torna all’elenco
              </button>
            </div>
          </div>
        </div>
      `;
    }

    const isMember = this.players.some((p) => p.id === this.playerId);

    return html`
      <div class="container">
        <div class="room-header">
          <div>
            <span class="tag">${this.roomData.groupName}</span>
            <h1>Stanza di gioco</h1>
            <div class="muted">
              Stato: <strong>${this.renderStatusLabel(this.roomData.status)}</strong>
              · Partecipanti: ${this.players.length}/${this.roomData.maxPlayers}
            </div>
          </div>
          <div class="actions">
            <button class="secondary" @click=${() => this.leaveRoom()}>Esci dalla stanza</button>
          </div>
        </div>

        ${!isMember ? this.renderJoinForm() : nothing}
        ${isMember ? this.renderRoomInner() : nothing}
      </div>
      ${this.waitingTurn
        ? html`<div class="waiting-overlay">Aspetta gli altri giocatori…</div>`
        : nothing}
    `;
  }

  renderStatusLabel(status) {
    switch (status) {
      case 'lobby':
        return 'In attesa di iniziare';
      case 'playing':
        return `Turno ${Math.min((this.roomData?.currentTurn ?? 0) + 1, TOTAL_TURNS)} di ${TOTAL_TURNS}`;
      case 'reveal':
        return 'Rivelazione finale';
      default:
        return status || '—';
    }
  }

  renderJoinForm() {
    return html`
      <div class="card" style="margin-bottom: 2rem;">
        <h2>Presentati al gruppo</h2>
        <form class="grid" @submit=${(e) => this.joinRoom(e)}>
          <label>
            Il tuo nome
            <input
              required
              placeholder="es. Camilla"
              .value=${this.joinName}
              @input=${(e) => (this.joinName = e.target.value)}
            />
          </label>
          ${this.joinError ? html`<span class="error">${this.joinError}</span>` : nothing}
          <div class="actions">
            <button type="submit">Entra nella stanza</button>
          </div>
        </form>
      </div>
    `;
  }

  renderRoomInner() {
    switch (this.roomData.status) {
      case 'lobby':
        return this.renderLobby();
      case 'playing':
        return this.renderGame();
      case 'reveal':
        return this.renderReveal();
      default:
        return nothing;
    }
  }

  renderLobby() {
    return html`
      <div class="card">
        <h2>Lobby</h2>
        <p class="muted">
          Condividi il link della stanza: <strong>${window.location.href}</strong>
        </p>
        <div class="section-title">Giocatori</div>
        <div class="list">
          ${this.players.length === 0
            ? html`<div class="muted">Ancora nessuno nella stanza.</div>`
            : this.players.map(
                (player, index) => html`
                  <div class="list-item">
                    <div>
                      <strong>${player.name || 'Anonimə'}</strong>
                      <div class="muted">
                        Posizione al tavolo: ${index + 1}
                      </div>
                    </div>
                    ${player.id === this.roomData?.hostId
                      ? html`<span class="pill">Host</span>`
                      : nothing}
                  </div>
                `
              )}
        </div>
        ${this.isHost
          ? html`
              <div class="actions">
                <button
                  ?disabled=${this.players.length < 2}
                  @click=${() => this.startGame()}
                >
                  Avvia la partita
                </button>
              </div>
              ${this.players.length < 2
                ? html`<p class="muted">Servono almeno due giocatori per iniziare.</p>`
                : nothing}
            `
          : html`<p class="muted">Attendi che l’host avvii la partita.</p>`}
      </div>
    `;
  }

  renderGame() {
    const players = this.players;
    const currentTurn = this.roomData.currentTurn ?? 0;
    const playerIndex = players.findIndex((p) => p.id === this.playerId);
    if (playerIndex < 0) {
      return html`<div class="error">Problema con il tuo accesso. Riprova a entrare.</div>`;
    }
    const sheetIndex = this.computeSheetIndex(playerIndex, currentTurn, players.length);
    const key = `${currentTurn}_${sheetIndex}`;
    const prompt = this.prompts[currentTurn] || 'Domanda';
    const existingAnswer = this.answers.get(key)?.text;
    const maxWords = this.roomData.maxWords;
    const words = countWords(this.responseText || '');

    return html`
      <div class="grid" style="gap: 2rem;">
        <div class="card">
          <div class="tag">Turno ${currentTurn + 1} di ${TOTAL_TURNS}</div>
          <h2>${prompt}</h2>
          <p class="muted">
            Stai completando il foglio numero ${sheetIndex + 1}. Parole massime consentite: ${maxWords}.
          </p>
          ${existingAnswer
            ? html`<p class="highlight">Hai già inviato la tua risposta per questo turno.</p>`
            : html`
                <form class="grid" @submit=${(e) => this.submitAnswer(e)}>
                  <label>
                    La tua risposta
                    <textarea
                      maxlength="220"
                      .value=${this.responseText}
                      @input=${(e) => this.handleAnswerInput(e)}
                      placeholder="Scrivi qui la tua trovata surreale…"
                    ></textarea>
                  </label>
                  <div class="muted">${words}/${maxWords} parole</div>
                  ${this.joinError ? html`<span class="error">${this.joinError}</span>` : nothing}
                  <div class="actions">
                    <button type="submit">Conferma e passa il foglio</button>
                  </div>
                </form>
              `}
        </div>
        <div class="card">
          <div class="section-title">Partecipanti e stato turno</div>
          <div class="list">
            ${players.map((player, index) => {
              const entry = this.turnStatus.get(`${currentTurn}_${player.id}`);
              const done = entry?.state === 'done';
              return html`
                <div class="list-item">
                  <div>
                    <strong>${player.name || 'Anonimə'}</strong>
                    <div class="muted">Foglio corrente: ${this.computeSheetIndex(index, currentTurn, players.length) + 1}</div>
                  </div>
                  <span class="pill" style="background: ${done
                    ? 'rgba(13, 159, 109, 0.18)'
                    : 'rgba(244, 93, 72, 0.12)'}; color: ${done ? '#0d9f6d' : 'var(--accent-strong)'};">
                    ${done ? 'Prontə' : 'Sta scrivendo'}
                  </span>
                </div>
              `;
            })}
          </div>
        </div>
      </div>
    `;
  }

  renderReveal() {
    const players = this.players;
    const assignment = this.assignments.get(this.playerId);
    const sheetIndex = assignment?.sheetIndex ?? 0;
    const lines = Array.from({ length: TOTAL_TURNS }, (_, turn) => {
      const key = `${turn}_${sheetIndex}`;
      const answer = this.answers.get(key);
      return answer?.text || '—';
    });
    return html`
      <div class="grid" style="gap: 2rem;">
        <div class="card">
          <h2>Rivelazione finale</h2>
          <p>
            Ti è stata passata la sigaretta numero ${sheetIndex + 1}. Premi sulle righe per svelare il
            racconto.
          </p>
          <div class="story-card">
            ${lines.map((line, index) => {
              const revealed = this.revealState.includes(index);
              return html`
                <div
                  class="story-line ${revealed ? 'revealed' : ''}"
                  @click=${() => this.revealLine(index)}
                >
                  ${revealed ? html`<span>${line}</span>` : html`<span>●●●●●</span>`}
                </div>
              `;
            })}
          </div>
        </div>
        <div class="card">
          <div class="section-title">Ordine dei giocatori</div>
          <div class="list">
            ${players.map(
              (player, index) => html`
                <div class="list-item">
                  <div>
                    <strong>${player.name || 'Anonimə'}</strong>
                    <div class="muted">Foglio iniziale: ${index + 1}</div>
                  </div>
                </div>
              `
            )}
          </div>
          ${this.isHost
            ? html`
                <div class="actions" style="margin-top: 1.5rem;">
                  <button @click=${() => this.startGame()}>Nuova partita con lo stesso gruppo</button>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('sigaretta-app', SigarettaApp);
