# PDF Editor

A fast, private, **fully client-side** PDF editor. Open a PDF, sign it, annotate it,
re-order pages, merge, compress, password-protect, and export — all without your
file ever leaving the machine.

Ships as both a **web app** and a native **macOS desktop app** (Electron).

> No upload. No server. No telemetry. Your PDF is parsed and edited entirely in
> your browser (or in a sandboxed Electron renderer).

---

## Features

### Editing

- Add and edit **text** boxes with adjustable size and color
- Stamp the current **date** with one click
- Draw a **signature** in a canvas pad, or reuse a previously saved one
- Drop **shapes**: tick, cross, dash (great for forms)
- **Drag, resize, and delete** any annotation
- **Zoom** in and out with a clear page-fit reset

### Page operations

- Sidebar with **page thumbnails**
- **Rotate**, **delete**, and **reorder** pages
- Annotations follow their page when it rotates or moves
- Rotation, deletion, and reorder are baked into the exported PDF

### Document tools

- **Merge** multiple PDFs into one, in any order
- **Compress** a PDF at three quality levels (Light / Balanced / Strong) by
  re-rendering each page as JPEG
- **Password-protect** the output with AES-256 (via `@libpdf/core`)
- **Open password-protected PDFs** with an in-app password prompt

### Export

- One-click **Export** produces a flattened PDF with all edits baked in using
  `pdf-lib`
- Optional compression on export
- In the desktop app, a toast confirms the final save location once the OS
  download dialog completes

### Privacy

- Everything runs locally. No file upload, no API calls, no third-party
  requests at runtime.
- The Inter font is self-hosted via `@fontsource/inter` — nothing is loaded
  from a CDN.
- Saved signatures are stored only in `localStorage` (up to 12 entries).

---

## Quick start (web)

