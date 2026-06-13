import { useState } from "react";
import { useAppContext } from "../contexts/AppContext";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const { settings, addProvider, removeProvider, setActiveProvider, setSettings } = useAppContext();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [showForm, setShowForm] = useState(false);

  if (!open) return null;

  const handleAddProvider = async () => {
    if (!name || !baseUrl || !apiKey || !model) return;
    await addProvider({ name, baseUrl, apiKey, model });
    setName(""); setBaseUrl(""); setApiKey(""); setModel(""); setShowForm(false);
  };

  const commonPresets = [
    { name: "Claude (Anthropic)", baseUrl: "https://api.anthropic.com/v1", model: "claude-sonnet-4-6" },
    { name: "DeepSeek", baseUrl: "https://api.deepseek.com/v1", model: "deepseek-chat" },
    { name: "OpenAI", baseUrl: "https://api.openai.com/v1", model: "gpt-4o" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-[500px] max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">⚙️ 设置</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-lg">✕</button>
        </div>

        <div className="p-4 space-y-4">
          {/* AI 提供商 */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">AI 服务</h4>
              <button onClick={() => setShowForm(true)} className="text-xs text-blue-500 hover:text-blue-600">+ 添加</button>
            </div>

            {settings.providers.length === 0 ? (
              <div className="text-xs text-gray-400 py-4 text-center">尚未配置 AI 服务，点击"+ 添加"或选择下方预设</div>
            ) : (
              <div className="space-y-2">
                {settings.providers.map((p) => (
                  <div key={p.id}
                    className={`flex items-center justify-between p-2 rounded-md border cursor-pointer transition-colors ${settings.activeProviderId === p.id ? "border-blue-400 bg-blue-50 dark:bg-blue-900/30" : "border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"}`}
                    onClick={() => setActiveProvider(p.id)}>
                    <div>
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{p.name}</div>
                      <div className="text-[10px] text-gray-400">{p.model} · {p.baseUrl}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {settings.activeProviderId === p.id && <span className="text-[10px] text-green-500">✓ 当前</span>}
                      <button onClick={(e) => { e.stopPropagation(); removeProvider(p.id); }} className="text-xs text-red-400 hover:text-red-600">删除</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 添加表单 */}
            {showForm && (
              <div className="mt-3 p-3 border border-gray-200 dark:border-gray-600 rounded-md space-y-2.5">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="显示名称（如 Claude）" className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="Base URL（如 https://api.anthropic.com/v1）" className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="API Key" className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="text" value={model} onChange={(e) => setModel(e.target.value)} placeholder="模型名称（如 claude-sonnet-4-6）" className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2">
                  <button onClick={handleAddProvider} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">保存</button>
                  <button onClick={() => setShowForm(false)} className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">取消</button>
                </div>
              </div>
            )}

            {/* 预设 */}
            {!showForm && (
              <div className="mt-2">
                <div className="text-[10px] text-gray-400 mb-1.5">快速预设：</div>
                <div className="flex flex-wrap gap-1.5">
                  {commonPresets.map((preset) => (
                    <button key={preset.name} onClick={() => { setName(preset.name); setBaseUrl(preset.baseUrl); setModel(preset.model); setShowForm(true); }} className="text-[10px] px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 阅读设置 */}
          <div>
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">阅读设置</h4>
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600 dark:text-gray-400">字号</span>
              <select value={settings.fontSize} onChange={(e) => setSettings({ ...settings, fontSize: Number(e.target.value) })} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500">
                {[12, 14, 16, 18, 20, 24].map((size) => (<option key={size} value={size}>{size}px</option>))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
