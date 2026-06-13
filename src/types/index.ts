// 文档类型
export type DocumentFormat = "txt" | "pdf" | "docx" | "md";

// 文档元信息
export interface DocumentMeta {
  id: string;
  fileName: string;
  filePath: string;
  format: DocumentFormat;
  size: number;
  openedAt: number; // timestamp
  lastScrollPosition: number; // 阅读进度：滚动位置百分比 0-100
}

// 大纲节点
export interface OutlineNode {
  id: string;
  title: string;
  level: number; // 1-based heading level
  children: OutlineNode[];
  anchorId?: string; // HTML 锚点，用于跳转
}

// AI 提供商配置
export interface AIProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  model: string;
}

// 消息角色
export type MessageRole = "user" | "assistant" | "system";

// 上下文引用类型
export type ContextType = "text" | "image";

// 上下文引用
export interface ContextRef {
  id: string;
  type: ContextType;
  content: string; // 文字内容或 base64 图片数据
  label: string; // 显示标签，如截断文字前50字或图片文件名
}

// 单条消息
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  contexts?: ContextRef[]; // 引用上下文
  timestamp: number;
  error?: string; // API 错误信息
}

// 对话会话
export interface Conversation {
  id: string;
  documentId: string; // 绑定文档 ID（可为空表示独立会话）
  title: string; // 会话标题
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

// 应用设置
export interface AppSettings {
  providers: AIProvider[];
  activeProviderId: string | null;
  theme: "light" | "dark" | "system";
  fontSize: number; // 阅读区字号，默认 16
}

// 应用全局状态
export interface AppState {
  documents: DocumentMeta[];
  activeDocumentId: string | null;
  conversations: Conversation[];
  settings: AppSettings;
}
