import type { AiExamGeneratorInput, Question } from "./types";

const STORAGE_KEY = "teacher:create-exam-dialog-payload";

export type PendingCreateExamDraft =
  | {
      mode: "manual";
      examTitle: string;
      questions: PendingQuestionDraft[];
    }
  | {
      mode: "ai";
      input: AiExamGeneratorInput;
    }
  | {
      mode: "pdf";
      examTitle: string;
      importMcqCount: number;
      importTextCount?: number;
      importOpenCount: number;
      fileId: string;
    };

export type PendingQuestionDraft = Omit<Question, "id">;

type StoredPendingFile = {
  id: string;
  name: string;
  type: string;
  lastModified: number;
  bytes: ArrayBuffer;
};

const DB_NAME = "teacher-create-exam-dialog";
const DB_VERSION = 1;
const FILE_STORE = "pending-files";

const createId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const openPendingFileDb = (): Promise<IDBDatabase> => {
  if (typeof window === "undefined" || !window.indexedDB) {
    return Promise.reject(new Error("IndexedDB unavailable"));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(FILE_STORE)) {
        db.createObjectStore(FILE_STORE, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error ?? new Error("IndexedDB error"));
    request.onsuccess = () => resolve(request.result);
  });
};

const withPendingFileStore = async <T,>(
  action: (store: IDBObjectStore) => T | Promise<T>,
) => {
  const db = await openPendingFileDb();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      const store = tx.objectStore(FILE_STORE);
      Promise.resolve(action(store))
        .then((result) => {
          tx.oncomplete = () => resolve(result);
          tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction error"));
          tx.onabort = () => reject(tx.error ?? new Error("IndexedDB transaction aborted"));
        })
        .catch(reject);
    });
  } finally {
    db.close();
  }
};

export const savePendingCreateExamFile = async (file: File) => {
  const id = createId();
  const bytes = await file.arrayBuffer();
  const record: StoredPendingFile = {
    id,
    name: file.name,
    type: file.type,
    lastModified: file.lastModified,
    bytes,
  };

  await withPendingFileStore((store) => store.put(record));
  return id;
};

export const consumePendingCreateExamFile = async (fileId: string) => {
  const db = await openPendingFileDb();
  try {
    return await new Promise<File | null>((resolve, reject) => {
      const tx = db.transaction(FILE_STORE, "readwrite");
      const store = tx.objectStore(FILE_STORE);
      const getRequest = store.get(fileId);

      getRequest.onerror = () =>
        reject(getRequest.error ?? new Error("IndexedDB read error"));

      getRequest.onsuccess = () => {
        const record = getRequest.result as StoredPendingFile | undefined;
        if (!record) {
          resolve(null);
          return;
        }

        store.delete(fileId);
        resolve(
          new File([record.bytes], record.name, {
            type: record.type,
            lastModified: record.lastModified,
          }),
        );
      };

      tx.onerror = () => reject(tx.error ?? new Error("IndexedDB transaction error"));
    });
  } finally {
    db.close();
  }
};

export const savePendingCreateExamDraft = (
  payload: PendingCreateExamDraft,
) => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
};

export const consumePendingCreateExamDraft =
  (): PendingCreateExamDraft | null => {
    if (typeof window === "undefined") return null;
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    window.sessionStorage.removeItem(STORAGE_KEY);
    try {
      return JSON.parse(raw) as PendingCreateExamDraft;
    } catch {
      return null;
    }
  };
