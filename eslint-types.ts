/* eslint-disable @typescript-eslint/consistent-type-imports */

import type {
  ConfigObject,
  Plugin as ESPlugin,
  RuleConfig,
} from '@eslint/core';
import type TSESTree from '@typescript-eslint/typescript-estree';
import type { RuleModule as TSRuleModule } from '@typescript-eslint/utils/ts-eslint';
import type { Linter as ESLinter } from 'eslint';
import type { ESLintRules } from 'eslint/rules';
import type { PluginSettings as ImportPluginSettings } from 'eslint-import-context';
import type {
  EmptyObject,
  IntClosedRange as Int,
  OmitIndexSignature,
} from 'type-fest';

import type { CompatibleConfigArray } from './node_modules/typescript-eslint/dist/compatibility-types';

/**
 * Defines a specific restriction zone within the ESLint configuration.
 *
 * @module `import/no-restricted-paths`
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md
 */
export interface ImportNoRestrictedPathsZone {
  /**
   * The path(s) that are restricted from being imported FROM.
   * Can be a single glob pattern string or an array of glob pattern strings.
   */
  from: string | string[];

  /**
   * The path(s) that are restricted from being imported INTO.
   * Can be a single glob pattern string or an array of glob pattern strings.
   */
  target: string | string[];

  /**
   * An optional array of glob patterns for paths that are exempt from this restriction,
   * even if they match the 'from' and 'target' criteria.
   */
  except?: string[];

  /**
   * An optional message to display when the restriction is violated.
   */
  message?: string;
}

/**
 * The configuration object for the 'no-restricted-paths' rule.
 * This corresponds to the single item in the ESLint rule's options array.
 *
 * @module `import/no-restricted-paths`
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-restricted-paths.md
 */
export interface ImportNoRestrictedPathsOptions {
  /**
   * An array of restriction zone objects, where each object defines a
   * 'from' path(s) that cannot import into a 'target' path(s).
   */
  zones: ImportNoRestrictedPathsZone[];

  /**
   * An optional base path to which all relative paths in 'from', 'target', and 'except'
   * are resolved.
   */
  basePath?: string;
}

/**
 * Enforces having one or more empty lines after the last top-level `import`
 * statement or `require` call.
 *
 * @module `import/newline-after-import`
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/newline-after-import.md
 */
export interface ImportNewlineAfterImportOptions {
  /**
   * Sets the number of newlines that are enforced after the last top-level
   * `import` statement or `require` call.
   *
   * @default 1
   */
  count?: number;

  /**
   * Enforce the exact numbers of newlines that is mentioned in count.
   *
   * @default false
   */
  exactCount?: boolean;

  /**
   * Enforces the rule on comments after the last import statement as well.
   *
   * @default false
   */
  considerComments?: boolean;
}

/**
 * Forbid a module from importing a module with a dependency path back to itself.
 *
 * @module `import/no-cycle`
 * @see https://github.com/import-js/eslint-plugin-import/blob/main/docs/rules/no-cycle.md
 */
export interface ImportNoCycleOptions {
  /**
   * Maximum dependency depth to traverse.
   */
  maxDepth?: Int<1, 100> | '∞';

  /**
   * Ignore external modules.
   *
   * @default false
   */
  ignoreExternal?: boolean;

  /**
   * Allow cyclic dependency if there is at least one dynamic import in the chain.
   *
   * @default false
   */
  allowUnsafeDynamicCyclicDependency?: boolean;

  /**
   * When true, don't calculate a strongly-connected-components graph.
   *
   * SCC is used to reduce the time-complexity of cycle detection,
   * but adds overhead.
   *
   * @default false
   */
  disableScc?: boolean;
}

/**
 * @module `simple-import-sort/imports`
 * @module `simple-import-sort/exports`
 * @see https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file#sort-order
 */
export interface SimpleImportSortImportsOptions {
  /**
   * Each string is a regex (with the `u` flag).
   *
   * The regexes decide which imports go where.
   *
   * ⚠️ Remember to escape backslashes it's `"\\w"`, not `"\w"`, for example.
   *
   * - The inner arrays are joined with one newline.
   * - The outer arrays are joined with two newlines, creating a blank line.
   *
   * That's why there are two levels of arrays: it lets you choose where to have
   * blank lines.
   *
   * @see https://github.com/lydell/eslint-plugin-simple-import-sort?tab=readme-ov-file#custom-grouping
   */
  groups: string[][];
}

