export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  toolInvocations?: Array<{
    toolName: string;
    args?: unknown;
    result?: unknown;
  }>;
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
