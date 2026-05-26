import type { RasterImageMimeType } from '../types/annotation';

/**
 * Reads an image blob (from a clipboard paste or a file input) and produces a
 * data URL plus the source aspect ratio. Browsers can paste images in formats
 * pdf-lib cannot embed natively (webp, gif, ...), so anything that is not PNG
 * or JPEG is rasterised through a canvas to PNG.
 */

const PNG_MIME: RasterImageMimeType = 'image/png';
const JPEG_MIME: RasterImageMimeType = 'image/jpeg';

export interface ReadImageResult {
  readonly dataUrl: string;
  readonly mimeType: RasterImageMimeType;
  readonly aspectRatio: number;
}

interface ImageDimensions {
  readonly width: number;
  readonly height: number;
}

export async function readImageFromBlob(blob: Blob): Promise<ReadImageResult> {
  if (!blob.type.startsWith('image/')) {
    throw new Error('Clipboard or file content is not an image.');
  }
  const nativeMime: RasterImageMimeType | null = pickNativeMimeType(blob.type);
  if (nativeMime) {
    const dataUrl: string = await readBlobAsDataUrl(blob);
    const dimensions: ImageDimensions = await measureImage(dataUrl);
    return {
      dataUrl,
      mimeType: nativeMime,
      aspectRatio: dimensions.width / dimensions.height,
    };
  }
  return rasteriseToPng(blob);
}

function pickNativeMimeType(mime: string): RasterImageMimeType | null {
  if (mime === PNG_MIME) return PNG_MIME;
  if (mime === JPEG_MIME) return JPEG_MIME;
  if (mime === 'image/jpg') return JPEG_MIME;
  return null;
}

function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise<string>((resolve, reject): void => {
    const reader: FileReader = new FileReader();
    reader.onload = (): void => {
      const result: string | ArrayBuffer | null = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Unexpected reader output for image blob.'));
        return;
      }
      resolve(result);
    };
    reader.onerror = (): void => {
      reject(reader.error ?? new Error('Failed to read image data.'));
    };
    reader.readAsDataURL(blob);
  });
}

function measureImage(src: string): Promise<ImageDimensions> {
  return new Promise<ImageDimensions>((resolve, reject): void => {
    const image: HTMLImageElement = new Image();
    image.onload = (): void => {
      if (image.naturalWidth === 0 || image.naturalHeight === 0) {
        reject(new Error('Image has zero dimensions.'));
        return;
      }
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = (): void => {
      reject(new Error('Failed to decode image.'));
    };
    image.src = src;
  });
}

async function rasteriseToPng(blob: Blob): Promise<ReadImageResult> {
  const sourceUrl: string = URL.createObjectURL(blob);
  try {
    const dimensions: ImageDimensions = await measureImage(sourceUrl);
    const canvas: HTMLCanvasElement = document.createElement('canvas');
    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    const ctx: CanvasRenderingContext2D | null = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Could not allocate a 2D canvas to encode image.');
    }
    const image: HTMLImageElement = await loadImageElement(sourceUrl);
    ctx.drawImage(image, 0, 0, dimensions.width, dimensions.height);
    return {
      dataUrl: canvas.toDataURL(PNG_MIME),
      mimeType: PNG_MIME,
      aspectRatio: dimensions.width / dimensions.height,
    };
  } finally {
    URL.revokeObjectURL(sourceUrl);
  }
}

function loadImageElement(src: string): Promise<HTMLImageElement> {
  return new Promise<HTMLImageElement>((resolve, reject): void => {
    const image: HTMLImageElement = new Image();
    image.onload = (): void => resolve(image);
    image.onerror = (): void => reject(new Error('Failed to decode image.'));
    image.src = src;
  });
}

export function findImageBlobInClipboard(
  data: DataTransfer | null,
): Blob | null {
  if (!data) return null;
  const items: DataTransferItemList | undefined = data.items;
  if (items) {
    for (let i: number = 0; i < items.length; i += 1) {
      const item: DataTransferItem = items[i] as DataTransferItem;
      if (item.kind !== 'file') continue;
      if (!item.type.startsWith('image/')) continue;
      const file: File | null = item.getAsFile();
      if (file) return file;
    }
  }
  const files: FileList | undefined = data.files;
  if (files) {
    for (let i: number = 0; i < files.length; i += 1) {
      const file: File | null = files.item(i);
      if (file && file.type.startsWith('image/')) return file;
    }
  }
  return null;
}
