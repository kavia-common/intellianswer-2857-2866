# Ocean Professional Q&A Frontend (React)

A modern single-page React application for a Question & Answer platform themed "Ocean Professional" (primary: #2563EB, secondary/success: #F59E0B, error: #EF4444, background: #f9fafb, surface: #ffffff, text: #111827).

## Features
- SPA layout with Sidebar, Top Header, Main Chat/Q&A area, and Session History panel
- Mocked REST API integration (easily replaceable with a real backend)
- Smooth transitions, subtle gradients, rounded corners, and minimalist design
- Accessible: ARIA labels, proper semantics, keyboard shortcuts (⌘/Ctrl+Enter to send)
- Local persistence via localStorage for sessions and mock auth

## Structure
- `src/App.js` Main application shell, mock API layer, and components
- `src/App.css` Theme and component styles
- `src/index.css` Global resets and utilities

## Development
- `npm start` run dev server
- `npm test` run tests
- `npm run build` production build

## Backend Integration
Replace the mocked `ApiClient` in `App.js` with real endpoints:
```js
const res = await fetch(`${process.env.REACT_APP_API_URL}/sessions/${sessionId}/query`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question, user })
});
const data = await res.json();
```
Environment variable required:
- REACT_APP_API_URL

Create `.env` file at the project root (do not commit):
```
REACT_APP_API_URL=https://your-backend.example.com
```

## Notes
- Initial sessions are created automatically
- The "Sign in" is mocked; replace with real auth when available
- The design adheres to the Ocean Professional style guide
