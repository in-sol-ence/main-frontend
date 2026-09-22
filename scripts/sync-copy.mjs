import { cp, rm } from 'node:fs/promises'

// copy/ holds all visitor-facing wording. The landing script is served straight
// from dist/, so it reads this generated copy; never edit dist/copy/ in place.
const root = new URL('../', import.meta.url)
const destination = new URL('dist/copy/', root)
await rm(destination, { recursive: true, force: true })
await cp(new URL('copy/', root), destination, { recursive: true, filter: source => !source.endsWith('README.md') })
console.log('Synced copy/ to dist/copy/')
