/* eslint-disable @typescript-eslint/no-unused-vars */

import type { Plugin } from '@eslint/core';
import eslint from '@eslint/js';
import eslintReact from '@eslint-react/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import type { Config as ESLintConfig } from 'eslint/config';
import { defineConfig } from 'eslint/config';
import type {
  ESLintRules,
  ValidNoRestrictedImportPatternOptions,
} from 'eslint/rules';
import prettierConfig from 'eslint-config-prettier';
import commandPlugin from 'eslint-plugin-command';
import eslintReactHooks from 'eslint-plugin-react-hooks';
import simpleImportSortPlugin from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import tsESLint from 'typescript-eslint';

import type { CustomESLintConfigObjects, TSLintRuleMap } from './eslint-types';

const ext = `{ts,cts,mts,tsx,js,cjs,mjs}`;
const allFiles = [`**/*.${ext}`];
const rootFiles = [`*.${ext}`];
const reactFiles = [`src/**/*.tsx`];
const testFiles = [`src/**/*.test.${ext}`];

export default defineConfig([
  {
    ignores: [
      '**/.dependency-cruiser.cjs',
      '**/dist/**',
      '**/node_modules/**',
      '**/out/**',
      '**/release/**',
      '**/generated/**',
    ],
  },

  {
    settings: {
      react: {
        version: 'detect',
      },
    },

    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },

  eslint.configs.recommended,
  tsESLint.configs.strictTypeChecked,
  tsESLint.configs.stylisticTypeChecked,

  // eslintPluginReact.configs.flat.recommended ?? [],
  // eslintPluginReact.configs.flat["jsx-runtime"] ?? [],

  eslintReactHooks.configs.flat.recommended,

  // ALL TypeScript files.
  {
    files: allFiles,

    plugins: {
      command: commandPlugin,
      'simple-import-sort': simpleImportSortPlugin,
      '@eslint-react': eslintReact,
      '@stylistic': stylistic,
    },

    rules: {
      '@typescript-eslint/array-type': [
        'warn',
        {
          default: 'array-simple',
        },
      ],

      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
        },
      ],

      '@typescript-eslint/dot-notation': [
        'error',
        {
          allowIndexSignaturePropertyAccess: true,
        },
      ],

      '@typescript-eslint/explicit-function-return-type': [
        'error',
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
        },
      ],

      '@typescript-eslint/no-floating-promises': [
        'warn',
        {
          ignoreVoid: true,
        },
      ],

      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],

      '@typescript-eslint/no-empty-function': [
        'error',
        {
          allow: [],
        },
        // TODO(acdvorak): Figure out why IntelliSense fails without explicit
        // `satisfies`.
      ] satisfies TSLintRuleMap['@typescript-eslint/no-empty-function'],

      '@typescript-eslint/restrict-template-expressions': [
        'warn',
        {
          allowBoolean: true,
          allowNumber: true,
          allowRegExp: true,
          allowNullish: true,
        },
        // TODO(acdvorak): Figure out why IntelliSense fails without explicit
        // `satisfies`.
      ] satisfies TSLintRuleMap['@typescript-eslint/restrict-template-expressions'],

      '@typescript-eslint/consistent-type-exports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unnecessary-condition': 'warn',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',

      'command/command': 'error',

      // Replaced by @typescript-eslint/no-empty-function
      'no-empty-function': 'off',

      // Replaced by @typescript-eslint/no-shadow
      'no-shadow': 'off',

      // Prohibit redundant renaming in imports, exports, and destructuring
      'no-useless-rename': 'error',

      // Require shorthand syntax in object literals
      'object-shorthand': 'error',

      'no-console': ['off', { allow: ['warn', 'error'] }],

      'simple-import-sort/exports': 'error',

      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            // Node.js built-in modules first
            ['^node:', '^\\u0000'],
            // React
            [
              '^react$',
              '^react',
              '^@mui/material',
              '^@mui/system',
              '^@mui/icons-material',
              'lucide-react',
            ],
            // External packages
            ['^@?[\\w-]'],
            // Internal packages (#foo imports)
            ['^@/'],
            ['^#public/'],
            // Parent imports (../)
            ['^\\.\\.(?!/?$)', '^\\.\\./?$'],
            // Sibling imports (./)
            ['^\\./(?=.*/)(?!/?$)', '^\\.(?!/?$)', '^\\./?$'],
            // Images
            ['.+[.](svg|png|gif|jpg|jpeg)$'],
          ],
        },
      ],

      '@stylistic/indent': ['error', 2],
    },
  },

  {
    files: allFiles,
    ignores: rootFiles,

    rules: {
      // "import/no-default-export": "error",
    },
  },

  {
    files: reactFiles,

    rules: {
      // "react/boolean-prop-naming": "error",
      // "react/display-name": "off",
      // "react/forward-ref-uses-ref": "error",
      // "react/prop-types": "off",
      // "react/react-in-jsx-scope": "off",
      // "react/self-closing-comp": "error",
      // '@eslint-react/dom-no-missing-button-type': 'error',

      // Replaces usage of 'forwardRef' with passing 'ref' as a prop.
      // In React 19, forwardRef is no longer necessary, and will be deprecated
      // in a future release.
      '@eslint-react/no-forward-ref': 'error',

      // Enforces correct usage of 'useState', including destructuring,
      // symmetric naming of the value and setter, and wrapping expensive
      // initializers in a lazy initializer function.
      '@eslint-react/use-state': 'error',

      // '@eslint-react/prop-types': 'error',

      'react-hooks/exhaustive-deps': [
        'error',
        {
          requireExplicitEffectDeps: true,
        },
      ],
    },
  },

  {
    files: [
      'DISABLED/**/*primitives.ts',
      'DISABLED/**/*Primitives.ts',
      'DISABLED/**/primitives.ts',
      'DISABLED/**/Primitives.ts',
      'DISABLED/**/*types.ts',
      'DISABLED/**/*Types.ts',
      'DISABLED/**/types.ts',
      'DISABLED/**/Types.ts',
      'DISABLED/types/**/*.ts',
    ],

    rules: {
      // forbid exporting any value declarations (functions, const, enums, etc.)
      'no-restricted-syntax': [
        'error',
        // prohibit importing values into types-only files
        {
          selector:
            "ImportDeclaration[importKind!='type'][specifiers.length=0]",
          message:
            'types files may only import types; side-effect imports are not allowed.',
        },
        {
          selector:
            "ImportDeclaration[importKind!='type'] ImportNamespaceSpecifier",
          message:
            'types files may only import types; use import type or move value imports elsewhere.',
        },
        {
          selector:
            "ImportDeclaration[importKind!='type'] ImportDefaultSpecifier",
          message:
            'types files may only import types; use import type or move value imports elsewhere.',
        },
        {
          selector:
            "ImportDeclaration[importKind!='type'] ImportSpecifier:not([importKind='type']):not([imported.name=/Enum$/i]):not([local.name=/Enum$/i])",
          message:
            'types files may only import types or enums; use import type or move value imports elsewhere.',
        },
        // default export of anything
        {
          selector: 'ExportDefaultDeclaration',
          message: 'types files may only export types',
        },
        // export * from './foo'
        {
          selector: 'ExportAllDeclaration',
          message: 'types files may only export types',
        },
        // export const/let/var/class/function or non-type declarations
        {
          selector:
            'ExportNamedDeclaration[declaration!=null][declaration.type!=' +
            "'TSTypeAliasDeclaration'][declaration.type!=" +
            "'TSInterfaceDeclaration'][declaration.type!='TSEnumDeclaration']" +
            "[declaration.type!='ClassDeclaration']",
          message:
            'types files may only export type aliases, interfaces, enums, or classes',
        },
        // export { Foo } from './bar' or export { Foo };
        {
          selector:
            "ExportNamedDeclaration[specifiers.length>0][exportKind!='type'] ExportSpecifier:not([exported.name=/Enum$/i]):not([local.name=/Enum$/i])",
          message: 'types files may only re-export types or enums',
        },
      ],
    },
  },

  // Unit tests
  {
    files: testFiles,

    rules: {
      'no-restricted-syntax': [
        'error',
        {
          // Prohibit `if` statements inside test blocks (it/test)
          selector:
            'CallExpression[callee.name=/^(it|test)$/] IfStatement, ' +
            'CallExpression[callee.object.name=/^(it|test)$/] IfStatement',
          message:
            'Do not use if statements inside test blocks. ' +
            'Split conditional logic into separate test cases instead.',
        },
        {
          // Prohibit `try` statements inside test blocks (it/test)
          selector:
            'CallExpression[callee.name=/^(it|test)$/] TryStatement, ' +
            'CallExpression[callee.object.name=/^(it|test)$/] TryStatement',
          message:
            'Do not use try statements inside test blocks. ' +
            'Use expect(...).toThrow() or similar assertion methods instead.',
        },
      ],
    },
  },

  prettierConfig,

  // Re-enable curly rule after prettier config
  // (prettier disables it by default).
  //
  // ⚠️ MUST BE LAST IN THE LIST!
  {
    files: allFiles,
    rules: {
      curly: ['error', 'all'],
    },
  },
] satisfies CustomESLintConfigObjects);
