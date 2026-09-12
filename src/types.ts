export type ParamType = 'float' | 'int' | 'color' | 'select' | 'bool';

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
}

export type ShaderCategory =
  | 'Distortion'
  | 'Retro'
  | 'Color'
  | 'Texture'
  | 'Light'
  | 'ASCII'
  | 'DreamLight'
  | 'Custom';

export interface ShaderDef {
  id: string;
  name: string;
  category: ShaderCategory;
  description: string;
  thumbnail: string; // gradient key used to render a fake thumbnail
  fragmentShader: string;
  params: ParamDef[];
  custom?: boolean;
}

export interface StackItem {
  instanceId: string;
  shaderId: string;
  enabled: boolean;
  params: Record<string, number>;
}

export interface PresetDef {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  stack: { shaderId: string; params: Record<string, number> }[];
}
