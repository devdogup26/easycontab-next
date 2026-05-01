import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Prisma seed uses require
    'prisma/seed.js',
    // E2E tests
    'e2e/**',
    // Test files
    'src/__tests__/**',
    // Filter tabs with query params - legitimate use
    'src/app/dashboard/obrigacoes/page.tsx',
  ]),
  // Treat no-explicit-any as warning (needed for NextAuth session user casting)
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
]);

export default eslintConfig;