The project uses [Bun](https://bun.sh) for installs and scripts. `npm` / `pnpm`
work too — just swap `bun` for your preferred runner.

```bash
bun install
bun run dev       # http://localhost:5173
bun run build     # type-check + production build into dist/
bun run preview   # preview the production build
bun run lint      # eslint
```

The production build under `dist/` is a static bundle. Drop it behind any
static host (Vercel, Netlify, GitHub Pages, S3 + CloudFront, nginx, etc.).

---

## Desktop app (Electron, macOS)

The same React renderer is packaged as a native macOS app. Bun is used for
installs and scripts; Electron still ships its own Node runtime for the main
process.

```bash
bun run dev:electron      # Vite + Electron with HMR
bun run build:electron    # builds renderer + main/preload bundles
bun run start:electron    # runs the built app against the electron binary
bun run package:mac       # .dmg + .zip for arm64 and x64 in release/
```

The Electron entry points live in `electron/`:

- `electron/main.ts` — creates the `BrowserWindow`, loads the Vite dev server
  in development or the built `dist/index.html` in production, and forwards
  download outcomes (completed / cancelled / interrupted) back to the renderer.
- `electron/preload.ts` — exposes a single safe API
  (`window.electronApi.onNextDownloadResult`) over `contextBridge`. Context
  isolation is on, `nodeIntegration` is off, sandbox is enabled.
- `electron/ipc-channels.ts` — shared channel constants.

`vite.config.ts` only wires `vite-plugin-electron` when `ELECTRON=1`, so the
browser-only `bun run dev` flow stays untouched.

### Linux / Windows builds

`electron-builder` is configured for macOS only. Adding `linux` / `win`
targets to the `build` block in `package.json` is straightforward — PRs
welcome.

---

## Tech stack

- **React 19** + **TypeScript** (strict) + **Vite**
- **Tailwind CSS v4** via `@tailwindcss/vite`
- **`pdfjs-dist`** — page rendering to `<canvas>`
- **`pdf-lib`** — stamping text, signatures, and shapes onto pages; page
  rotation / reorder / removal; merging
- **`@libpdf/core`** — AES-256 password protection
- **`sonner`** — toast notifications
- **Electron 41** — desktop wrapper

---

## How it works

### Normalized coordinates

Every annotation is stored in **page-space fractions** (`x`, `y`, `width`,
`height` all in `[0, 1]`), where `(0, 0)` is the top-left of the displayed
page and `(1, 1)` is the bottom-right. Zoom, device pixel ratio, and page
rotation never touch the stored model.

At export time `src/lib/export-pdf.ts` converts those fractions back into
PDF points and flips the Y axis, accounting for any user-applied rotation so
text and signatures land where the user placed them.

### Page operations

`src/hooks/use-page-operations.ts` keeps an ordered list of
`{ originalIndex, rotation }` entries that describes the desired output. The
exporter walks that list, copies pages from the source document in the right
order, and applies the accumulated rotation. Annotations are matched back to
their original page by `originalIndex`.

### Compression

`src/lib/compress-pdf.ts` re-renders each page off-screen at a configurable
scale, encodes the canvas as JPEG, and embeds it into a fresh PDF sized to
the original page dimensions. Trades vector fidelity for predictable,
substantial size reduction.

### Password protection

`src/lib/protect-pdf.ts` re-saves the exported bytes through `@libpdf/core`
with AES-256 protection. The same value is used for the user and owner
password to keep the surface minimal.

---

## Project layout

```
electron/
  main.ts                 # BrowserWindow + download IPC
  preload.ts              # contextBridge -> window.electronApi
  ipc-channels.ts

src/
  app.tsx                 # top-level shell + editor state
  main.tsx                # React entry
  index.css               # Tailwind entry

  components/
    app-header.tsx
    button.tsx
    toolbar.tsx
    shapes-menu.tsx
    export-menu.tsx
    empty-state.tsx
    placement-banner.tsx

    pdf-viewer.tsx
    pdf-page.tsx
    page-sidebar.tsx
    page-thumbnail.tsx
    page-toolbar.tsx

    annotation-box.tsx
    text-annotation-view.tsx
    text-annotation-renderer.tsx
    signature-annotation-view.tsx
    signature-annotation-renderer.tsx
    shape-annotation-view.tsx
    shape-annotation-renderer.tsx
    color-swatches.tsx

    signature-pad-modal.tsx
    merge-pdfs-modal.tsx
    compress-pdf-modal.tsx
    protect-pdf-modal.tsx
    password-prompt-modal.tsx

  hooks/
    use-pdf-document.ts
    use-annotations.ts
    use-page-operations.ts
    use-saved-signatures.ts
    use-in-view.ts

  lib/
    load-pdf.ts            # pdfjs-dist loader + password detection
    decrypt-pdf.ts         # unlock encrypted PDFs
    render-pdf-page.ts
    pdf-worker.ts          # configures pdf.js worker
    export-pdf.ts          # pdf-lib stamping
    export-pdf-geometry.ts # rotation + coordinate helpers
    rotation-transforms.ts
    shape-geometry.ts
    merge-pdfs.ts
    compress-pdf.ts
    protect-pdf.ts
    await-download-result.ts
    download-blob.ts
    format-bytes.ts
    format-date.ts
    hex-to-rgb.ts
    create-id.ts
    is-electron.ts

  types/
    annotation.ts
    pdf.ts
    placement.ts
    page-operation.ts
    compress-mode.ts
    compression-level.ts
    merge-mode.ts
    download-result.ts
    electron-api.ts
```

---

## Contributing

Contributions are welcome. Before opening a PR:

```bash
bun run lint
bun run build
```

A couple of conventions used throughout the codebase:

- **Strict TypeScript.** Declare parameter and return types. Avoid `any`.
- **Kebab-case** file names, **PascalCase** components, **camelCase**
  variables and functions.
- **One export per file.**
- **Normalized coordinates** for anything that touches a page.
- **RO-RO** — pass and return objects when a function has more than one
  parameter or result.
- No emojis in code or logs.

Good first issues:

- Add Linux / Windows targets to the `electron-builder` config.
- Add tests for `export-pdf-geometry.ts` and `compress-pdf.ts`.
- Keyboard shortcuts for the toolbar tools.

---

## License

MIT. See `LICENSE`.

---

## Acknowledgements

Built on the shoulders of [`pdfjs-dist`](https://github.com/mozilla/pdf.js),
[`pdf-lib`](https://github.com/Hopding/pdf-lib), and
[`@libpdf/core`](https://www.npmjs.com/package/@libpdf/core).
