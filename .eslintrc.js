module.exports = {
    parser: '@typescript-eslint/parser',
    extends: [
        'plugin:@typescript-eslint/recommended',
        'prettier/@typescript-eslint',
        'plugin:prettier/recommended', // has to be last (see https://github.com/prettier/eslint-plugin-prettier)
    ],
    parserOptions: {
        ecmaFeatures: {
            jsx: true,
        },
        ecmaVersion: 2018,
        sourceType: 'module',
    },
    rules: {
        semi: 'off',
        '@typescript-eslint/no-namespace': 0,
        '@typescript-eslint/semi': 0,
        '@typescript-eslint/member-delimiter-style': 0,
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/no-use-before-define': 0,
        '@typescript-eslint/explicit-function-return-type': ['error', { allowHigherOrderFunctions: true, allowExpressions: true }],
        'prettier/prettier': [
            'error',
            {
                tabWidth: 4,
                singleQuote: true,
                semi: false,
                printWidth: 140,
            },
        ],
    },
    settings: {
        react: {
            version: 'detect',
        },
    },
}
