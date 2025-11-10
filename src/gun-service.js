import { PROMPTS } from './prompts.js';
import { slugify } from './utils.js';

const GUN_PEERS = [
  'https://relay.peer.ooo/gun',
  'https://gun-manhattan-1.herokuapp.com/gun',
  'https://gunjs.herokuapp.com/gun',
  'https://gun-manhattan.herokuapp.com/gun',
  'https://gun-eu.herokuapp.com/gun',
  'https://gun-asia.herokuapp.com/gun',
];

function safeParse(json) {
  if (!json) return undefined;
  try {
    return JSON.parse(json);
  } catch (error) {
    console.warn('Errore nel parsing JSON da Gun', error, json);
    return undefined;
  }
}

function cleanNode(data) {
  if (!data || typeof data !== 'object') return data;
  const copy = { ...data };
  delete copy._;
  return copy;
}

class GunRoomService {
  constructor() {
    if (!window.Gun) {
      throw new Error('Gun non disponibile');
    }
    const shuffledPeers = [...GUN_PEERS].sort(() => Math.random() - 0.5);
    this.gun = window.Gun({ peers: shuffledPeers });
    this.roomsNode = this.gun.get('sigaretta_rooms');
    this.indexNode = this.gun.get('sigaretta_rooms_index');
    this.connectedPeers = new Set();
    this.connectionCallbacks = new Set();

    this.gun.on('hi', (peer) => {
      const url = peer?.url || peer;
      if (url) {
        this.connectedPeers.add(url);
        this.emitConnection();
      }
    });

    this.gun.on('bye', (peer) => {
      const url = peer?.url || peer;
      if (url) {
        this.connectedPeers.delete(url);
        this.emitConnection();
      }
    });
  }

  emitConnection() {
    const snapshot = {
      peers: Array.from(this.connectedPeers),
    };
    this.connectionCallbacks.forEach((cb) => {
      try {
        cb(snapshot);
      } catch (error) {
        console.error('Errore nel callback di connessione', error);
      }
    });
  }

  onConnection(callback) {
    this.connectionCallbacks.add(callback);
    callback({ peers: Array.from(this.connectedPeers) });
    return () => {
      this.connectionCallbacks.delete(callback);
    };
  }

  watchRoomsIndex(callback) {
    const rooms = new Map();
    const handler = this.indexNode.map().on((data, key) => {
      if (!data) {
        rooms.delete(key);
      } else {
        rooms.set(key, cleanNode(data));
      }
      callback(Array.from(rooms.values()).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)));
    });
    return () => handler.off();
  }

  createRoom({ groupName, maxPlayers, maxWords, onlyHostStarts, hostId }) {
    return new Promise((resolve, reject) => {
      const slug = slugify(groupName);
      if (!slug) {
        reject(new Error('Inserisci un nome di gruppo valido.'));
        return;
      }
      this.indexNode.get(slug).once((existing) => {
        if (existing) {
          reject(new Error('Esiste già una stanza con questo nome.'));
          return;
        }
        const roomId = slug;
        const now = Date.now();
        const roomData = {
          id: roomId,
          groupName,
          slug,
          maxPlayers: Number(maxPlayers) || 8,
          maxWords: Number(maxWords) || 12,
          status: 'lobby',
          currentTurn: 0,
          createdAt: now,
          prompts: JSON.stringify(PROMPTS),
          hostId: hostId || null,
          onlyHostStarts: typeof onlyHostStarts === 'boolean' ? onlyHostStarts : true,
        };
        this.roomsNode.get(roomId).put(roomData, (ack) => {
          if (ack.err) {
            reject(new Error(ack.err));
            return;
          }
          this.indexNode
            .get(slug)
            .put({ id: roomId, groupName, createdAt: now })
            .once(() => resolve({ roomId }));
        });
      });
    });
  }

  subscribeToRoom(roomId, handlers) {
    const roomNode = this.roomsNode.get(roomId);
    const players = new Map();
    const answers = new Map();
    const turnStatus = new Map();
    const assignments = new Map();

    const roomHandler = roomNode.on((data) => {
      handlers?.onRoom?.(cleanNode(data));
    });

    const playersHandler = roomNode
      .get('players')
      .map()
      .on((data, key) => {
        if (!data) {
          players.delete(key);
        } else {
          players.set(key, { id: key, ...cleanNode(data) });
        }
        handlers?.onPlayers?.(Array.from(players.values()).sort((a, b) => (a.joinedAt || 0) - (b.joinedAt || 0)));
      });

    const answersHandler = roomNode
      .get('answers')
      .map()
      .on((data, key) => {
        if (!data) {
          answers.delete(key);
        } else {
          const parsed = typeof data === 'string' ? safeParse(data) : data;
          answers.set(key, parsed);
        }
        handlers?.onAnswers?.(new Map(answers));
      });

    const statusHandler = roomNode
      .get('turnStatus')
      .map()
      .on((data, key) => {
        if (!data) {
          turnStatus.delete(key);
        } else {
          turnStatus.set(key, cleanNode(data));
        }
        handlers?.onTurnStatus?.(new Map(turnStatus));
      });

    const assignmentsHandler = roomNode
      .get('finalAssignments')
      .map()
      .on((data, key) => {
        if (!data) {
          assignments.delete(key);
        } else {
          assignments.set(key, cleanNode(data));
        }
        handlers?.onAssignments?.(new Map(assignments));
      });

    return () => {
      roomHandler.off();
      playersHandler.off();
      answersHandler.off();
      statusHandler.off();
      assignmentsHandler.off();
    };
  }

  ensurePlayer(roomId, playerId, payload) {
    const roomNode = this.roomsNode.get(roomId);
    return new Promise((resolve) => {
      roomNode
        .get('players')
        .get(playerId)
        .put(payload, () => resolve());
    });
  }

  updateRoom(roomId, patch) {
    this.roomsNode.get(roomId).put(patch);
  }

  writeAnswer(roomId, key, value) {
    const toStore = typeof value === 'string' ? value : JSON.stringify(value);
    this.roomsNode.get(roomId).get('answers').get(key).put(toStore);
  }

  setTurnStatus(roomId, key, value) {
    this.roomsNode.get(roomId).get('turnStatus').get(key).put(value);
  }

  clearTurnStatus(roomId, prefix) {
    const roomNode = this.roomsNode.get(roomId);
    roomNode
      .get('turnStatus')
      .map()
      .once((data, key) => {
        if (key.startsWith(prefix)) {
          roomNode.get('turnStatus').get(key).put(null);
        }
      });
  }

  setAssignments(roomId, assignmentsMap) {
    const node = this.roomsNode.get(roomId).get('finalAssignments');
    assignmentsMap.forEach((value, key) => {
      node.get(key).put(value);
    });
  }

  removePlayer(roomId, playerId) {
    this.roomsNode.get(roomId).get('players').get(playerId).put(null);
  }

  clearCollection(roomId, key) {
    const node = this.roomsNode.get(roomId).get(key);
    node
      .map()
      .once((data, itemKey) => {
        node.get(itemKey).put(null);
      });
  }
}

export const gunService = new GunRoomService();
