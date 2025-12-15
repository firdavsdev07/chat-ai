import { InputProps } from '@/lib/types';

export default function Input({ input, onChange, onSubmit, disabled }: InputProps) {
  return (
    <form onSubmit={onSubmit} className="border-t border-gray-200 bg-white p-4">
      <div className="max-w-4xl mx-auto flex gap-2">
        <input
          className="flex-1 border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 text-base placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          value={input}
          onChange={onChange}
          placeholder="Xabar yozing..."
          disabled={disabled}
        />
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          disabled={disabled || !input.trim()}
        >
          Yuborish
        </button>
      </div>
    </form>
  );
}
