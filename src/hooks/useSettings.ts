import { useState, useEffect, useCallback } from "react";
import { storageService } from "../services/storage";
import type { AppSettings, AIProvider } from "../types";
import { generateId } from "../lib/utils";

const DEFAULT_SETTINGS: AppSettings = { providers: [], activeProviderId: null, theme: "system", fontSize: 16 };

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { storageService.getSettings().then((saved) => { if (saved) setSettings(saved); setLoaded(true); }); }, []);

  const saveSettings = useCallback(async (newSettings: AppSettings) => { await storageService.saveSettings(newSettings); setSettings(newSettings); }, []);

  const addProvider = useCallback(async (provider: Omit<AIProvider, "id">) => {
    const newProvider: AIProvider = { id: generateId(), ...provider };
    const updated = { ...settings, providers: [...settings.providers, newProvider], activeProviderId: settings.activeProviderId || newProvider.id };
    await saveSettings(updated);
  }, [settings, saveSettings]);

  const removeProvider = useCallback(async (id: string) => {
    const updated = { ...settings, providers: settings.providers.filter((p) => p.id !== id), activeProviderId: settings.activeProviderId === id ? settings.providers.find((p) => p.id !== id)?.id || null : settings.activeProviderId };
    await saveSettings(updated);
  }, [settings, saveSettings]);

  const setActiveProvider = useCallback(async (id: string) => { await saveSettings({ ...settings, activeProviderId: id }); }, [settings, saveSettings]);

  const hasApiKey = !!(settings.activeProviderId && settings.providers.find((p) => p.id === settings.activeProviderId)?.apiKey);
  const activeProvider = settings.providers.find((p) => p.id === settings.activeProviderId) || null;

  return { settings, loaded, hasApiKey, activeProvider, addProvider, removeProvider, setActiveProvider, setSettings: saveSettings };
}
