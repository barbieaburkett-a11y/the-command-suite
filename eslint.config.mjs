import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(['.next/**', 'dist/**', 'out/**', 'build/**', '.local/**', '.deploy-python/**', 'package-stage-*/**', 'next-env.d.ts']),
  { rules: { '@next/next/no-html-link-for-pages': 'off' } },
]);

export default eslintConfig;
