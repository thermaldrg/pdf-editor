export type CompressionLevel = 'low' | 'medium' | 'high';

export interface CompressionLevelDefinition {
  readonly id: CompressionLevel;
  readonly label: string;
  readonly description: string;
  readonly renderScale: number;
  readonly jpegQuality: number;
}

const LEVEL_LIGHT: CompressionLevelDefinition = {
  id: 'low',
  label: 'Light',
  description: 'Best quality, smallest size reduction.',
  renderScale: 2.0,
  jpegQuality: 0.9,
};

const LEVEL_BALANCED: CompressionLevelDefinition = {
  id: 'medium',
  label: 'Balanced',
  description: 'Good quality with noticeable size reduction.',
  renderScale: 1.5,
  jpegQuality: 0.75,
};

const LEVEL_STRONG: CompressionLevelDefinition = {
  id: 'high',
  label: 'Strong',
  description: 'Smallest file, lower quality.',
  renderScale: 1.0,
  jpegQuality: 0.6,
};

export const COMPRESSION_LEVELS: ReadonlyArray<CompressionLevelDefinition> = [
  LEVEL_LIGHT,
  LEVEL_BALANCED,
  LEVEL_STRONG,
] as const;

export const DEFAULT_COMPRESSION_LEVEL: CompressionLevel = 'medium';

export function getCompressionLevelDefinition(
  level: CompressionLevel,
): CompressionLevelDefinition {
  const found: CompressionLevelDefinition | undefined = COMPRESSION_LEVELS.find(
    (definition) => definition.id === level,
  );
  if (!found) {
    throw new Error(`Unknown compression level: ${level}`);
  }
  return found;
}
