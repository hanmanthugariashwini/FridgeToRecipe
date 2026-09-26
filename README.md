# Fridge → Recipe

React + Express + Gemini internship assignment.

## Run

1. Open this folder in VS Code.
2. Open a terminal.
3. Run:

```bash
npm install
```

4. Create `.env` in the project root.

Copy the format from `.env.example`:

```env
GEMINI_API_KEY=YOUR_NEW_KEY
PORT=5000
```

5. Run:

```bash
npm start
```

6. Open:

```text
http://localhost:5173
```

## Features

- Free-form ingredient input
- Real Gemini API
- Backend-only API key
- Structured JSON recipe
- Server-side validation
- Loading/error/empty states
- Stale-request protection
- Abort previous request
- Serving scaling
- Interactive cooking checklist
- Ingredient swaps
- Responsive mobile UI

## AI usage

AI tools were used for scaffolding, debugging support, UI ideas, and documentation. The implementation should be understood and reviewed by the author before submission.

## Known limitations

Recipe quality depends on the model. Nutrition/allergen verification is not included. Authentication, saved sessions, streaming, and refinement are not included in this core version.

## Interview points

The important design choice is that the model response is treated as untrusted data. The backend parses and validates the JSON before React renders it. React never displays raw model text as a chatbot.

The API key is stored in `.env` and used only by the Express backend. It is not placed in the browser bundle.

Every request gets a request ID, and an older request is aborted. A response is applied only when it belongs to the latest request, preventing stale AI results from overwriting newer results.

