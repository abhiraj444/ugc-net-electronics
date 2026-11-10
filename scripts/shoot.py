"""Screenshot pages of the static export. Usage: python3 scripts/shoot.py <name>=<path>[@width][#action] ...
Writes PNGs to screenshots/. Also reports horizontal overflow per page."""
import sys, os, asyncio
from playwright.async_api import async_playwright

BASE = os.environ.get('BASE', 'http://localhost:4173')
OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots')

async def main(specs):
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        for spec in specs:
            name, rest = spec.split('=', 1)
            action = None
            if '#' in rest:
                rest, action = rest.split('#', 1)
            width = 390
            if '@' in rest:
                rest, w = rest.split('@', 1)
                width = int(w)
            height = 844 if width < 800 else 900
            ctx = await b.new_context(viewport={'width': width, 'height': height}, device_scale_factor=2 if width < 800 else 1,
                                      is_mobile=width < 800, has_touch=width < 800,
                                      color_scheme='dark' if 'dark' in name else 'light')
            page = await ctx.new_page()
            errs = []
            page.on('pageerror', lambda e: errs.append(str(e)))
            page.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
            await page.goto(BASE + rest, wait_until='networkidle')
            await page.wait_for_timeout(600)
            full = True
            if action:
                for a in action.split(';'):
                    if a.startswith('click:'):
                        await page.click(a[6:])
                        await page.wait_for_timeout(2500)
                    elif a.startswith('scroll:'):
                        sel = a[7:]
                        await page.locator(sel).first.scroll_into_view_if_needed()
                        await page.wait_for_timeout(900)
                        full = False
                    elif a.startswith('eval:'):
                        await page.evaluate(a[5:])
                        await page.wait_for_timeout(700)
                    elif a.startswith('fillr:'):
                        _, n, v = a.split(':')
                        await page.locator('input[type=range]').nth(int(n)).fill(v)
                        await page.wait_for_timeout(500)
                    elif a.startswith('wait:'):
                        await page.wait_for_timeout(int(a[5:]))
                    elif a.startswith('readouts'):
                        txt = await page.evaluate("Array.from(document.querySelectorAll('.readout-cell')).map(e=>e.innerText.replace(/\\n/g,': ')).join(' | ')")
                        print('  READOUTS:', txt)
                    elif a == 'viewport':
                        full = False
            # reveal everything for full-page shots
            await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
            await page.wait_for_timeout(700)
            ov = await page.evaluate("""() => { const W = document.documentElement.clientWidth; const bad = [];
              document.querySelectorAll('body *').forEach(el => { const r = el.getBoundingClientRect(); if (r.width>0 && (r.right > W + 1) ) { const cs = getComputedStyle(el); let p = el.parentElement, clipped=false; while (p) { const s = getComputedStyle(p); if (s.overflowX==='auto'||s.overflowX==='hidden'||s.overflowX==='scroll'||s.overflowX==='clip') { clipped=true; break;} p=p.parentElement; } if(!clipped && cs.position!=='fixed') bad.push(el.tagName+'.'+(el.className&&el.className.baseVal===undefined?String(el.className).slice(0,40):'')+' r='+Math.round(r.right)); } });
              return {scrollW: document.documentElement.scrollWidth, W, bad: bad.slice(0,8)}; }""")
            path = os.path.join(OUT, f'{name}.png')
            await page.screenshot(path=path, full_page=full)
            print(name, width, 'scrollW', ov['scrollW'], 'W', ov['W'], 'overflow:', ov['bad'], 'errors:', errs[:5])
            await ctx.close()
        await b.close()

asyncio.run(main(sys.argv[1:]))
