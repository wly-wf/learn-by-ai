import { openDB, type IDBPDatabase } from "idb";
import type {
  DocumentMeta,
  Conversation,
  AppSettings,
} from "../types";

const DB_VERSION = 1;

export class StorageService {
  private dbName: string;
  private dbPromise: Promise<IDBPDatabase> | null = null;

  constructor(dbName: string = "learn-by-ai") {
    this.dbName = dbName;
  }

  private async getDB(): Promise<IDBPDatabase> {
    if (!this.dbPromise) {
      this.dbPromise = openDB(this.dbName, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains("documents")) {
            db.createObjectStore("documents", { keyPath: "id" });
          }
          if (!db.objectStoreNames.contains("conversations")) {
            const store = db.createObjectStore("conversations", {
              keyPath: "id",
            });
            store.createIndex("documentId", "documentId", {
              unique: false,
            });
          }
          if (!db.objectStoreNames.contains("settings")) {
            db.createObjectStore("settings", { keyPath: "id" });
          }
        },
      }).catch((err) => {
        this.dbPromise = null;
        throw new Error(`Failed to open database "${this.dbName}": ${err.message}`);
      });
    }
    return this.dbPromise;
  }

  // --- Document operations ---

  async saveDocument(doc: DocumentMeta): Promise<void> {
    const db = await this.getDB();
    await db.put("documents", doc);
  }

  async getAllDocuments(): Promise<DocumentMeta[]> {
    const db = await this.getDB();
    const docs = await db.getAll("documents");
    return docs.sort((a, b) => b.openedAt - a.openedAt);
  }

  async getDocument(id: string): Promise<DocumentMeta | undefined> {
    const db = await this.getDB();
    return db.get("documents", id);
  }

  async deleteDocument(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete("documents", id);
  }

  // --- Conversation operations ---

  async saveConversation(conv: Conversation): Promise<void> {
    const db = await this.getDB();
    await db.put("conversations", { ...conv, updatedAt: Date.now() });
  }

  async getConversationsByDocument(
    documentId: string,
  ): Promise<Conversation[]> {
    try {
      const db = await this.getDB();
      const tx = db.transaction("conversations");
      const index = tx.store.index("documentId");
      const convs = await index.getAll(documentId);
      await tx.done;
      return convs.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (err) {
      throw new Error(
        `Failed to get conversations for document "${documentId}": ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  async deleteConversation(id: string): Promise<void> {
    const db = await this.getDB();
    await db.delete("conversations", id);
  }

  // --- Settings operations ---

  async saveSettings(settings: AppSettings): Promise<void> {
    const db = await this.getDB();
    await db.put("settings", { id: "app-settings", ...settings });
  }

  async getSettings(): Promise<AppSettings | null> {
    const db = await this.getDB();
    const record = await db.get("settings", "app-settings");
    if (!record) return null;
    const { id, ...settings } = record;
    return settings as AppSettings;
  }
}

export const storageService = new StorageService();
