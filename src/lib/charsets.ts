import { Diamond } from "lucide-react";

/** Built-in character ramps for the ASCII Art shader's character-atlas system, ordered light -> dense. */
export const BUILTIN_CHARSETS: Record<string, string> = {
  ASCII: ' .:-=+*#%@',
  Blocks: ' ░▒▓█',
  Symbols: ' .,:;+*?%$@',
  Geometric: ' .+x✦✓▲▶◆●■',
  Code: ' .:0001101111010101011111000',
  Suits: ' .+♦♣♥♠●■',
  Diamond: '◆',
  Heart: '♥',
  Spade: '♠',
  Club: '♣',
  Line: '|||',
  Plus: '+++',
  
};

export const CHARACTER_SET_OPTIONS = [
  { label: 'ASCII', value: 0 },
  { label: 'Blocks', value: 1 },
  { label: 'Symbols', value: 2 },
  { label: 'Geometric', value: 3 },
  { label: 'Code', value: 4 },
  { label: 'Suits', value: 5 },
  { label: 'Custom', value: 6 },
  { label: 'Line', value: 7 },
  { label: 'Plus', value: 8 },
];

const CHARSET_BY_INDEX = [
  BUILTIN_CHARSETS.ASCII,
  BUILTIN_CHARSETS.Blocks,
  BUILTIN_CHARSETS.Symbols,
  BUILTIN_CHARSETS.Geometric,
  BUILTIN_CHARSETS.Code,
  BUILTIN_CHARSETS.Suits,
  BUILTIN_CHARSETS.Diamond,
  BUILTIN_CHARSETS.Heart,
  BUILTIN_CHARSETS.Spade,
  BUILTIN_CHARSETS.Club,
  BUILTIN_CHARSETS.Line,
  BUILTIN_CHARSETS.Plus,
];

/** Resolve a shader item's characterSet/customChars params into an ordered array of glyph strings. */
export function resolveCharacterList(characterSetIndex: number, customChars: string | undefined): string[] {
  const preset = CHARSET_BY_INDEX[Math.round(characterSetIndex)];
  const raw = preset ?? (customChars && customChars.length > 0 ? customChars : BUILTIN_CHARSETS.ASCII);
  const chars = Array.from(raw);
  return chars.length > 0 ? chars : [' '];
}
