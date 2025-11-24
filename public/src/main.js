import { html, css, LitElement, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { gunService } from './gun-service.js';
import { PROMPTS, TOTAL_TURNS as DEFAULT_TOTAL_TURNS } from './prompts.js';
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
    roomError: { state: true },
    answers: { state: true },
    turnStatus: { state: true },
    assignments: { state: true },
    responseText: { state: true },
    waitingTurn: { state: true },
    revealState: { state: true },
    connectionPeers: { state: true },
    storyImageUrl: { state: true },
    storyImageError: { state: true },
    storyImageLoading: { state: true },
  };

  get totalTurns() {
    if (Array.isArray(this.prompts) && this.prompts.length > 0) {
      return this.prompts.length;
    }
    return DEFAULT_TOTAL_TURNS;
  }

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
      background: #ffffff;
      color: #0f0f12;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
    }

    textarea {
      resize: vertical;
      min-height: 140px;
    }

    input::placeholder,
    textarea::placeholder {
      color: rgba(15, 15, 18, 0.45);
    }

    .checkbox {
      display: flex;
      align-items: center;
      gap: 0.7rem;
      font-weight: 600;
    }

    .checkbox input[type='checkbox'] {
      width: auto;
      margin: 0;
      accent-color: var(--accent);
    }

    .checkbox span {
      font-size: 0.95rem;
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

    .story-label {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.78);
      margin-bottom: 0.35rem;
    }

    .story-dot {
      letter-spacing: 0.08em;
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

    .generated-image {
      margin-top: 1rem;
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid rgba(255, 255, 255, 0.2);
    }

    .generated-image img {
      display: block;
      width: 100%;
      height: auto;
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
    this.configureData = { groupName: '', maxPlayers: 6, maxWords: 12, onlyHostStarts: true };
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
    this.roomError = '';
    this.answers = new Map();
    this.turnStatus = new Map();
    this.assignments = new Map();
    this.responseText = '';
    this.waitingTurn = false;
    this.revealState = [];
    this.connectionPeers = [];
    this.storyImageUrl = '';
    this.storyImageError = '';
    this.storyImageLoading = false;
    this.unsubscribeRoom = null;
    this.handlePopState = this.handlePopState.bind(this);
    window.addEventListener('popstate', this.handlePopState);

    this.unsubscribeIndex = gunService.watchRoomsIndex((rooms) => {
      this.rooms = rooms;
      this.requestUpdate();
    });

    this.unsubscribeConnection = gunService.onConnection(({ peers }) => {
      this.connectionPeers = peers;
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
    this.unsubscribeConnection?.();
    window.removeEventListener('popstate', this.handlePopState);
  }

  update(changed) {
    super.update(changed);
    if (changed.has('roomData') || changed.has('players') || changed.has('turnStatus')) {
      this.evaluateTurnProgress();
    }
    if (changed.has('roomData') || changed.has('players')) {
      this.maybeAutoStartGame();
    }
    if (changed.has('roomData')) {
      const previous = changed.get('roomData');
      const currentTurn = this.roomData?.currentTurn ?? -1;
      const prevTurn = previous?.currentTurn ?? -1;
      const currentStatus = this.roomData?.status;
      const prevStatus = previous?.status;
      if (currentTurn !== prevTurn) {
        this.waitingTurn = false;
        this.responseText = '';
      } else if (currentStatus !== prevStatus && currentStatus === 'playing') {
        this.waitingTurn = false;
      }
    }
    if (changed.has('roomId')) {
      this.revealState = [];
      this.responseText = '';
      this.waitingTurn = false;
      this.storyImageUrl = '';
      this.storyImageError = '';
      this.storyImageLoading = false;
    }
    if (changed.has('roomData') && this.roomData?.status === 'reveal') {
      this.revealState = [];
      this.waitingTurn = false;
      this.storyImageUrl = '';
      this.storyImageError = '';
      this.storyImageLoading = false;
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
    this.roomError = '';
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

    const currentRoom = roomId;
    gunService.fetchRoom(roomId).then((data) => {
      if (this.roomId !== currentRoom) return;
      if (!data) {
        this.roomData = null;
        this.roomError = 'Stanza non trovata. Controlla il link oppure attendi che l’host condivida nuovamente la stanza.';
        return;
      }
      this.applyRoomData(data);
    });
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
          this.roomError =
            this.roomError ||
            'Stanza non disponibile o non più attiva. Chiedi a chi ha creato la partita di verificare il link.';
          return;
        }
        this.applyRoomData(data);
      },
      onPlayers: (players) => {
        this.players = players;
        const hostId = this.roomData?.hostId;
        const onlyHostStarts = this.roomData?.onlyHostStarts;
        const status = this.roomData?.status;
        const hostStillPresent = hostId ? players.some((p) => p.id === hostId) : false;
        const shouldReassign =
          !hostId ||
          (!hostStillPresent && (!onlyHostStarts || (status && status !== 'lobby')));
        if (shouldReassign) {
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
        if (this.isHost && this.roomData?.status === 'playing') {
          this.evaluateTurnProgress(statusMap);
        }
      },
      onAssignments: (assignments) => {
        this.assignments = assignments;
      },
    });
  }

  applyRoomData(rawData) {
    if (!rawData) return;
    let prompts = PROMPTS;
    if (rawData.prompts) {
      try {
        prompts = Array.isArray(rawData.prompts) ? rawData.prompts : JSON.parse(rawData.prompts);
      } catch (error) {
        console.warn('Impossibile leggere le domande dalla stanza, uso default.', error);
        prompts = PROMPTS;
      }
    }
    const onlyHostStarts =
      typeof rawData.onlyHostStarts === 'boolean' ? rawData.onlyHostStarts : true;
    const playerOrder = Array.isArray(rawData.playerOrder) ? rawData.playerOrder.filter(Boolean) : undefined;
    this.roomData = { ...rawData, prompts, onlyHostStarts, playerOrder };
    this.prompts = prompts;
    this.isHost = rawData.hostId && rawData.hostId === this.playerId;
    this.roomError = '';
  }

  handleConfigureInput(field, value) {
    this.configureData = { ...this.configureData, [field]: value };
  }

  async createRoom(event) {
    event.preventDefault();
    this.configureError = '';
    this.configureSuccess = '';
    try {
      const result = await gunService.createRoom({
        ...this.configureData,
        hostId: this.playerId,
      });
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
    this.roomError = '';
    this.screen = 'group-selection';
    const url = new URL(window.location.href);
    url.searchParams.delete('room');
    window.history.replaceState({}, '', url);
  }

  canCurrentPlayerStart() {
    if (!this.roomData) return false;
    if (this.roomData.onlyHostStarts) {
      return this.isHost;
    }
    return this.players.some((p) => p.id === this.playerId);
  }

  maybeAutoStartGame() {
    if (!this.roomData || !this.roomId) return;
    if (this.roomData.status !== 'lobby') return;
    if (this.roomData.onlyHostStarts) return;
    const playerCount = this.players?.length ?? 0;
    if (playerCount < 2) return;
    const maxPlayers = Number(this.roomData.maxPlayers) || 0;
    if (maxPlayers > 0 && playerCount < maxPlayers) return;
    this.startGame();
  }

  startGame() {
    if (!this.roomId) return;
    if (!this.canCurrentPlayerStart()) return;
    const playerOrder = this.getPlayersInOrder().map((p) => p.id);
    gunService.clearCollection(this.roomId, 'answers');
    gunService.clearCollection(this.roomId, 'turnStatus');
    gunService.clearCollection(this.roomId, 'finalAssignments');
    gunService.updateRoom(this.roomId, {
      status: 'playing',
      currentTurn: 0,
      startedAt: Date.now(),
      playerOrder,
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
    event.stopPropagation();
    if (!this.roomData || !this.roomId) return;
    const currentTurn = this.roomData.currentTurn ?? 0;
    const playerOrder = this.getPlayerOrder();
    const playerIndex = playerOrder.indexOf(this.playerId);
    if (playerIndex < 0) {
      this.joinError = 'La partita è già in corso oppure non fai parte del gruppo iniziale.';
      return;
    }
    const sheetIndex = this.computeSheetIndex(playerIndex, currentTurn, playerOrder.length);
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
    const statusEntry = {
      state: 'done',
      timestamp: Date.now(),
    };
    const updatedAnswers = new Map(this.answers);
    updatedAnswers.set(key, payload);
    this.answers = updatedAnswers;
    gunService.writeAnswer(this.roomId, key, payload);
    const updatedStatus = new Map(this.turnStatus);
    updatedStatus.set(`${currentTurn}_${this.playerId}`, statusEntry);
    this.turnStatus = updatedStatus;
    gunService.setTurnStatus(this.roomId, `${currentTurn}_${this.playerId}`, statusEntry);
    this.responseText = '';
    this.waitingTurn = true;
    this.joinError = '';
    if (this.isHost) {
      this.evaluateTurnProgress(updatedStatus);
    }
  }

  async closeRoomForever() {
    if (!this.roomId || !this.isHost) return;
    try {
      await gunService.deleteRoom(this.roomId);
      this.leaveRoom();
    } catch (error) {
      this.roomError = error.message || 'Impossibile chiudere la stanza in modo definitivo.';
    }
  }

  getPlayerOrder() {
    const savedOrder = this.roomData?.playerOrder;
    if (Array.isArray(savedOrder) && savedOrder.length) {
      return savedOrder.filter(Boolean);
    }
    return (this.players || []).map((p) => p.id);
  }

  getPlayersInOrder() {
    const byId = new Map((this.players || []).map((p) => [p.id, p]));
    return this.getPlayerOrder()
      .map((id) => byId.get(id))
      .filter(Boolean);
  }

  computeSheetIndex(playerIndex, turn, totalPlayers) {
    if (totalPlayers === 0) return 0;
    return ((playerIndex - turn) % totalPlayers + totalPlayers) % totalPlayers;
  }

  evaluateTurnProgress(statusSnapshot = this.turnStatus) {
    if (!this.roomData || this.roomData.status !== 'playing') return;
    if (!this.isHost) return;
    const playerOrder = this.getPlayerOrder();
    if (!playerOrder.length) return;
    const currentTurn = this.roomData.currentTurn ?? 0;
    const expected = playerOrder.length;
    let completed = 0;
    playerOrder.forEach((playerId) => {
      const entry = statusSnapshot.get(`${currentTurn}_${playerId}`);
      if (entry?.state === 'done') {
        completed += 1;
      }
    });
    if (completed >= expected) {
      if (currentTurn + 1 >= this.totalTurns) {
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
    const playerOrder = this.getPlayerOrder();
    if (!playerOrder.length) return;
    const playersById = new Map((this.players || []).map((p) => [p.id, p]));
    const assignments = new Map();
    const finalTurn = this.roomData?.currentTurn ?? Math.max(this.totalTurns - 1, 0);
    playerOrder.forEach((playerId, index) => {
      const sheetIndex = this.computeSheetIndex(index, finalTurn, playerOrder.length);
      assignments.set(playerId, {
        sheetIndex,
        assignedAt: Date.now(),
        name: playersById.get(playerId)?.name,
      });
    });
    gunService.clearCollection(this.roomId, 'turnStatus');
    gunService.setAssignments(this.roomId, assignments);
    gunService.updateRoom(this.roomId, {
      status: 'reveal',
      currentTurn: Math.max(this.totalTurns - 1, 0),
      finishedAt: Date.now(),
    });
  }

  revealLine(index) {
    if (!this.revealState.includes(index)) {
      this.revealState = [...this.revealState, index];
    }
  }

  buildStoryLines(sheetIndex) {
    return Array.from({ length: this.totalTurns }, (_, turn) => {
      const prompt = this.prompts[turn] || `Domanda ${turn + 1}`;
      const key = `${turn}_${sheetIndex}`;
      const answer = this.answers.get(key);
      return {
        prompt,
        text: answer?.text || '—',
      };
    });
  }

  async generateStoryImage(prompt) {
    const trimmedPrompt = (prompt || '').trim();
    if (!trimmedPrompt) {
      this.storyImageError = 'Scrivi almeno una risposta prima di generare un’illustrazione.';
      return;
    }
    this.storyImageLoading = true;
    this.storyImageError = '';
    this.storyImageUrl = '';
    try {
      const response = await fetch('/api/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: trimmedPrompt }),
      });
      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Impossibile generare l’immagine. Verifica la chiave API sul server.');
      }
      const data = await response.json();
      if (!data.url) {
        throw new Error('Risposta inattesa dal servizio di generazione.');
      }
      this.storyImageUrl = data.url;
    } catch (error) {
      this.storyImageError = error.message || 'Errore sconosciuto durante la generazione.';
    } finally {
      this.storyImageLoading = false;
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
        <div class="hero-grid">
          <div class="card">
            <span class="tag">Il gioco della Sigaretta · Web service pronto per Render</span>
            <h1 class="hero-title">
              Storie surrealiste <span class="accent-text">in tempo reale</span>, con hosting dinamico e
              lobby guidata.
            </h1>
            <p>
              Questa release non è più solo un sito statico: un server Express con relay Gun integrato
              mantiene le stanze vive, offre un endpoint <code>/health</code> per Render e garantisce che il
              link generato dall’host resti funzionante per tutta la sessione.
            </p>
            <div class="chips">
              <span class="chip">Relay Gun incluso</span>
              <span class="chip">Routing single-page</span>
              <span class="chip">Controllo host preservato</span>
            </div>
            <div class="feature-list">
              <div class="feature-item">
                <strong>1. Homepage guidata.</strong>
                Ogni modifica è riassunta qui: web service, controlli host e flusso in tre tap.
              </div>
              <div class="feature-item">
                <strong>2. Backend dedicato.</strong>
                Un server Node/Express serve i file, tiene vivo Gun su <code>/gun</code> e risponde al
                healthcheck di Render.
              </div>
              <div class="feature-item">
                <strong>3. Flusso di gioco testato.</strong>
                Dal link host alla rivelazione finale: i passaggi richiesti sono descritti e pronti da
                seguire.
              </div>
            </div>
            <div class="actions">
              <button @click=${() => this.navigate('group-selection')}>Continua al gioco</button>
              <button class="secondary" @click=${() => this.navigate('configure')}>
                Configura una partita
              </button>
            </div>
          </div>
          <div class="card">
            <div class="tag">Percorso consigliato</div>
            <h2>Come si gioca ora</h2>
            <div class="steps">
              <div class="step">
                <h3>Host → crea link stanza</h3>
                <p>Imposta nome gruppo, parole massime e blocco “solo host avvia”. Condividi il link.</p>
              </div>
              <div class="step">
                <h3>Due giocatori → scrivono</h3>
                <p>Entrano con il link, completano i turni. Il sistema passa i fogli virtuali a ogni giro.</p>
              </div>
              <div class="step">
                <h3>Rivelazione finale</h3>
                <p>Ogni persona riceve la propria “sigaretta”. Clicca le righe per svelare i punti uno a uno.</p>
              </div>
            </div>
            <div class="pill-note">Suggerito per test: host + 2 player fino alla rivelazione.</div>
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
            <label class="checkbox">
              <input
                type="checkbox"
                .checked=${this.configureData.onlyHostStarts}
                @change=${(e) => this.handleConfigureInput('onlyHostStarts', e.target.checked)}
              />
              <span>Solo io posso avviare la partita</span>
            </label>
            <p class="muted" style="margin-top: -0.5rem; grid-column: 1 / -1;">
              Se deselezionato, chiunque entra nella stanza potrà iniziare la partita quando prontə.
            </p>
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
    if (this.roomError && !this.roomData) {
      return html`
        <div class="container">
          <div class="card">
            <h1>Stanza non disponibile</h1>
            <p class="error">${this.roomError}</p>
            <div class="actions">
              <button class="secondary" @click=${() => this.navigate('group-selection')}>
                Torna all’elenco
              </button>
            </div>
          </div>
        </div>
      `;
    }

    if (!this.roomData) {
      return html`
        <div class="container">
          <div class="card">
            <h1>Caricamento stanza…</h1>
            <p class="muted">
              ${this.connectionPeers.length === 0
                ? 'Connessione ai server in corso. Assicurati di essere online e riprova tra qualche secondo.'
                : 'Verifica il link o attendi qualche secondo.'}
            </p>
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
              · Connessioni attive: ${this.connectionPeers.length}
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
        const totalTurns = Math.max(this.totalTurns, 1);
        const currentTurn = Math.min((this.roomData?.currentTurn ?? 0) + 1, totalTurns);
        return `Turno ${currentTurn} di ${totalTurns}`;
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
    const canStart = this.canCurrentPlayerStart();
    const hostInRoom = this.players.some((p) => p.id === this.roomData?.hostId);
    const waitingMessage = this.roomData.onlyHostStarts
      ? hostInRoom
        ? 'Attendi che l’host avvii la partita.'
        : 'In attesa che la persona che ha creato la stanza entri nella lobby per iniziare.'
      : 'Chiunque può avviare la partita quando tuttə sono prontə.';

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
        ${canStart
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
                : html`<p class="muted">Puoi iniziare quando il gruppo è prontə.</p>`}
            `
          : html`<p class="muted">${waitingMessage}</p>`}
      </div>
    `;
  }

  renderGame() {
    const players = this.getPlayersInOrder();
    const playerOrder = this.getPlayerOrder();
    const currentTurn = this.roomData.currentTurn ?? 0;
    const playerIndex = playerOrder.indexOf(this.playerId);
    if (playerIndex < 0) {
      return html`<div class="error">Problema con il tuo accesso. Riprova a entrare.</div>`;
    }
    const sheetIndex = this.computeSheetIndex(playerIndex, currentTurn, playerOrder.length);
    const key = `${currentTurn}_${sheetIndex}`;
    const prompt = this.prompts[currentTurn] || 'Domanda';
    const existingAnswer = this.answers.get(key)?.text;
    const maxWords = this.roomData.maxWords;
    const words = countWords(this.responseText || '');
    const totalTurns = Math.max(this.totalTurns, 1);
    const displayTurn = Math.min(currentTurn + 1, totalTurns);
    const isWaiting = this.waitingTurn || !!existingAnswer;

    return html`
      <div class="grid" style="gap: 2rem;">
        <div class="card">
          <div class="tag">Turno ${displayTurn} di ${totalTurns}</div>
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
                    <button type="submit" ?disabled=${isWaiting}>
                      ${isWaiting ? 'In attesa…' : 'Conferma e passa il foglio'}
                    </button>
                  </div>
                  ${isWaiting
                    ? html`<p class="muted">Risposta salvata. Attendi che tuttə passino il foglio.</p>`
                    : nothing}
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
                    <div class="muted">Foglio corrente: ${
                      this.computeSheetIndex(index, currentTurn, playerOrder.length) + 1
                    }</div>
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
    const lines = this.buildStoryLines(sheetIndex);
    const storyPrompt = lines
      .filter((line) => line.text && line.text !== '—')
      .map((line) => `${line.prompt}: ${line.text}`)
      .join('. ');

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
                  <div class="story-label">${line.prompt}</div>
                  ${revealed
                    ? html`<span>${line.text}</span>`
                    : html`<span class="story-dot">●●●●●</span>`}
                </div>
              `;
            })}
          </div>
          <div class="actions" style="margin-top: 1.5rem;">
            <button
              @click=${() => this.generateStoryImage(storyPrompt || lines.map((l) => l.prompt).join('. '))}
              ?disabled=${this.storyImageLoading}
            >
              ${this.storyImageLoading ? 'Generazione in corso…' : 'Genera immagine con OpenAI'}
            </button>
          </div>
          ${this.storyImageError ? html`<p class="error">${this.storyImageError}</p>` : nothing}
          ${this.storyImageUrl
            ? html`<div class="generated-image"><img src="${this.storyImageUrl}" alt="Illustrazione generata" /></div>`
            : nothing}
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
          ${this.canCurrentPlayerStart()
            ? html`
                <div class="actions" style="margin-top: 1.5rem;">
                  <button @click=${() => this.startGame()}>Nuova partita con lo stesso gruppo</button>
                </div>
              `
            : nothing}
          ${this.isHost
            ? html`
                <div class="actions" style="margin-top: 0.5rem;">
                  <button class="secondary" @click=${() => this.closeRoomForever()}>
                    Chiudi stanza
                  </button>
                </div>
              `
            : nothing}
        </div>
      </div>
    `;
  }
}

customElements.define('sigaretta-app', SigarettaApp);
