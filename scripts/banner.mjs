// Rebuilds assets/banner-light.svg and assets/banner-dark.svg: node scripts/banner.mjs
import { writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

const OUT = join(dirname(new URL(import.meta.url).pathname), '..', 'assets')
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const C = {
  orange: '#FF5A1F', ink: '#0C2236', slate: '#213B54', muted: '#506A83', faint: '#93A8BC',
  paper: '#F5F9FD', rule: '#DDE8F3', stroke: '#C6D7E7', blue: '#0B6BCB', cyan: '#36C6E0',
  body: '#3b7cc0', body2: '#285a8c', bubble: '#C6D8EC'
}

// Google Fonts subsets a face to the given characters, so each SVG carries only the glyphs it draws.
async function face (family, weight, text) {
  const chars = [...new Set(text)].join('')
  const url = `https://fonts.googleapis.com/css2?family=${family.replace(/ /g, '+')}:wght@${weight}&text=${encodeURIComponent(chars)}`
  const css = await (await fetch(url, { headers: { 'User-Agent': UA } })).text()
  const src = css.match(/url\((https:[^)]+)\)/)?.[1]
  if (!src) throw new Error(`no font for ${family} ${weight}: ${css.slice(0, 200)}`)
  const buf = Buffer.from(await (await fetch(src, { headers: { 'User-Agent': UA } })).arrayBuffer())
  return `@font-face{font-family:'${family}';font-weight:${weight};src:url(data:font/woff2;base64,${buf.toString('base64')}) format('woff2')}`
}

// The robot from ivebotunac.com (app/game/robot.ts), one rect per cell run, happy face.
function robot (ox, oy, s, { screen = C.ink, eye = C.orange, cls = 'bot' } = {}) {
  const r = (x, y, w, h, fill, extra = '') => `<rect x="${ox + x * s}" y="${oy + y * s}" width="${w * s}" height="${h * s}" fill="${fill}"${extra}/>`
  return `<g class="${cls}">
${r(3, 8, 1, 3, C.body2)}${r(12, 8, 1, 3, C.body2)}
${r(5, 12, 2, 2, C.body2)}${r(9, 12, 2, 2, C.body2)}
${r(5, 8, 6, 4, C.body)}${r(7, 9, 2, 1, eye)}
${r(4, 3, 8, 5, C.body)}${r(5, 4, 6, 3, screen)}
<g class="eyes">${r(6, 4, 1, 2, eye)}${r(9, 4, 1, 2, eye)}${r(7, 6, 2, 1, eye)}</g>
<g class="blink">${r(6, 6, 1, 1, eye)}${r(9, 6, 1, 1, eye)}</g>
${r(8, 1, 1, 2, C.body2)}${r(7, 0, 2, 1, eye, ' class="antenna"')}
</g>`
}

// Shared motion: a blink every few seconds, the antenna light pulsing, all off under reduced motion.
const ROBOT_CSS = `
.blink{opacity:0}
.eyes{animation:eyes 4.2s steps(1) infinite}
.blink{animation:blink 4.2s steps(1) infinite}
.antenna{animation:ant 1s steps(1) infinite}
.bot{animation:hop 2.4s steps(1) infinite}
@keyframes eyes{0%,92%{opacity:1}93%,97%{opacity:0}98%{opacity:1}}
@keyframes blink{0%,92%{opacity:0}93%,97%{opacity:1}98%{opacity:0}}
@keyframes ant{0%,66%{fill:${C.orange}}67%,100%{fill:#9c5a3a}}
@keyframes hop{0%,49%{transform:translateY(0)}50%,100%{transform:translateY(-4px)}}
@media (prefers-reduced-motion:reduce){.eyes,.blink,.antenna,.bot,.cursor,.ln{animation:none!important}.blink{opacity:0}}`

