import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { DocumentMeta } from "../types";
import { generateId } from "../lib/utils";

export function useDocuments() {
  const [documents, setDocuments] = useState<DocumentMeta[]>([]);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { storageService.getAllDocuments().then((docs) => { setDocuments(docs); setLoaded(true); }); }, []);

  const openDocument = useCallback(async (filePath: string, fileName: string, format: string, size: number) => {
    const id = generateId();
    const doc: DocumentMeta = { id, fileName, filePath, format: format as DocumentMeta["format"], size, openedAt: Date.now(), lastScrollPosition: 0 };
    const existing = documents.find((d) => d.filePath === filePath);
    if (existing) {
      const updated = { ...existing, openedAt: Date.now() };
      await storageService.saveDocument(updated);
      setDocuments((prev) => prev.map((d) => (d.id === existing.id ? updated : d)));
      setActiveDocumentId(existing.id);
      return existing;
    }
    await storageService.saveDocument(doc);
    setDocuments((prev) => [...prev, doc]);
    setActiveDocumentId(id);
    return doc;
  }, [documents]);

  const closeDocument = useCallback(async (id: string) => {
    await storageService.deleteDocument(id);
    setDocuments((prev) => prev.filter((d) => d.id !== id));
    if (activeDocumentId === id) {
      setActiveDocumentId(() => { const remaining = documents.filter((d) => d.id !== id); return remaining.length > 0 ? remaining[remaining.length - 1].id : null; });
    }
    const convs = await storageService.getConversationsByDocument(id);
    for (const conv of convs) await storageService.deleteConversation(conv.id);
  }, [documents, activeDocumentId]);

  // Persist scroll position without triggering React re-render (avoids visual flicker)
  const updateScrollPosition = useCallback(async (id: string, position: number) => {
    const doc = documents.find((d) => d.id === id);
    if (!doc) return;
    const updated = { ...doc, lastScrollPosition: position };
    await storageService.saveDocument(updated);
    // Update state in-place via mutation to avoid new array reference that causes re-render
    doc.lastScrollPosition = position;
  }, [documents]);

  const activeDocument = documents.find((d) => d.id === activeDocumentId) || null;

  return { documents, activeDocument, activeDocumentId, loaded, openDocument, closeDocument, setActiveDocumentId, updateScrollPosition };
}
