# To Do List

A single-board Kanban project manager. Client-rendered Next.js, in-memory state, dark elegant UI.

## Features

- One board, five renameable columns
- Cards with title, details, and an optional due date, edited inline
- Add and delete cards
- Drag and drop cards within and across columns
- Calendar view: a second view of the same tasks, placed on their due dates
- Dummy data loaded on start (no persistence)

## Stack

Next.js, React, TypeScript, Tailwind CSS, Pragmatic drag-and-drop. Jest and React Testing Library for unit tests, Playwright for end-to-end tests.

## Develop

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Test

```bash
npm test         # Jest unit and component tests
npm run test:e2e # Playwright integration tests
npm run build    # production build
```
