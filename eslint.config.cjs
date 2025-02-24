const buka = require('@buka/eslint-config')


module.exports = [
  {
    ignores: ['dist'],
  },
  ...buka.typescript.recommended,
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
    },
  },
]
