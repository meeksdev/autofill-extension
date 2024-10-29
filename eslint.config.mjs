import globals from 'globals';
import pluginJs from '@eslint/js';
// import pluginReact from 'eslint-plugin-react';

export default [
    {
        files: ['**/*.{js,mjs,cjs,jsx}'],
        // ignores: ['**/dist/*'],
        languageOptions: {
            globals: {
                ...globals.browser,
                chrome: 'readonly',
                require: 'readonly',
                process: 'readonly',
                module: 'readonly',
            },
            ecmaVersion: 2021,
            sourceType: 'module',
        },
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'error',
            'no-constant-binary-expression': 'warn',
            'no-useless-escape': 'warn',
        },
    },
    pluginJs.configs.recommended,
    // pluginReact.configs.flat.recommended,
];
