import type { StandardPropertiesHyphen } from 'csstype';

export type LogStyle =
  'bright' | 'dim' | 'error' | 'info' | 'normal' | 'success' | 'warn';

export type ComponentName = `${Upper}${string}`;

export type HookName = `use${Upper}${string}`;

export type ContextName = `${Upper}${string}Provider`;

export type FunctionName = `${Lower}${string}`;

export type EventName =
  | keyof GlobalEventHandlersEventMap
  | `on${string}`
  | `before${string}`
  | `after${string}`
  | `handle${Upper}${string}`
  | 'cleanup'
  | 'loadEntities'
  | 'reloadEntities'
  | 'render'
  | 'setup';

export type FileName = `${string}.${string}`;

export type Primitive = string | number | boolean | null | undefined;

interface Prefix {
  kind:
    'component' | 'hook' | 'context' | 'file' | 'function' | 'event' | 'state';
  name: string;
  args?: Primitive[];
  style?: LogStyle;
}

/** @see https://developer.mozilla.org/en-US/docs/Web/CSS/system-color */
type SystemColor =
  | 'AccentColor'
  | 'AccentColorText'
  | 'ActiveText'
  | 'ButtonBorder'
  | 'ButtonFace'
  | 'ButtonText'
  | 'Canvas'
  | 'CanvasText'
  | 'Field'
  | 'FieldText'
  | 'GrayText'
  | 'Highlight'
  | 'HighlightText'
  | 'LinkText'
  | 'Mark'
  | 'MarkText'
  | 'SelectedItem'
  | 'SelectedItemText'
  | 'VisitedText';

type SimpleColor = 'red' | 'green' | 'blue' | 'yellow';

type LightDarkColor = `light-dark(${string})`;

type Color = SystemColor | LightDarkColor | SimpleColor | '';

/**
 * @see https://developer.mozilla.org/en-US/docs/Web/API/console#styling_console_output
 */
type FirefoxCssProperties = Pick<
  StandardPropertiesHyphen,
  | 'background'
  | 'background-attachment'
  | 'background-clip'
  | 'background-color'
  | 'background-image'
  | 'background-origin'
  | 'background-position'
  | 'background-repeat'
  | 'background-size'
  | 'border'
  | 'border-color'
  | 'border-radius'
  | 'border-style'
  | 'border-width'
  | (`border-bottom-${string}` & keyof StandardPropertiesHyphen)
  | (`border-left-${string}` & keyof StandardPropertiesHyphen)
  | (`border-right-${string}` & keyof StandardPropertiesHyphen)
  | (`border-top-${string}` & keyof StandardPropertiesHyphen)
  | 'box-decoration-break'
  | 'box-shadow'
  | 'clear'
  | 'color'
  | 'cursor'
  | 'display'
  | 'float'
  | 'font'
  | 'font-family'
  | 'font-size'
  | 'font-style'
  | 'font-variant'
  | 'font-weight'
  | 'line-height'
  | 'margin'
  | 'margin-bottom'
  | 'margin-left'
  | 'margin-right'
  | 'margin-top'
  | 'outline'
  | 'outline-color'
  | 'outline-style'
  | 'outline-width'
  | 'padding'
  | 'padding-bottom'
  | 'padding-left'
  | 'padding-right'
  | 'padding-top'
  | (`text-${string}` & keyof StandardPropertiesHyphen)
  | 'white-space'
  | 'word-break'
  | 'word-spacing'
  | 'writing-mode'
>;

function getColor(s: LogStyle): Color {
  switch (s) {
    case 'bright':
      return 'ActiveText';
    case 'dim':
      return 'GrayText';
    case 'error':
      return 'light-dark(red, crimson)';
    case 'info':
      return 'light-dark(darkblue, lightblue)';
    case 'normal':
      return '';
    case 'success':
      return 'green';
    case 'warn':
      return 'light-dark(darkorange, yellow)';
    default:
      return 'GrayText';
  }
}

const lowPriorityPrefixNames: string[] = [
  'useEffect',
  'useMemo',
  'loadEntities',
  'reloadEntities',
];

