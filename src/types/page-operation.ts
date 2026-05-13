/**
 * Per-page user operations applied on top of the source PDF.
 *
 * The list of page operations represents the *current order* of pages in the
 * editor. The `originalIndex` field references the page in the loaded source
 * document (0-based). The `rotation` field is the user-applied rotation in
 * degrees clockwise; it is layered on top of any intrinsic /Rotate value the
 * source page may carry.
 *
 * Removing a page = removing its entry from the list.
 * Reordering pages = reordering entries in the list.
 * Rotating a page = updating the `rotation` of its entry.
 */

export type PageRotation = 0 | 90 | 180 | 270;

export interface PageOperation {
  readonly originalIndex: number;
  readonly rotation: PageRotation;
}
