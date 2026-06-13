import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { AIPanel } from "../../src/components/AIPanel";
import type { Conversation } from "../../src/types";

const mockConversation: Conversation = {
  id: "conv-1", documentId: "doc-1", title: "Test",
  messages: [{ id: "msg-1", role: "user", content: "什么是机器学习？", timestamp: Date.now() }],
  createdAt: Date.now(), updatedAt: Date.now(),
};

describe("AIPanel", () => {
  it("should show API key prompt when no key configured", () => {
    render(<AIPanel conversation={mockConversation} hasApiKey={false} onSendMessage={vi.fn()} onNewConversation={vi.fn()} />);
    expect(screen.getByText(/请先在设置中配置 AI 服务/)).toBeInTheDocument();
  });

  it("should show messages when API key is configured", () => {
    render(<AIPanel conversation={mockConversation} hasApiKey={true} onSendMessage={vi.fn()} onNewConversation={vi.fn()} />);
    expect(screen.getByText("什么是机器学习？")).toBeInTheDocument();
  });
});
