# AI Chat Application

Современное приложение для чата с AI, построенное на Next.js 16, Vercel AI SDK и Bun SQLite.
Интерфейс в стиле ChatGPT с управлением беседами, сохранением сообщений и интеграцией с Excel.

## Возможности

- AI чат с поддержкой потоковых ответов
- Управление несколькими беседами (threads)
- Сохранение всех сообщений в локальной базе данных SQLite
- Интеграция с Excel файлами: чтение, запись, обновление данных
- Система упоминаний ячеек через синтаксис @Sheet!A1
- Визуальный интерфейс для выбора диапазонов в таблицах
- Подтверждение опасных операций через UI диалоги
- Обработка ошибок и таймаутов

## Технологии

- Next.js 16 (App Router)
- TypeScript
- Bun 1.1+
- SQLite (bun:sqlite)
- Vercel AI SDK
- Tailwind CSS
- Lucide React (иконки)
- SheetJS (работа с Excel)

## Установка

### Требования

- Установленный Bun (https://bun.sh)
- API ключ Google AI

### Шаги установки

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd ai-chat-test2
```

2. Установите зависимости:
```bash
bun install
```

3. Создайте файл `.env.local` и добавьте ваш API ключ:
```env
GOOGLE_GENERATIVE_AI_API_KEY=your_api_key_here
```

4. Убедитесь, что файл `data/example.xlsx` существует в корне проекта.

## Запуск

Запустите development сервер:

```bash
bun dev
```

Откройте http://localhost:3000 в браузере.

## Структура проекта

```
src/
├── app/
│   ├── api/             # API маршруты (Chat, Threads, Excel)
│   └── page.tsx         # Главная страница
├── components/          # React компоненты
│   ├── ChatArea.tsx     # Основной чат
│   ├── MentionInput.tsx # Ввод с поддержкой @mentions
│   ├── TableModal.tsx   # Модальное окно с таблицей Excel
│   └── tools/           # Компоненты для инструментов AI
├── hooks/               # Пользовательские хуки
├── lib/
│   ├── db.ts            # Подключение к SQLite
│   ├── excel.ts         # Функции для работы с Excel
│   ├── actions.ts       # Server Actions
│   └── tools.ts         # Определения инструментов (Zod схемы)
```

## Инструменты AI

- confirmAction - запрос подтверждения перед критическими операциями
- listSheets / getRange - чтение данных из Excel
- updateExcelCell - изменение данных в Excel (с подтверждением)
- showTable - визуальное отображение данных в таблице

## Примечания

- Используется встроенная в Bun база данных SQLite, внешняя установка БД не требуется
- Весь код строго типизирован с помощью TypeScript
- Реализована надежная обработка ошибок сети и таймаутов
