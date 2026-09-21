export type ParamType = 'float' | 'int' | 'color' | 'select' | 'bool' | 'text';

export interface SelectOption {
  label: string;
  value: number;
}

export interface ParamDef {
  key: string;
  label: string;
  type: ParamType;
  default: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: SelectOption[];
  advanced?: boolean;
  color?: boolean;
  /** Named section this param renders under in the settings panel, e.g. "Intensity". */
  group?: string;
  /** Default value for a 'text' type param (e.g. a typed character ramp). */
  defaultText?: string;
  /** Only render this param when another param (numeric) currently equals a given value.
   *  An array requires every condition to match (AND). */
  visibleWhen?: { key: string; equals: number } | { key: string; equals: number }[];
}

export type ShaderCategory =
  | 'Distortion'
  | 'Retro'
  | 'Color'
  | 'Texture'
  | 'Light'
  | 'Glass'
  | 'ASCII'
  | 'DreamLight'
  | 'Custom';

export interface QuickPresetDef {
  name: string;
  values: Record<string, number>;
}

export interface ShaderDef {
  id: string;
  name: string;
  category: ShaderCategory;
  description: string;
  thumbnail: string; // gradient key used to render a fake thumbnail
  /** Optional static image path (e.g. '/thumbnails/ascii-studio.png') shown instead of the live-rendered preview. */
  thumbnailImage?: string;
  fragmentShader: string;
  params: ParamDef[];
  custom?: boolean;
  /** Opt-in: the renderer builds/binds a character-atlas texture (see charsets.ts) for this shader. */
  usesCharsetAtlas?: boolean;
  /** Quick param-value bundles shown as a chip row above the settings groups. */
  quickPresets?: QuickPresetDef[];
}

export interface StackItem {
  instanceId: string;
  shaderId: string;
  enabled: boolean;
  params: Record<string, number>;
  /** Values for any 'text'-type params (e.g. a typed custom character ramp). */
  textParams?: Record<string, string>;
}

export interface PresetDef {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  stack: {
    shaderId: string;
    params: Record<string, number>;
    textParams?: Record<string, string>;
    enabled?: boolean;
  }[];
  /** User-saved preset (from the current shader stack), as opposed to a built-in one -- shown separately and deletable. */
  custom?: boolean;
}
