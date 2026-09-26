import { cp, rm, readFile, writeFile } from 'node:fs/promises'

import { deviceNotice } from '../copy/device-notice.js'

// copy/ holds all visitor-facing wording. The landing script is served straight
// from dist/, so it reads this generated copy; never edit dist/copy/ in place.
const root = new URL('../', import.meta.url)
const destination = new URL('dist/copy/', root)
await rm(destination, { recursive: true, force: true })
await cp(new URL('copy/', root), destination, { recursive: true, filter: source => !source.endsWith('README.md') })
console.log('Synced copy/ to dist/copy/')

// Render the notice at build time so it is readable before JavaScript loads.
const escaped = Object.fromEntries(Object.entries(deviceNotice).map(([key, value]) =>
  [key, value.replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])]))
for (const path of ['dist/index.html', 'dist/learn/index.html']) {
  const file = new URL(path, root)
  const html = await readFile(file, 'utf8')
  const notice = `<aside id="device-notice" aria-labelledby="device-notice-title">
    <div>
      <h2 id="device-notice-title">${escaped.title}</h2>
      <p>${escaped.message}</p>
    </div>
  </aside>`
  await writeFile(file, html.replace(/<!-- device-notice:start -->[\s\S]*?<!-- device-notice:end -->/,
    `<!-- device-notice:start -->\n  ${notice}\n  <!-- device-notice:end -->`))
}