/**
 * @module `react-hooks/exhaustive-deps`
 * @see https://react.dev/reference/eslint-plugin-react-hooks/lints/exhaustive-deps
 */
export interface ReactHooksExhaustiveDepsOptions {
  /**
   * Regex string to match the names of custom Hooks that have dependencies.
   *
   * ⚠️ Use this option very sparingly, if at all. Generally speaking, most
   * custom Hooks should **not** use the dependencies argument, and instead
   * provide a higher-level API that is more focused around a specific use case.
   *
   * @example "(useMyCustomHook|useMyOtherCustomHook)"
   */
  additionalHooks?: string;

  /**
   * Require that an explicit value be passed to the `deps` argument of
   * `useEffect()`, `useLayoutEffect()`, etc.
   *
   * - If a hook should only run *once*, on the first render, pass an empty
   *   dependency array (`[]`).
   * - If a hook should run on *every* render, pass `undefined`.
   *
   * @default false
   */
  requireExplicitEffectDeps: boolean;
}

/**
 * @module `react-refresh/only-export-components`
 * @see https://github.com/ArnaudBarre/eslint-plugin-react-refresh
 */
export interface ReactRefreshOnlyExportComponentsOptions {
  /**
   * If you use a framework that handles HMR of some specific exports,
   * you can use this option to avoid warning for them.
   *
   * @example
   * ```json
   * {
   *   "react-refresh/only-export-components": [
   *     "error",
   *     { "allowExportNames": ["meta", "links", "headers", "loader", "action"] }
   *   ]
   * }
   * ```
   */
  allowExportNames?: string[];

  /**
   * Don't warn when a constant (string, number, boolean, templateLiteral) is
   * exported aside one or more components.
   *
   * This should be enabled if the fast refresh implementation correctly handles
   * this case (HMR when the constant doesn't change, propagate update to
   * importers when the constant changes.). Vite supports it.
   *
   * Enabling this option allows code such as the following:
   *
   * ```ts
   * export const CONSTANT = 3;
   * export const Foo = () => <></>;
   * ```
   *
   * @default false // (true in vite config)
   */
  allowConstantExport?: boolean;

  /**
   * If you're exporting a component wrapped in a custom HOC, you can use this
   * option to avoid false positives.
   *
   * @example
   * ```json
   * {
   *   "react-refresh/only-export-components": [
   *     "error",
   *     { "customHOCs": ["observer", "withAuth"] }
   *   ]
   * }
   * ```
   */
  customHOCs?: string[];

  /**
   * If you're using JSX inside `.js` files (which I don't recommend because it
   * forces you to configure every tool you use to switch the parser), you can
   * still use the plugin by enabling this option. To reduce the number of false
   * positives, only files importing react are checked.
   *
   * @default false
   */
  checkJS?: boolean;
}

////////////////////////////////////////////////////////////////////////////////

type ESLintRuleName = keyof OmitIndexSignature<ESLintRules>;
type ESLintRuleMap = {
  [K in ESLintRuleName]: ESLintRules[K];
};

type ESLintRuleEntryOptions<T> =
  T extends ESLinter.RuleEntry<[Partial<infer O>]>
    ? { [K in keyof O]?: O[K] }
    : never;

type ExtractAllowArrayElement<T> =
  T extends ESLinter.RuleEntry<[Partial<infer O>]>
    ? O extends { allow?: ReadonlyArray<infer E> }
      ? E
      : never
    : never;

type ESNoEmptyFunctionAllowKind = ExtractAllowArrayElement<
  ESLintRules['no-empty-function']
>;

////////////////////////////////////////////////////////////////////////////////

type TSLintRules =
  typeof import('./node_modules/@typescript-eslint/eslint-plugin/dist/rules/index');

type TSLintRuleName = keyof TSLintRules;

type TSLintRuleOptionsFor<TOpts> =
  TOpts extends TSRuleModule<string, infer T extends readonly unknown[]>
    ? T
    : never;

