"use client";

import { Inbox, MessageSquare, Table } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type EmptyStateVariant = "chat" | "threads" | "table" | "default";

interface EmptyStateProps {
  variant?: EmptyStateVariant;
  title?: string;
  description?: string;
  icon?: LucideIcon;
}

const variants: Record<EmptyStateVariant, { icon: LucideIcon; title: string; description: string }> = {
  chat: { icon: MessageSquare, title: "Xabar yo'q", description: "Birinchi xabaringizni yozing" },
  threads: { icon: Inbox, title: "Chat yo'q", description: "Yangi chat yarating" },
  table: { icon: Table, title: "Ma'lumot yo'q", description: "Jadval bo'sh" },
  default: { icon: Inbox, title: "Bo'sh", description: "Ma'lumot topilmadi" },
};

export default function EmptyState({ variant = "default", title, description, icon: CustomIcon }: EmptyStateProps) {
  const config = variants[variant];
  const Icon = CustomIcon || config.icon;

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-medium text-slate-700">{title || config.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{description || config.description}</p>
    </div>
  );
}
