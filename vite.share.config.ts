// Builds the whole site (public pages + admin demo) into ONE self-contained
// HTML file, for sharing as a link where external assets are blocked.
import { defineConfig, mergeConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import base from './vite.config'

export default mergeConfig(
  base,
  defineConfig({
    mode: 'artifact',
    plugins: [viteSingleFile()],
    build: { outDir: 'dist-share', assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 },
  }),
)
