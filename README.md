# PDF Editor

A small, client-side PDF editor built with React + TypeScript + Tailwind CSS.

- Drag-and-drop a PDF (or browse to open).
- Add text fields anywhere on any page, edit them inline.
- Draw a signature in a modal pad and drop it onto the page.
- Drag, resize and delete annotations.
- Zoom in/out.
- Export a flattened PDF that bakes in your edits using `pdf-lib`.

Everything runs in the browser. No upload, no server.

## Tech

- React 19 + Vite + TypeScript
- Tailwind CSS v4 (`@tailwindcss/vite`)
- `pdfjs-dist` for rendering pages to a canvas
- `pdf-lib` for stamping text and signature images onto the original PDF

## Scripts

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + production build into dist/
npm run preview   # preview the production build
```

## How it works

- Annotations are stored in normalized page-space (fractions of page width/height) so
  they stay aligned regardless of zoom.
- On export, `src/lib/export-pdf.ts` loads the original PDF bytes, then for each
  annotation either calls `page.drawText` (text) or `page.drawImage` (signature PNG),
  converting normalized coordinates into PDF points and flipping the Y axis.

## Project layout

```
src/
  app.tsx                       # top-level shell + editor state
  components/
    annotation-box.tsx          # generic drag/resize/delete wrapper
    app-header.tsx
    button.tsx
    empty-state.tsx             # drop-zone / file picker
    pdf-page.tsx                # renders one page + its annotations
    pdf-viewer.tsx              # vertical stack of pages
    placement-banner.tsx
    signature-annotation-view.tsx
    signature-pad-modal.tsx     # canvas-based signature pad
    text-annotation-view.tsx
    toolbar.tsx
  hooks/
    use-annotations.ts
    use-pdf-document.ts
  lib/
    create-id.ts
    download-blob.ts
    export-pdf.ts               # pdf-lib stamping
    hex-to-rgb.ts
    load-pdf.ts                 # pdfjs-dist loader
    pdf-worker.ts               # configures pdf.js worker
    render-pdf-page.ts
  types/
    annotation.ts
    pdf.ts
    placement.ts
```
