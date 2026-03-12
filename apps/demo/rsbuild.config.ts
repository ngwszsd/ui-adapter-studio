import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { resolve } from 'path';
import { pluginSass } from '@rsbuild/plugin-sass';
import { pluginSvgr } from '@rsbuild/plugin-svgr';
import { pluginImageCompress } from '@rsbuild/plugin-image-compress';
import { pluginCssMinimizer } from '@rsbuild/plugin-css-minimizer';

const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';

export default defineConfig({
  output: {
    polyfill: 'usage',
    assetPrefix: isGitHubPages ? '/ui-adapter-studio/' : '/',
  },
  plugins: [
    pluginReact(),
    pluginSass(),
    pluginSvgr(),
    pluginImageCompress(),
    pluginCssMinimizer(),
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      src: resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 10001,
  },
  dev: {
    lazyCompilation: false,
  },
  performance: {
    chunkSplit: {
      strategy: 'split-by-experience',
    },
  },
  html: {
    template: './index.html',
  },
  source: {
    entry: {
      index: './src/main.tsx',
    },
  },
});