// Blueprint banner, light and dark.
async function bannerA (dark) {
  const p = dark
    ? { bg: C.ink, grid: '#15304A', major: '#1C3B58', name: C.paper, sub: C.stroke, eyebrow: '#5AA9F0', faint: '#6F8AA4', tick: '#2B4C6B',
        chip: '#132F48', chipStroke: '#2A4A68', chipText: C.stroke, hot: '#3A2219', hotStroke: '#852B07', hotText: '#FF8A5C', url: '#5AA9F0' }
    : { bg: C.paper, grid: '#E6EEF7', major: C.rule, name: C.ink, sub: C.slate, eyebrow: C.blue, faint: C.faint, tick: C.stroke,
        chip: '#EDF3FA', chipStroke: C.stroke, chipText: C.blue, hot: '#FFF3EE', hotStroke: '#FFC4AA', hotText: '#BF3F0B', url: C.blue }
  const name = 'Ive Botunac'
  const eyebrow = 'PHD IN AI · ASST. PROF. · ZADAR, CROATIA'
  const sub = 'AI Research Engineer, Founder and Assistant Professor'
  const chips = ['Agentic AI', 'Deep RL', 'Research', 'Teaching']
  const url = 'ivebotunac.com'
  const fonts = [
    await face('Space Mono', 700, name),
    await face('IBM Plex Mono', 400, sub + url),
    await face('IBM Plex Mono', 500, eyebrow + chips.join(''))
  ].join('')
  const X = 392
  const nameW = name.length * 0.612 * 80
  let cx = X
  const chipSvg = chips.map((t, i) => {
    const w = Math.round(t.length * 9 + 32)
    const hot = i === 0
    const g = `<rect x="${cx}" y="276" width="${w}" height="34" rx="17" fill="${hot ? p.hot : p.chip}" stroke="${hot ? p.hotStroke : p.chipStroke}"/><text x="${cx + w / 2}" y="298" text-anchor="middle" class="chip" fill="${hot ? p.hotText : p.chipText}">${t}</text>`
    cx += w + 10
    return g
  }).join('')
  // Corner ticks frame the robot like a figure on a drawing sheet.
  const f = { x: 72, y: 50, s: 256 }
  const tick = (x, y, dx, dy) => `<path d="M${x} ${y + dy * 18}V${y}H${x + dx * 18}" fill="none" stroke="${p.tick}" stroke-width="2"/>`
  return `<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" viewBox="0 0 1200 380" width="1200" height="380" role="img" aria-label="Ive Botunac, PhD. AI Research Engineer, Founder and Assistant Professor.">
<style>${fonts}
.name{font:700 80px 'Space Mono',ui-monospace,Menlo,monospace}
.eyebrow{font:500 15px 'IBM Plex Mono',ui-monospace,Menlo,monospace;letter-spacing:2px}
.sub{font:400 22px 'IBM Plex Mono',ui-monospace,Menlo,monospace}
.chip{font:500 15px 'IBM Plex Mono',ui-monospace,Menlo,monospace}
.url{font:400 18px 'IBM Plex Mono',ui-monospace,Menlo,monospace}
.cursor{animation:cur 1.1s steps(1) infinite}
@keyframes cur{0%,55%{opacity:1}56%,100%{opacity:0}}
${ROBOT_CSS}</style>
<defs>
<pattern id="g" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M24 0H0V24" fill="none" stroke="${p.grid}" stroke-width="1"/></pattern>
<pattern id="G" width="120" height="120" patternUnits="userSpaceOnUse"><path d="M120 0H0V120" fill="none" stroke="${p.major}" stroke-width="1"/></pattern>
</defs>
<rect width="1200" height="380" fill="${p.bg}"/>
<rect width="1200" height="380" fill="url(#g)"/>
<rect width="1200" height="380" fill="url(#G)"/>
${tick(f.x, f.y, 1, 1)}${tick(f.x + f.s, f.y, -1, 1)}${tick(f.x, f.y + f.s, 1, -1)}${tick(f.x + f.s, f.y + f.s, -1, -1)}
${robot(f.x + 128 - 8 * 16, f.y + 128 - 7 * 16, 16)}
<text x="${X}" y="112" class="eyebrow" fill="${p.eyebrow}">${eyebrow}</text>
<text x="${X - 4}" y="190" class="name" fill="${p.name}">${name}</text>
<rect class="cursor" x="${Math.round(X + nameW + 8)}" y="134" width="22" height="62" fill="${C.orange}"/>
<text x="${X}" y="242" class="sub" fill="${p.sub}">${sub}</text>
${chipSvg}
<text x="1128" y="${f.y + f.s + 30}" text-anchor="end" class="url" fill="${p.url}">${url}</text>
</svg>`
}


writeFileSync(join(OUT, 'banner-light.svg'), await bannerA(false))
writeFileSync(join(OUT, 'banner-dark.svg'), await bannerA(true))
