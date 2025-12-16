"use client";

import { MessageSquare, AlertCircle } from "lucide-react";

export default function EmptyState({ icon: Icon = MessageSquare, title, description, variant = "default" }: any) {
  const configs = {
    default: { icon: MessageSquare, title: "Ma'lumot yo'q", description: "Hozircha hech qanday ma'lumot topilmadi" },
    error: { icon: AlertCircle, title: "Xatolik", description: "Ma'lumotlarni yuklashda xatolik yuz berdi" },
    chat: { icon: MessageSquare, title: "Xabar yo'q", description: "Birinchi xabaringizni yozing" },
  };
  const config = configs[variant as keyof typeof configs] || configs.default;
  const ActiveIcon = Icon || config.icon;

  return (
    <div className="flex flex-col items-center justify-center text-center p-10 animate-in fade-in zoom-in-95 duration-500">
      <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
        <ActiveIcon className="w-8 h-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-bold text-slate-900">{title || config.title}</h3>
      <p className="mt-2 text-sm text-slate-500 max-w-sm leading-relaxed">{description || config.description}</p>
    </div>
  );
}
