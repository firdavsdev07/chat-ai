export interface ToolInvocation {
  toolCallId: string;
  toolName: string;
  args?: unknown;
  state?: "call" | "partial-call" | "result";
  result?: unknown;
}

export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt?: Date;
  toolInvocations?: ToolInvocation[];
}

export interface Thread {
  id: number;
  title: string;
}

export interface ThreadsProps {
  threads: Thread[];
  activeId: number | null;
  onNew: () => void;
  onSelect: (id: number) => void;
  onHome: () => void;
  onRename: (id: number, newTitle: string) => void;
  onDelete: (id: number) => void;
  isLoading?: boolean;
}

export interface ChatProps {
  messages: Message[];
  isLoading: boolean;
}

export interface InputProps {
  input: string;
  onSubmit: (e: React.FormEvent) => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled: boolean;
}
