import { useEffect, useRef } from 'react';
import type { TextAnnotation } from '../types/annotation';

interface PageSize {
  readonly width: number;
  readonly height: number;
}

interface TextAnnotationViewProps {
  readonly annotation: TextAnnotation;
  readonly isEditing: boolean;
  readonly pagePixelSize: PageSize;
  readonly onChange: (text: string) => void;
  readonly onExitEdit: () => void;
}

export function TextAnnotationView({
  annotation,
  isEditing,
  pagePixelSize,
  onChange,
  onExitEdit,
}: TextAnnotationViewProps) {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!isEditing) return;
    const textarea: HTMLTextAreaElement | null = textareaRef.current;
    if (!textarea) return;
    textarea.focus();
    const length: number = textarea.value.length;
    textarea.setSelectionRange(length, length);
  }, [isEditing]);

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key === 'Escape') {
      event.preventDefault();
      onExitEdit();
    }
  };

  const fontSizePx: number = annotation.fontSize * pagePixelSize.height;
  const isEmpty: boolean = annotation.text.length === 0;

  return (
    <div className="relative h-full w-full">
      <textarea
        ref={textareaRef}
        value={annotation.text}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onExitEdit}
        onKeyDown={handleKeyDown}
        onPointerDown={(e) => e.stopPropagation()}
        readOnly={!isEditing}
        spellCheck={false}
        className="absolute inset-0 h-full w-full resize-none border-0 bg-transparent p-1 leading-tight outline-none"
        style={{
          fontSize: `${fontSizePx}px`,
          color: annotation.color,
          cursor: isEditing ? 'text' : 'inherit',
        }}
      />
      {isEmpty && !isEditing && (
        <div
          className="pointer-events-none absolute inset-0 flex items-center px-1 italic text-slate-400"
          style={{ fontSize: `${fontSizePx}px` }}
        >
          Double-click to type
        </div>
      )}
    </div>
  );
}
