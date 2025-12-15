export interface Thread {
  id: number;
  title: string;
  created_at: string;
}

export interface Message {
  id: number;
  thread_id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export interface ThreadsProps {
  threads: Thread[];
  threadId: number | null;
  loading: boolean;
  onNew: () => void;
  onSelect: (id: number) => void;
}

export interface ChatProps {
  messages: Message[];
  loading: boolean;
}

export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled: boolean;
}
