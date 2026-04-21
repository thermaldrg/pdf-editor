import { useCallback, useEffect, useState } from 'react';
import { createId } from '../lib/create-id';

export interface SavedSignature {
  readonly id: string;
  readonly dataUrl: string;
  readonly aspectRatio: number;
  readonly createdAt: number;
}

export interface SavedSignaturesApi {
  readonly signatures: ReadonlyArray<SavedSignature>;
  readonly saveSignature: (input: SaveSignatureInput) => SavedSignature;
  readonly removeSignature: (id: string) => void;
}

interface SaveSignatureInput {
  readonly dataUrl: string;
  readonly aspectRatio: number;
}

const STORAGE_KEY: string = 'pdf-editor/saved-signatures';
const MAX_SIGNATURES: number = 12;

export function useSavedSignatures(): SavedSignaturesApi {
  const [signatures, setSignatures] = useState<ReadonlyArray<SavedSignature>>(
    () => readFromStorage(),
  );

  useEffect(() => {
    writeToStorage(signatures);
  }, [signatures]);

  const saveSignature = useCallback(
    (input: SaveSignatureInput): SavedSignature => {
      const entry: SavedSignature = {
        id: createId(),
        dataUrl: input.dataUrl,
        aspectRatio: input.aspectRatio,
        createdAt: Date.now(),
      };
      setSignatures((current) => [entry, ...current].slice(0, MAX_SIGNATURES));
      return entry;
    },
    [],
  );

  const removeSignature = useCallback((id: string): void => {
    setSignatures((current) => current.filter((item) => item.id !== id));
  }, []);

  return { signatures, saveSignature, removeSignature };
}

function readFromStorage(): ReadonlyArray<SavedSignature> {
  if (typeof window === 'undefined') return [];
  try {
    const raw: string | null = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isSavedSignature);
  } catch {
    return [];
  }
}

function writeToStorage(signatures: ReadonlyArray<SavedSignature>): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(signatures));
  } catch {
    // Ignore quota or access errors; persistence is best-effort.
  }
}

function isSavedSignature(value: unknown): value is SavedSignature {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.dataUrl === 'string' &&
    typeof candidate.aspectRatio === 'number' &&
    typeof candidate.createdAt === 'number'
  );
}
