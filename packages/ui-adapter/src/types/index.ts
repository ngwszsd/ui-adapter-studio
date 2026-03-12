import type { SerializedNodes } from '@craftjs/core';

export const AR_VIEWPORT_WIDTH = 560;
export const AR_VIEWPORT_HEIGHT = 315;
export const AR_VIEWPORT_ASPECT_RATIO = AR_VIEWPORT_WIDTH / AR_VIEWPORT_HEIGHT;

export type CanvasInteractionMode = 'mouse' | 'touchpad';

export interface CustomMenuChild {
  id: string;
  name: string;
}

export interface CustomMenuGroup {
  id: string;
  name: string;
  children: CustomMenuChild[];
}

export interface I18nEntry {
  id: string;
  key: string;
  zhCN: string;
  enUS: string;
}

export interface ComponentI18nBinding {
  id: string;
  propKey: string;
  key: string;
}

export type GlobalVariableType =
  | 'string'
  | 'integer'
  | 'number'
  | 'boolean'
  | 'object'
  | 'array';

export const GLOBAL_VARIABLE_TYPES = [
  { value: 'string', label: 'String' },
  { value: 'integer', label: 'Integer' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'object', label: 'Object' },
  { value: 'array', label: 'Array' },
] as const;

export interface GlobalVariable {
  id: string;
  name: string;
  type: GlobalVariableType;
  value: string;
}

export type ArrangementMode = 'vertical' | 'horizontal' | 'wrap';
export type SpacingMode = 'fixed' | 'auto';
export type GridPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';
export type ColumnPosition = 'left' | 'center' | 'right';

export interface LayoutConfig {
  arrangement: ArrangementMode;
  spacingMode: SpacingMode;
  spacing: number;
  distribution: GridPosition;
  columnDistribution: ColumnPosition;
  columnCount?: number;
  columnGap?: number;
  rowGap?: number;
}

export interface ARPageConfig {
  topBar: {
    visible: boolean;
  };
  menu: {
    visible: boolean;
    margin: number;
    showUser: boolean;
    customMenus: CustomMenuGroup[];
    showSystem: boolean;
    showCommand: boolean;
  };
  systemStatus: {
    visible: boolean;
    margin: number;
    gap: number;
    showCellular: boolean;
    showWifi: boolean;
    showMobileData: boolean;
    showBluetooth: boolean;
    /**
     * 一个标志，指示是否显示GPS。设置为true时，可以显示GPS。把它设为false会隐藏GPS显示。
     */
    showGPS: boolean;
    showVolume: boolean;
    showTime: boolean;
    showBatteryPercent: boolean;
  };
  layout?: LayoutConfig;
  containerStyle?: ContainerStyleConfig;
  i18n?: {
    entries: I18nEntry[];
  };
}

export interface ContainerStyleConfig {
  background: string;
  borderRadius: FourCornerValue;
  padding: FourSideValue;
  margin: FourSideValue;
  border: BorderValue | null;
  shadow: ShadowValue | null;
}

export interface ARPage {
  id: string;
  title: string;
  x: number;
  y: number;
  craftState: SerializedNodes | null;
  config?: ARPageConfig;
}

export interface ComponentDef {
  type: string;
  label: string;
  category: string;
  icon: string;
  description?: string;
  isCanvas?: boolean;
  defaultProps?: Record<string, unknown>;
}

/** RESOLVER 中注册的组件名（resolver key），用于路由判断，不可使用中文 */
export type ResolverComponentName =
  | 'StageRoot'
  | 'Button'
  | 'Text'
  | 'InputField'
  | 'RadioGroup'
  | 'CheckboxGroup'
  | 'NumberInput'
  | 'ImageDisplay'
  | 'VideoDisplay'
  | 'MarkdownDisplay'
  | 'AudioDisplay'
  | 'CarouselDisplay'
  | 'AudioRecorder'
  | 'VideoRecorder'
  | 'Container'
  | 'Form'
  | 'VerticalList'
  | 'HorizontalList'
  | 'GridList';

