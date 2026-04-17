# VEMU Library React Wrapper

This is a safe React migration wrapper for the original VEMU Library frontend.

## Why this approach
- Keeps the original CSS untouched
- Keeps the original script.js logic untouched
- Keeps the same MongoDB/localStorage/server flow
- Lets you run the project inside a React/Vite shell immediately

## Run
```bash
npm install
npm run dev
```

## Notes
- Original pages are inside `public/legacy`
- Shared CSS is inside `public/legacy/css/style.css`
- Shared JS is inside `public/legacy/js/script.js`
- The Express/MongoDB backend is included in `../server`
