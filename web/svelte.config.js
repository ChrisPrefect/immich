import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import dotenv from 'dotenv';

dotenv.config({ quiet: true });

process.env.PUBLIC_IMMICH_BUY_HOST = process.env.PUBLIC_IMMICH_BUY_HOST || 'https://buy.immich.app';
process.env.PUBLIC_IMMICH_PAY_HOST = process.env.PUBLIC_IMMICH_PAY_HOST || 'https://pay.futo.org';

/** @type {import('@sveltejs/kit').Config} */
const config = {
  compilerOptions: {
    // TODO pending `@immich/ui` to enable it
    // runes: true,
  },
  preprocess: vitePreprocess(),
  kit: {
    paths: {
      relative: false,
    },
    adapter: adapter({
      fallback: 'index.html',
      precompress: true,
    }),
    csp: {
      mode: 'hash',
      directives: {
        'default-src': ['self'],
        'script-src': [
          'self',
          'https://www.gstatic.com',
          'wasm-unsafe-eval',
          'sha256-h5wSYKWbmHcoYTdkHNNguMswVNCphpvwW+uxooXhF/Y=',
        ],
        'style-src': ['self', 'unsafe-inline'],
        'img-src': ['self', 'data:', 'blob:'],
        'connect-src': [
          'self',
          'blob:',
          'https://pay.futo.org',
          'https://static.immich.cloud',
          'https://tiles.immich.cloud',
        ],
        'worker-src': ['self', 'blob:'],
        'frame-src': ['none'],
        'object-src': ['none'],
        'base-uri': ['self'],
      },
    },
    alias: {
      $lib: 'src/lib',
      '$lib/*': 'src/lib/*',
      $tests: 'src/../tests',
      '$tests/*': 'src/../tests/*',
      '@test-data': 'src/test-data',
      $i18n: '../i18n',
      'chromecast-caf-sender': './node_modules/@types/chromecast-caf-sender/index.d.ts',
    },
  },
};

export default config;
