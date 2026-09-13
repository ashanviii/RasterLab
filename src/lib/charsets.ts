/** Built-in character ramps for the ASCII Art shader's character-atlas system, ordered light -> dense. */
export const BUILTIN_CHARSETS: Record<string, string> = {
  ASCII: ' .:-=+*#%@',
  Blocks: ' ░▒▓█',
  Symbols: ' .,:;+*?%$@',
};

export const CHARACTER_SET_OPTIONS = [
  { label: 'ASCII', value: 0 },
  { label: 'Blocks', value: 1 },
  { label: 'Symbols', value: 2 },
  { label: 'Custom', value: 3 },
];

const CHARSET_BY_INDEX = [BUILTIN_CHARSETS.ASCII, BUILTIN_CHARSETS.Blocks, BUILTIN_CHARSETS.Symbols];

/** Resolve a shader item's characterSet/customChars params into an ordered array of glyph strings. */
export function resolveCharacterList(characterSetIndex: number, customChars: string | undefined): string[] {
  const preset = CHARSET_BY_INDEX[Math.round(characterSetIndex)];
  const raw = preset ?? (customChars && customChars.length > 0 ? customChars : BUILTIN_CHARSETS.ASCII);
  const chars = Array.from(raw);
  return chars.length > 0 ? chars : [' '];
}
