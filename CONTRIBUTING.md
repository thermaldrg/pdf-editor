# Contributing

Thanks for taking the time to contribute! This document covers the basics for
getting the project running locally and the conventions used throughout the
codebase.

## Getting set up

```bash
bun install
bun run dev          # web app on http://localhost:5173
bun run dev:electron # web + desktop with HMR
```

Before opening a pull request:

```bash
bun run lint
bun run build
```

Both must pass. The CI workflow runs them on every PR.

## Project conventions

The codebase is small and deliberately uniform. Please match the existing
style.

### TypeScript

- Strict mode is on. Declare parameter and return types on every public
  function.
- Avoid `any`. Reach for `unknown` + a type guard if you genuinely don't know
  the shape.
- One export per file.
- Encapsulate multi-parameter inputs/outputs in objects (RO-RO).
- Prefer `readonly` arrays / fields for data that does not change.

### Nomenclature

- `kebab-case` file and directory names.
- `PascalCase` for React components and types.
- `camelCase` for variables, functions, and methods.
- `UPPER_SNAKE_CASE` for module-level constants.
- Boolean variables and functions read as predicates: `isLoading`, `hasError`,
  `canExport`.
- Verbs for functions: `loadPdf`, `stampAnnotation`, `executeMerge`.

### React

- Functional components only; no class components.
- Keep components focused — extract handlers into named functions when they
  grow past a couple of statements.
- Prefer `useCallback` / `useMemo` where stability matters for memoized
  children, not as a reflex.
- Annotations and any page-space data must use **normalized fractions**
  (`x`, `y`, `width`, `height` in `[0, 1]`). Never store pixels or PDF points
  in component state.

### Comments

- Comment intent, trade-offs, and constraints — not what the code does.
- No emojis in code or logs.

### Commits

Short, imperative subject lines. Optional body for context. Examples:

```
Add AES-256 password protection on export
Fix signature aspect ratio on rotated pages
Refactor page-operations hook to use a reducer
```

## Areas that need help

- **Cross-platform desktop builds.** `electron-builder` is wired for macOS
  only. Adding Linux (`AppImage`, `deb`) and Windows (`nsis`) targets is a
  good first PR.
- **Tests.** There are no tests yet. `src/lib/export-pdf-geometry.ts` and
  `src/lib/compress-pdf.ts` are the highest-value places to start.
- **Keyboard shortcuts** for toolbar tools (`T` for text, `S` for signature,
  etc.).
- **i18n** — strings are currently inline.
- **Accessibility audit** of the modal dialogs and toolbar.

## Reporting bugs and proposing features

Use the issue templates under
[`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/). Please include:

- The OS and runtime (browser + version, or macOS + Electron build).
- A minimal PDF that reproduces the issue when relevant (please redact
  anything sensitive — remember, your PDF never leaves your machine through
  this app, but it does leave your machine when you upload it to a bug
  report).

## License

By contributing, you agree that your contributions will be licensed under the
MIT license that covers the project. See [`LICENSE`](LICENSE).
