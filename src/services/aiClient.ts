import type { AIProvider, Message, ContextRef } from "../types";

type ContentPart = { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } };

interface ChatCompletionMessage {
  role: string;
  content: string | ContentPart[];
}

interface ChatCompletionResponse {
  choices: Array<{ message: { role: string; content: string } }>;
}

export class AIClient {
  private provider: AIProvider;

  constructor(provider: AIProvider) {
    this.provider = provider;
  }

  async chat(messages: Message[]): Promise<string> {
    return this.sendRequest(messages.map((msg) => ({ role: msg.role, content: msg.content })));
  }

  async chatWithContext(userMessage: string, contexts: ContextRef[]): Promise<string> {
    const hasImages = contexts.some((c) => c.type === "image");

    if (!hasImages) {
      const contextText = contexts.filter((c) => c.type === "text").map((c) => `> ${c.content}`).join("\n\n");
      const fullMessage = contextText ? `以下是我引用的内容：\n\n${contextText}\n\n我的问题是：${userMessage}` : userMessage;
      return this.sendRequest([{ role: "user", content: fullMessage }]);
    }

    const parts: ContentPart[] = [];
    for (const ctx of contexts) {
      if (ctx.type === "image") {
        parts.push({ type: "image_url", image_url: { url: ctx.content } });
      }
    }
    parts.push({ type: "text", text: userMessage });
    for (const ctx of contexts) {
      if (ctx.type === "text") {
        const textPart = parts.find((p) => p.type === "text");
        if (textPart) textPart.text = `引用的文字：\n> ${ctx.content}\n\n${textPart.text}`;
      }
    }
    return this.sendRequest([{ role: "user", content: parts }]);
  }

  async translate(text: string): Promise<string> {
    return this.sendRequest([{ role: "user", content: `请将以下文字翻译成中文，只输出翻译结果不要额外解释：\n\n${text}` }]);
  }

  async summarize(text: string): Promise<string> {
    return this.sendRequest([{ role: "user", content: `请用一段话总结以下内容的核心要点：\n\n${text}` }]);
  }

  async explain(text: string): Promise<string> {
    return this.sendRequest([{ role: "user", content: `请用通俗易懂的语言解释以下内容，像给初学者讲解一样：\n\n${text}` }]);
  }

  private async sendRequest(messages: ChatCompletionMessage[]): Promise<string> {
    const url = `${this.provider.baseUrl.replace(/\/$/, "")}/chat/completions`;
    const body = { model: this.provider.model, messages, max_tokens: 4096, temperature: 0.7 };

    // Try Tauri proxy first (protects API key)
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const data = await invoke<{ choices: Array<{ message: { role: string; content: string } }> }>(
        "proxy_ai_request",
        { url, apiKey: this.provider.apiKey, body }
      );
      return data.choices[0]?.message?.content || "";
    } catch {
      // Fallback: direct fetch (development/non-Tauri environments)
    }

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.provider.apiKey}` },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { message: `HTTP ${response.status}` } }));
      throw new Error(error.error?.message || `API request failed: ${response.status}`);
    }

    const data: ChatCompletionResponse = await response.json();
    return data.choices[0]?.message?.content || "";
  }
}
