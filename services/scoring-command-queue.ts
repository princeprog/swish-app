import type { ScoringCommandPayload } from "@/services/scoring.service";

export type QueuedScoringCommand = {
  command: ScoringCommandPayload;
  gameId: string;
  organizationId: string;
  queuedAt: number;
};

const DATABASE_NAME = "swish-scorekeeper";
const DATABASE_VERSION = 1;
const STORE_NAME = "queued-scoring-commands";

function canUseIndexedDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openQueueDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!canUseIndexedDb()) {
      reject(new Error("IndexedDB is not available"));
      return;
    }

    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, {
          keyPath: ["organizationId", "gameId", "command.idempotencyKey"],
        });
      }
    };
  });
}

async function runQueueTransaction<T>(
  mode: IDBTransactionMode,
  action: (store: IDBObjectStore) => IDBRequest<T> | void,
): Promise<T | undefined> {
  const db = await openQueueDatabase();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, mode);
    const store = transaction.objectStore(STORE_NAME);
    const request = action(store);
    let result: T | undefined;

    if (request) {
      request.onsuccess = () => {
        result = request.result;
      };
      request.onerror = () => reject(request.error);
    }

    transaction.oncomplete = () => {
      db.close();
      resolve(result);
    };
    transaction.onerror = () => {
      db.close();
      reject(transaction.error);
    };
  });
}

export const scoringCommandQueue = {
  async add(command: QueuedScoringCommand) {
    await runQueueTransaction("readwrite", (store) => store.put(command));
  },
  async clear(organizationId: string, gameId: string) {
    const commands = await this.list(organizationId, gameId);

    await Promise.all(
      commands.map((item) =>
        this.remove(
          item.organizationId,
          item.gameId,
          item.command.idempotencyKey,
        ),
      ),
    );
  },
  async list(
    organizationId: string,
    gameId: string,
  ): Promise<QueuedScoringCommand[]> {
    if (!canUseIndexedDb()) {
      return [];
    }

    const allCommands =
      (await runQueueTransaction<QueuedScoringCommand[]>("readonly", (store) =>
        store.getAll(),
      )) ?? [];

    return allCommands
      .filter(
        (item) =>
          item.organizationId === organizationId && item.gameId === gameId,
      )
      .sort((a, b) => a.queuedAt - b.queuedAt);
  },
  async remove(
    organizationId: string,
    gameId: string,
    idempotencyKey: string,
  ) {
    await runQueueTransaction("readwrite", (store) =>
      store.delete([organizationId, gameId, idempotencyKey]),
    );
  },
};
