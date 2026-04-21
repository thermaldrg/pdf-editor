import type { SignatureAnnotation } from '../types/annotation';

interface SignatureAnnotationViewProps {
  readonly annotation: SignatureAnnotation;
}

export function SignatureAnnotationView({
  annotation,
}: SignatureAnnotationViewProps) {
  return (
    <img
      src={annotation.dataUrl}
      alt="Signature"
      draggable={false}
      className="pointer-events-none h-full w-full select-none object-contain"
    />
  );
}