/** @see GlobalEventHandlersEventMap */
const nativeEventNames: EventName[] = [
  'abort',
  'animationcancel',
  'animationend',
  'animationiteration',
  'animationstart',
  'auxclick',
  'beforeinput',
  'beforetoggle',
  'blur',
  'cancel',
  'canplay',
  'canplaythrough',
  'change',
  'click',
  'close',
  'compositionend',
  'compositionstart',
  'compositionupdate',
  'contextmenu',
  'copy',
  'cuechange',
  'cut',
  'dblclick',
  'drag',
  'dragend',
  'dragenter',
  'dragleave',
  'dragover',
  'dragstart',
  'drop',
  'durationchange',
  'emptied',
  'ended',
  'error',
  'focus',
  'focusin',
  'focusout',
  'formdata',
  'gotpointercapture',
  'input',
  'invalid',
  'keydown',
  'keypress',
  'keyup',
  'load',
  'loadeddata',
  'loadedmetadata',
  'loadstart',
  'lostpointercapture',
  'mousedown',
  'mouseenter',
  'mouseleave',
  'mousemove',
  'mouseout',
  'mouseover',
  'mouseup',
  'paste',
  'pause',
  'play',
  'playing',
  'pointercancel',
  'pointerdown',
  'pointerenter',
  'pointerleave',
  'pointermove',
  'pointerout',
  'pointerover',
  'pointerup',
  'progress',
  'ratechange',
  'reset',
  'resize',
  'scroll',
  'scrollend',
  'securitypolicyviolation',
  'seeked',
  'seeking',
  'select',
  'selectionchange',
  'selectstart',
  'slotchange',
  'stalled',
  'submit',
  'suspend',
  'timeupdate',
  'toggle',
  'touchcancel',
  'touchend',
  'touchmove',
  'touchstart',
  'transitioncancel',
  'transitionend',
  'transitionrun',
  'transitionstart',
  'volumechange',
  'waiting',
  'webkitanimationend',
  'webkitanimationiteration',
  'webkitanimationstart',
  'webkittransitionend',
  'wheel',
];

const knownEventNames: EventName[] = [
  'cleanup',
  'loadEntities',
  'reloadEntities',
  'render',
  'setup',
];

/**
 * Fluid, nestable browser console logger with support for color text output.
 *
 * The more data you log to the Dev Tools Console, the harder it is to find the
 * information you're looking for, because you end up with a giant wall of text.
 *
 * This class solves that problem by automatically (or manually, if desired)
 * color-coding the console log output to **dim** less-important information
 * and **highlight** more-important information.
 *
 * Moreover, it uses consistent color coding for different types of logging
 * sources: All event handlers have color X, all React hooks have color Y,
 * and all event handlers have color Z. This makes it **much** easier to
 * visually parse the console logs.
 */
export class UiLogger {
  private readonly prefixes: Prefix[] = [];

  /**
   * Create a new `UiLogger` that outputs to the given {@link writer}.
   *
   * @param writer Arrow function that wraps {@link console.debug} and passes it
   *     the varargs it receives. This ensures that the browser's Dev Tools
   *     Console shows the caller's source file in the stack trace instead of
   *     `logger.ts`.
   */
  constructor(private readonly writer: Console['debug']) {}

  private append(
    kind: Prefix['kind'],
    name: string,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    const logger = new UiLogger(this.writer);
    logger.prefixes.push(...this.prefixes);
    logger.prefixes.push({
      kind,
      name,
      args: Array.isArray(args) ? args : undefined,
      style:
        typeof style === 'string'
          ? style
          : typeof args === 'string'
            ? args
            : undefined,
    });
    return logger;
  }

  /*
   * Root-level entities that do not have a parent logger
   * (files, React components, and React Context Providers).
   */

  /**
   * Create a new child `Logger` instance for a source code file.
   *
   * This is typically only necessary for TS files that do not export a
   * React component/provider, such as `mui-theme-utils.ts`
   *
   * @param name Name of the TypeScript file the `Logger` is being instantiated
   * in (e.g., `mermaid-utils.ts`).
   */
  file(name: FileName, style?: LogStyle): UiLogger;
  file(name: FileName, args?: Primitive[], style?: LogStyle): UiLogger;
  file(
    name: FileName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('file', name, args, style);
  }

  /**
   * Create a new child `Logger` instance for use inside a
   * React component.
   *
   * @param name Name of the React TSX/JSX component (e.g., `TextEditor`).
   */
  component(name: ComponentName, style?: LogStyle): UiLogger;
  component(
    name: ComponentName,
    args?: Primitive[],
    style?: LogStyle,
  ): UiLogger;
  component(
    name: ComponentName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('component', name, args, style);
  }

  /**
   * Create a new child `Logger` instance for use inside a
   * React context provider.
   *
   * @param name Name of the React Context Provider (e.g., `ThemeProvider`).
   */
  context(name: ContextName, style?: LogStyle): UiLogger;
  context(name: ContextName, args?: Primitive[], style?: LogStyle): UiLogger;
  context(
    name: ContextName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('context', name, args, style);
  }

  /*
   * Second-level entities that always have a parent root-level logger
   * (React Hooks, functions, event handlers, and state changes).
   */

  /**
   * Create a new child `Logger` instance for use inside a
   * React hook.
   *
   * @param name Name of the React hook (e.g., `useState`).
   */
  hook(name: HookName, style?: LogStyle): UiLogger;
  hook(name: HookName, args?: Primitive[], style?: LogStyle): UiLogger;
  hook(
    name: HookName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('hook', name, args, style);
  }

  /**
   * Create a new child `Logger` instance for use inside an
   * ordinary JavaScript function.
   *
   * @param name Name of the function (e.g., `renderSvgToPng`).
   */
  function(name: FunctionName, style?: LogStyle): UiLogger;
  function(name: FunctionName, args?: Primitive[], style?: LogStyle): UiLogger;
  function(
    name: FunctionName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('function', name, args, style);
  }

