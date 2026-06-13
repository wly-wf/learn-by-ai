import { describe, it, expect, beforeEach } from "vitest";
import { StorageService } from "../../src/services/storage";
import type { DocumentMeta, Conversation, AppSettings } from "../../src/types";
import "fake-indexeddb/auto";

describe("StorageService", () => {
  let storage: StorageService;
  let dbCounter = 0;

  beforeEach(() => {
    storage = new StorageService(`learn-by-ai-test-${++dbCounter}`);
  });

  describe("Document operations", () => {
    it("should save and retrieve a document", async () => {
      const doc: DocumentMeta = {
        id: "doc-1",
        fileName: "test.pdf",
        filePath: "/path/to/test.pdf",
        format: "pdf",
        size: 1024,
        openedAt: Date.now(),
        lastScrollPosition: 0,
      };

      await storage.saveDocument(doc);
      const docs = await storage.getAllDocuments();
      expect(docs).toHaveLength(1);
      expect(docs[0].fileName).toBe("test.pdf");
    });

    it("should update an existing document", async () => {
      const doc: DocumentMeta = {
        id: "doc-1",
        fileName: "test.pdf",
        filePath: "/path/to/test.pdf",
        format: "pdf",
        size: 1024,
        openedAt: Date.now(),
        lastScrollPosition: 0,
      };

      await storage.saveDocument(doc);
      const updated = { ...doc, lastScrollPosition: 50 };
      await storage.saveDocument(updated);
      const docs = await storage.getAllDocuments();
      expect(docs[0].lastScrollPosition).toBe(50);
    });

    it("should return empty array when no documents", async () => {
      const docs = await storage.getAllDocuments();
      expect(docs).toEqual([]);
    });
  });

  describe("Conversation operations", () => {
    it("should save and retrieve conversations by documentId", async () => {
      const conv: Conversation = {
        id: "conv-1",
        documentId: "doc-1",
        title: "Test Chat",
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await storage.saveConversation(conv);
      const convs = await storage.getConversationsByDocument("doc-1");
      expect(convs).toHaveLength(1);
      expect(convs[0].title).toBe("Test Chat");
    });

    it("should return empty for unknown document", async () => {
      const convs = await storage.getConversationsByDocument("no-such-doc");
      expect(convs).toEqual([]);
    });
  });

  describe("Settings operations", () => {
    it("should save and retrieve settings", async () => {
      const settings: AppSettings = {
        providers: [],
        activeProviderId: null,
        theme: "light",
        fontSize: 16,
      };

      await storage.saveSettings(settings);
      const loaded = await storage.getSettings();
      expect(loaded?.theme).toBe("light");
      expect(loaded?.fontSize).toBe(16);
    });

    it("should return null when no settings saved", async () => {
      const settings = await storage.getSettings();
      expect(settings).toBeNull();
    });
  });
});