type TSRuleConfig<K extends TSLintRuleName> = RuleConfig<
  TSLintRuleOptionsFor<TSLintRules[K]>
>;

type TSNoEmptyFunctionAllowKind =
  | 'private-constructors'
  | 'protected-constructors'
  | 'decoratedFunctions'
  | 'overrideMethods';

type ESNoEmptyFunctionOptions = ESLintRuleEntryOptions<
  ESLintRules['no-empty-function']
>;

type TSNoEmptyFunctionOptions = Omit<ESNoEmptyFunctionOptions, 'allow'> & {
  allow?: Array<ESNoEmptyFunctionAllowKind | TSNoEmptyFunctionAllowKind>;
};

export type TSLintRuleMap = {
  [
    K in `@typescript-eslint/${TSLintRuleName}`
  ]: K extends `@typescript-eslint/${infer R}`
    ? 'no-empty-function' extends R
      ? RuleConfig<[TSNoEmptyFunctionOptions]>
      : TSRuleConfig<R & TSLintRuleName>
    : never;
};

////////////////////////////////////////////////////////////////////////////////

interface SimpleImportSortRuleMap {
  'simple-import-sort/imports': RuleConfig<[SimpleImportSortImportsOptions]>;
  'simple-import-sort/exports': RuleConfig<[SimpleImportSortImportsOptions]>;
}

////////////////////////////////////////////////////////////////////////////////

export interface CommandRuleMap {
  'command/command': RuleConfig<never[]>;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * @see https://eslint-react.xyz/docs/rules
 */
type ReactRuleName =
  | '@eslint-react/error-boundaries'
  | '@eslint-react/exhaustive-deps'
  | '@eslint-react/globals'
  | '@eslint-react/immutability'
  | '@eslint-react/no-access-state-in-setstate'
  | '@eslint-react/no-array-index-key'
  | '@eslint-react/no-children-count'
  | '@eslint-react/no-children-for-each'
  | '@eslint-react/no-children-map'
  | '@eslint-react/no-children-only'
  | '@eslint-react/no-children-to-array'
  | '@eslint-react/no-class-component'
  | '@eslint-react/no-clone-element'
  | '@eslint-react/no-component-will-mount'
  | '@eslint-react/no-component-will-receive-props'
  | '@eslint-react/no-component-will-update'
  | '@eslint-react/no-context-provider'
  | '@eslint-react/no-create-ref'
  | '@eslint-react/no-direct-mutation-state'
  | '@eslint-react/no-duplicate-key'
  | '@eslint-react/no-forward-ref'
  | '@eslint-react/no-implicit-children'
  | '@eslint-react/no-implicit-key'
  | '@eslint-react/no-implicit-ref'
  | '@eslint-react/no-leaked-conditional-rendering'
  | '@eslint-react/no-missing-component-display-name'
  | '@eslint-react/no-missing-context-display-name'
  | '@eslint-react/no-missing-key'
  | '@eslint-react/no-misused-capture-owner-stack'
  | '@eslint-react/no-nested-component-definitions'
  | '@eslint-react/no-nested-lazy-component-declarations'
  | '@eslint-react/no-set-state-in-component-did-mount'
  | '@eslint-react/no-set-state-in-component-did-update'
  | '@eslint-react/no-set-state-in-component-will-update'
  | '@eslint-react/no-unnecessary-use-prefix'
  | '@eslint-react/no-unsafe-component-will-mount'
  | '@eslint-react/no-unsafe-component-will-receive-props'
  | '@eslint-react/no-unsafe-component-will-update'
  | '@eslint-react/no-unstable-context-value'
  | '@eslint-react/no-unstable-default-props'
  | '@eslint-react/no-unused-class-component-members'
  | '@eslint-react/no-unused-props'
  | '@eslint-react/no-unused-state'
  | '@eslint-react/no-use-context'
  | '@eslint-react/purity'
  | '@eslint-react/refs'
  | '@eslint-react/rules-of-hooks'
  | '@eslint-react/set-state-in-effect'
  | '@eslint-react/set-state-in-render'
  | '@eslint-react/static-components'
  | '@eslint-react/unsupported-syntax'
  | '@eslint-react/use-memo'
  | '@eslint-react/use-state'
  | '@eslint-react/no-children-prop'
  | '@eslint-react/no-children-prop-with-children'
  | '@eslint-react/no-comment-textnodes'
  | '@eslint-react/no-key-after-spread'
  | '@eslint-react/no-leaked-dollar'
  | '@eslint-react/no-leaked-semicolon'
  | '@eslint-react/no-namespace'
  | '@eslint-react/no-useless-fragment'
  | '@eslint-react/function-definition'
  | '@eslint-react/no-dangerously-set-innerhtml'
  | '@eslint-react/no-dangerously-set-innerhtml-with-children'
  | '@eslint-react/no-find-dom-node'
  | '@eslint-react/no-flush-sync'
  | '@eslint-react/no-hydrate'
  | '@eslint-react/no-missing-button-type'
  | '@eslint-react/no-missing-iframe-sandbox'
  | '@eslint-react/no-render'
  | '@eslint-react/no-render-return-value'
  | '@eslint-react/no-script-url'
  | '@eslint-react/no-string-style-prop'
  | '@eslint-react/no-unknown-property'
  | '@eslint-react/no-unsafe-iframe-sandbox'
  | '@eslint-react/no-unsafe-target-blank'
  | '@eslint-react/no-use-form-state'
  | '@eslint-react/no-void-elements-with-children'
  | '@eslint-react/no-leaked-event-listener'
  | '@eslint-react/no-leaked-fetch'
  | '@eslint-react/no-leaked-interval'
  | '@eslint-react/no-leaked-resize-observer'
  | '@eslint-react/no-leaked-timeout'
  | '@eslint-react/context-name'
  | '@eslint-react/id-name'
  | '@eslint-react/ref-name'
  | '@eslint-react/function-component'
  | '@eslint-react/hook'
  | '@eslint-react/is-from-react'
  | '@eslint-react/is-from-ref'
  | '@eslint-react/jsx';

// TODO(acdvorak): Extract option types
type ReactRuleMap = Record<ReactRuleName, RuleConfig<[EmptyObject]>>;

////////////////////////////////////////////////////////////////////////////////

interface ReactHookRuleMap {
  'react-hooks/component-hook-factories': RuleConfig<[EmptyObject]>;

