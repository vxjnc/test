import angularPlugin from '@angular-eslint/eslint-plugin';
import angularTemplateParser from '@angular-eslint/template-parser';
import eslint from '@eslint/js';
import { default as stylisticPlugin } from '@stylistic/eslint-plugin';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import globals from 'globals';


export default defineConfig([
    eslint.configs.recommended,
    {
        ignores: ['.cache/', '.git/', '.github/', 'node_modules/', 'dist/']
    },

    // Общие правила
    {
        plugins: {
            '@stylistic': stylisticPlugin
        },
        rules: {
            'brace-style': 'off',
            '@stylistic/brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
            '@stylistic/quotes': ['error', 'single'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/max-len': [
                'warn',
                {
                    code: 120,
                    ignoreUrls: true,
                    ignoreTemplateLiterals: true,
                    ignoreRegExpLiterals: true,
                    ignoreStrings: true
                }
            ],
        }
    },

    // TypeScript конфигурация
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser, // Исправлено: используем явно импортированный парсер
            parserOptions: {
                project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.spec.json'], // Все конфиги
                tsconfigRootDir: import.meta.dirname, // Важно для монопакетов
                ecmaVersion: 'latest',
                sourceType: 'module',
                warnOnUnsupportedTypeScriptVersion: false
            },
            globals: {
				...globals.browser
			},
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            '@angular-eslint': angularPlugin,
            '@stylistic': stylisticPlugin,
            // 'rxjs': rxjsPlugin,
        },
        rules: {
            ...tsPlugin.configs.strict.rules,
            ...tsPlugin.configs['strict-type-checked'].style,
            '@stylistic/indent': ['error', 4],
            '@stylistic/no-extra-parens': ['error', 'all'],
            
            // ...angularPlugin.configs['strict-type-checked'].rules,
            ...angularPlugin.configs.recommended.rules,

            // 'rxjs/finnish': ['error', {
            //     functions: false,
            //     methods: true,
            //     parameters: true,
            //     properties: true,
            //     types: true,
            //     variables: true,
            // }],

            // Angular правила
            '@angular-eslint/component-selector': [
                'warn',
                {
                    type: 'element',
                    prefix: '',
                    style: 'kebab-case'
                }
            ],

            // TypeScript правила
            '@typescript-eslint/no-unused-vars': 'warn',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/await-thenable': 'error'
        }
    },

    // HTML конфигурация
    {
        files: ['**/*.html'],
        languageOptions: {
            parser: angularTemplateParser,
            globals: {
                ...globals.browser,
                ...globals.node
            }
        },
        plugins: {
            '@angular-eslint': angularPlugin,
        },
        rules: {
            ...angularPlugin.configs.recommended.rules,
        }
    }
]);