  /**
   * Create a new child `Logger` instance for use inside an
   * event handler or callback function.
   *
   * @param name Name of the DOM event or handler function
   * (e.g., `click`, `onClick`, `handleClick`).
   */
  event(name: EventName, style?: LogStyle): UiLogger;
  event(name: EventName, args?: Primitive[], style?: LogStyle): UiLogger;
  event(
    name: EventName,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('event', name, args, style);
  }

  /**
   * Create a new child `Logger` instance, automatically selecting the
   * most appropriate log type ({@link hook}, {@link event}, {@link context},
   * {@link component}, {@link function}) for function-like identifiers,
   * based on the given {@link name}.
   */
  fn(name: string, style?: LogStyle): UiLogger;
  fn(name: string, args?: Primitive[], style?: LogStyle): UiLogger;
  fn(name: string, args?: LogStyle | Primitive[], style?: LogStyle): UiLogger {
    if (name.startsWith('use')) {
      return this.append('hook', name, args, style);
    }
    if (
      name.startsWith('on') ||
      name.startsWith('before') ||
      name.startsWith('after') ||
      name.startsWith('handle') ||
      nativeEventNames.includes(name as EventName) ||
      knownEventNames.includes(name as EventName)
    ) {
      return this.append('event', name, args, style);
    }
    if (/(Context|Provider)^/.test(name)) {
      return this.append('context', name, args, style);
    }
    if (/^[A-Z]/.test(name)) {
      return this.append('component', name, args, style);
    }
    return this.append('function', name, args, style);
  }

  /**
   * Create a new child `Logger` instance that will be used
   * to record changes to a React `useState()` value inside of a `useEffect()`
   * hook.
   *
   * @param name Name of the React `useState()` variable
   * (e.g., `"foo"` for `const [foo, setFoo] = useState('hello')`).
   */
  state(name: string, style?: LogStyle): UiLogger;
  state(name: string, args?: Primitive[], style?: LogStyle): UiLogger;
  state(
    name: string,
    args?: LogStyle | Primitive[],
    style?: LogStyle,
  ): UiLogger {
    return this.append('state', name, args, style);
  }

  /*
   * Write stuff to the Dev Tools console.
   */

  log(...data: unknown[]): this {
    this.writer(...this.args(...data));
    return this;
  }

  private args(...data: unknown[]): unknown[] {
    const hasStyle: boolean = this.prefixes.some((prefix) => prefix.style);
    const lastSignificantIndex: number =
      this.prefixes
        .map((prefix: Prefix, index: number): number =>
          lowPriorityPrefixNames.includes(prefix.name) ? -1 : index,
        )
        .filter((index: number): boolean => index > -1)
        .pop() ?? -1;

    const messages: string[] = [];
    const colors: Color[] = [];

    this.prefixes.forEach((prefix: Prefix, index: number) => {
      const { kind, name, args, style: requestedStyle } = prefix;
      const canHaveArgs =
        kind !== 'state' && kind !== 'file' && !name.includes('(');
      const hasArgs = canHaveArgs && Boolean(args);

      if (canHaveArgs) {
        messages.push(
          `%c${name}(${args ? `%c${JSON.stringify(args)}%c` : ''})%c`,
        );
      } else {
        messages.push(`%c${name}%c`);
      }

      const style =
        requestedStyle ??
        (hasStyle
          ? name === 'loadEntities' || name === 'reloadEntities'
            ? 'warn'
            : 'dim'
          : index === lastSignificantIndex
            ? 'bright'
            : 'dim');
      const color: Color = getColor(style);

      colors.push(color);
      if (hasArgs) {
        colors.push('');
        colors.push(color);
      }
      colors.push('GrayText');
    });

    return [
      messages.join(' - ').trim() + (data.length > 0 ? ':' : ''),
      ...colors
        .map((color: Color): FirefoxCssProperties => {
          return { color };
        })
        .map((cssProperties: FirefoxCssProperties): string => {
          return Object.entries(cssProperties)
            .map(([key, value]) => `${key}: ${value};`)
            .join(' ');
        }),
      ...data,
    ];
  }
}

type Upper =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L'
  | 'M'
  | 'N'
  | 'O'
  | 'P'
  | 'Q'
  | 'R'
  | 'S'
  | 'T'
  | 'U'
  | 'V'
  | 'W'
  | 'X'
  | 'Y'
  | 'Z';

type Lower =
  | 'a'
  | 'b'
  | 'c'
  | 'd'
  | 'e'
  | 'f'
  | 'g'
  | 'h'
  | 'i'
  | 'j'
  | 'k'
  | 'l'
  | 'm'
  | 'n'
  | 'o'
  | 'p'
  | 'q'
  | 'r'
  | 's'
  | 't'
  | 'u'
  | 'v'
  | 'w'
  | 'x'
  | 'y'
  | 'z';
