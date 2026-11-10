import { createRequire } from 'node:module';
import path from 'node:path';
import { defaultOptions as devServerDefaults } from '@hono/vite-dev-server';
import { lingui } from '@lingui/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import autoprefixer from 'autoprefixer';
import serverAdapter from 'hono-react-router-adapter/vite';
import type { AppLoadContext } from 'react-router';
import tailwindcss from 'tailwindcss';
import { defineConfig, normalizePath } from 'vite';
import macrosPlugin from 'vite-plugin-babel-macros';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tsconfigPaths from 'vite-tsconfig-paths';

const require = createRequire(import.meta.url);

const pdfjsDistPath = path.dirname(require.resolve('pdfjs-dist/package.json'));
const cMapsDir = normalizePath(path.join(pdfjsDistPath, 'cmaps'));

export default defineConfig({
  base: process.env.NEXT_PUBLIC_BASE_PATH ? process.env.NEXT_PUBLIC_BASE_PATH.replace(/\/$/, '') : '/',
  css: {
    postcss: {
      plugins: [tailwindcss, autoprefixer],
    },
  },
  server: {
    port: parseInt(process.env.PORT || '3000', 10),
    strictPort: true,
  },
  plugins: [
    viteStaticCopy({
      targets: [
        {
          src: cMapsDir,
          dest: 'static',
        },
      ],
    }),
    reactRouter(),
    macrosPlugin(),
    lingui(),
    tsconfigPaths(),
    serverAdapter({
      entry: 'server/router.ts',
      getLoadContext: async () => {
        const { getLoadContext } = await import('./server/load-context');
        return getLoadContext() as unknown as AppLoadContext;
      },
      exclude: [
        ...devServerDefaults.exclude.map((pattern) =>
          pattern instanceof RegExp && pattern.source === '.*\\.css$' ? /^(?!\/api\/jobs\/board\/).*\.css$/ : pattern,
        ),
        '/assets/**',
        '/src/app/**',
        /\?(?:inline|url|no-inline|raw|import(?:&(?:inline|url|no-inline|raw)?)?)$/,
      ],
    }),
  ],
  ssr: {
    noExternal: ['react-dropzone', 'plausible-tracker', /@noble\//, /@scure\//],
    external: [
      '@napi-rs/canvas',
      '@node-rs/bcrypt',
      '@prisma/client',
      '@documenso/tailwind-config',
      'playwright',
      'playwright-core',
      '@playwright/browser-chromium',
      'pdfjs-dist',
      '@google-cloud/kms',
      '@google-cloud/secret-manager',
    ],
  },
  optimizeDeps: {
    entries: ['./app/**/*', '../../packages/ui/**/*', '../../packages/lib/**/*'],
    include: ['prop-types', 'file-selector', 'attr-accept', '@noble/ciphers', '@noble/hashes', '@scure/base'],
    exclude: [
      'node_modules',
      '@napi-rs/canvas',
      '@node-rs/bcrypt',
      'sharp',
      'playwright',
      'playwright-core',
      '@playwright/browser-chromium',
      'lightningcss',
      'fsevents',
    ],
  },
  resolve: {
    alias: [
      { find: /^@noble\/ciphers\/(.*)$/, replacement: '@noble/ciphers/$1.js' },
      { find: /^@noble\/hashes\/(.*)$/, replacement: '@noble/hashes/$1.js' },
      { find: 'https', replacement: 'node:https' },
      {
        find: '.prisma/client/default',
        replacement: path.resolve(__dirname, '../../node_modules/.prisma/client/default.js'),
      },
      {
        find: '.prisma/client/index-browser',
        replacement: path.resolve(__dirname, '../../node_modules/.prisma/client/index-browser.js'),
      },
      { find: 'canvas', replacement: path.resolve(__dirname, './app/types/empty-module.ts') },
    ],
  },
  build: {
    commonjsOptions: {
      exclude: [/@noble\//, /@scure\//],
    },
    rollupOptions: {
      external: [
        '@napi-rs/canvas',
        '@node-rs/bcrypt',
        '@aws-sdk/cloudfront-signer',
        '@google-cloud/kms',
        '@google-cloud/secret-manager',
        'nodemailer',
        /playwright/,
        '@playwright/browser-chromium',
        '@documenso/skia-canvas',
      ],
    },
  },
});