export interface ActiveNodeInfo {
  pageId: string;
  nodeId: string;
  /** resolver key，用于路由匹配（如 'Button'、'InputField'） */
  name: ResolverComponentName;
  /** 组件中文显示名（如 '输入框'），用于 UI 展示 */
  displayName: string;
  props: Record<string, unknown>;
}

// ---- Container style prop types ----

export type FourSideValue =
  | number
  | { top: number; right: number; bottom: number; left: number };

export type FourCornerValue =
  | number
  | { tl: number; tr: number; bl: number; br: number };

export interface BorderValue {
  width: number;
  color: string;
  style: 'solid' | 'dashed' | 'dotted';
}

export type ShadowType = 'outer' | 'inset';

export interface ShadowValue {
  type: ShadowType;
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
}

// ---- Button component types ----

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'warning';
export type PositionType = 'relative' | 'absolute' | 'fixed';
export type SizeMode = 'fixed' | 'fill' | 'percent' | 'fit-content';
export type SizeLimitType = 'maxWidth' | 'maxHeight' | 'minWidth' | 'minHeight';

export interface SizeLimitItem {
  type: SizeLimitType;
  value: number;
}

// ---- Text component types ----

export type TextStyleMode = 'preset' | 'custom';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextVerticalAlign = 'top' | 'center' | 'bottom';
export type OverflowMode = 'visible' | 'hidden' | 'scroll';

export interface TextShadowConfig {
  x: number;
  y: number;
  blur: number;
  color: string;
}

// ---- InputField component types ----

export type InputFieldLayout = 'vertical' | 'horizontal';

// ---- List component types ----

export type ListDataMode = 'binding' | 'expression';
export type VerticalListDataMode = ListDataMode;
export type HorizontalListDataMode = ListDataMode;
export type GridListDataMode = ListDataMode;

// ---- RadioGroup component types ----

export interface RadioOptionItem {
  id: string;
  label: string;
  value: string;
  imageUrl?: string | null;
  description?: string;
}

export type RadioContentMode = 'static' | 'dynamic';

export type RadioDisplayStyle = 'horizontal' | 'vertical';

export type BlurType = 'layer' | 'background';

export interface BlurConfig {
  type: BlurType;
  value: number;
}

// ---- NumberInput component types ----

export type NumberInputType = 'number' | 'password';
export type NumberDataType = 'integer' | 'decimal';

// ---- ImageDisplay component types ----

export type ImageSourceType = 'local' | 'binding';
export type ImageFillMode = 'cover' | 'contain' | 'stretch';

// ---- VideoDisplay component types ----

export type VideoSourceType = 'local' | 'binding';

// ---- AudioDisplay component types ----

export type AudioSourceType = 'local' | 'binding';
export type AudioPlayerStyle = 'large' | 'small' | 'bar';

// ---- AudioRecorder component types ----

export type RecorderDisplayStyle = 'fullscreen' | 'hidden';

// ---- CarouselDisplay component types ----

export type CarouselContentMode = 'static' | 'dynamic';
export type CarouselImageSourceType = 'local' | 'binding';

export interface CarouselImageItem {
  id: string;
  sourceType: CarouselImageSourceType;
  imageUrl: string | null;
  bindingField: string;
  fileName: string;
}

// ---- Shared component types ----

export interface TransformConfig {
  scale: number;
  rotate: number;
  translateX: number;
  translateY: number;
  skewX: number;
  skewY: number;
}

export interface PersistedDesignerState {
  pageOrder: string[];
  pages: Record<string, ARPage>;
  canvasScale: number;
  interactionMode: CanvasInteractionMode;
  globalVariables?: GlobalVariable[];
}

export interface DesignerOutput {
  version: string;
  exportedAt: string;
  viewport: {
    width: number;
    height: number;
  };
  pages: Array<{
    id: string;
    title: string;
    x: number;
    y: number;
    nodes: SerializedNodes;
  }>;
}
