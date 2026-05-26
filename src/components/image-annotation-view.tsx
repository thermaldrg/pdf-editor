import type { ImageAnnotation } from '../types/annotation';

interface ImageAnnotationViewProps {
  readonly annotation: ImageAnnotation;
}

export function ImageAnnotationView({ annotation }: ImageAnnotationViewProps) {
  return (
    <img
      src={annotation.dataUrl}
      alt="Image"
      draggable={false}
      className="pointer-events-none h-full w-full select-none object-contain"
    />
  );
}
