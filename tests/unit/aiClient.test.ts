import { describe, it, expect, vi, beforeEach } from "vitest";
import { AIClient } from "../../src/services/aiClient";
import type { AIProvider, Message, ContextRef } from "../../src/types";

describe("AIClient", () => {
  let client: AIClient;
  const provider: AIProvider = {
    id: "p1", name: "Test", baseUrl: "https://api.test.com/v1", apiKey: "sk-test-key", model: "test-model",
  };

  beforeEach(() => { client = new AIClient(provider); vi.restoreAllMocks(); });

  it("should construct chat completion request correctly", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { role: "assistant", content: "Hello back!" } }] }),
    });
    global.fetch = mockFetch as any;

    const messages: Message[] = [{ id: "1", role: "user", content: "What is ML?", timestamp: Date.now() }];
    const response = await client.chat(messages);

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.test.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ "Content-Type": "application/json", Authorization: "Bearer sk-test-key" }),
      }),
    );
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.model).toBe("test-model");
    expect(body.messages[0].role).toBe("user");
    expect(response).toBe("Hello back!");
  });

  it("should include image contexts in vision request", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { role: "assistant", content: "I see an image" } }] }),
    });
    global.fetch = mockFetch as any;

    const contexts: ContextRef[] = [{ id: "c1", type: "image", content: "data:image/png;base64,abc123", label: "screenshot.png" }];
    await client.chatWithContext("What's in this image?", contexts);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const userContent = body.messages[0].content;
    expect(Array.isArray(userContent)).toBe(true);
    expect(userContent[0].type).toBe("image_url");
  });

  it("should throw on API error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false, status: 401,
      json: () => Promise.resolve({ error: { message: "Unauthorized" } }),
    });
    global.fetch = mockFetch as any;

    await expect(client.chat([{ id: "1", role: "user", content: "Hi", timestamp: Date.now() }])).rejects.toThrow("Unauthorized");
  });
});