  'react-hooks/exhaustive-deps': RuleConfig<
    | [EmptyObject]
    | [
        {
          /**
           * Regex string for hooks that should be checked for exhaustive dependencies.
           *
           * @example "(useMyCustomHook|useAnotherHook)"
           */
          additionalHooks?: string;

          requireExplicitEffectDeps?: boolean;
        },
      ]
  >;
}

////////////////////////////////////////////////////////////////////////////////

/**
 * @see https://eslint-react.xyz/docs/rules
 */
type StylisticRuleOptions = import('@stylistic/eslint-plugin').RuleOptions;

type StylisticRuleMap = {
  [K in keyof StylisticRuleOptions]: RuleConfig<
    [EmptyObject] | StylisticRuleOptions[K]
  >;
};

////////////////////////////////////////////////////////////////////////////////

export type AllRulesMap = Partial<
  | ESLintRuleMap
  | TSLintRuleMap
  | SimpleImportSortRuleMap
  | CommandRuleMap
  | ReactRuleMap
  | ReactHookRuleMap
  | StylisticRuleMap
>;

////////////////////////////////////////////////////////////////////////////////

export type TSLanguageOptions = ESLinter.LanguageOptions & {
  parserOptions?: TSESTree.TSESTreeOptions;
};

export interface CustomESLintConfigObject extends ConfigObject<AllRulesMap> {
  languageOptions?: TSLanguageOptions;

  // @keep-sorted
  plugins?: {
    '@eslint-react'?: ESPlugin;
    '@stylistic'?: ESPlugin;
    'react-hooks'?: ESPlugin;
    'simple-import-sort'?: ESPlugin;
    command?: ESPlugin;
    import?: ESPlugin;
  };

  settings?: ImportPluginSettings & {
    react?: {
      version: 'detect';
    };
    'import-x/parsers'?: {
      '@typescript-eslint/parser': Array<`.${string}`>;
    };
  };
}

export type CustomESLintConfigObjects = Array<
  CustomESLintConfigObject | CompatibleConfigArray
>;
