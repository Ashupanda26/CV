// Turns dist-share/index.html (a full document) into the body-only page format
// used for the shareable demo link: title + fonts + inline CSS + root + inline JS.
import { readFileSync, writeFileSync } from 'node:fs'

const html = readFileSync('dist-share/index.html', 'utf8')
const styles = [...html.matchAll(/<style[^>]*>[\s\S]*?<\/style>/g)].map((m) => m[0])
const scripts = [...html.matchAll(/<script type="module"[^>]*>[\s\S]*?<\/script>/g)].map((m) => m[0])
if (!styles.length || !scripts.length) throw new Error('Expected inlined <style> and <script> in dist-share/index.html')

const page = [
  '<title>BlueStone Pools</title>',
  '<meta name="description" content="BlueStone Pools designs and builds bespoke residential swimming pools across the South East." />',
  '<link rel="preconnect" href="https://fonts.googleapis.com" />',
  '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  '<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />',
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join('\n')

writeFileSync('dist-share/bluestone-pools.html', page)
console.log(`dist-share/bluestone-pools.html  ${(page.length / 1024 / 1024).toFixed(2)} MB`)
