"""Screenshots for the status + Mermaid repair fix. Needs out/ served on 4173."""
import asyncio, os
from playwright.async_api import async_playwright
BASE = os.environ.get('BASE', 'http://localhost:4173')
OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots')
FILE = os.environ.get('LESSON', '/workspace/projects/18fb3cce-d9f6-4129-8c86-d69799c6b7f5/files/uploads/lesson-1-14-b4703662c287.json')

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(BASE + '/settings/')
        async with page.expect_file_chooser() as fc:
            await page.get_by_role('button', name='Import lesson JSON').click()
        await (await fc.value).set_files(FILE)
        await page.wait_for_selector('text=Imported lesson')
        print('settings:', await page.locator('[role=status]').last.inner_text())
        await page.goto(BASE + '/course/unit-1/')
        await page.wait_for_selector('[data-ai-status=complete]')
        el = page.locator('[data-ai-status=complete]').first
        await el.scroll_into_view_if_needed()
        await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        await page.wait_for_timeout(400)
        print('status:', await el.inner_text(), '| overflow', await page.evaluate("document.documentElement.scrollWidth-document.documentElement.clientWidth"))
        await page.screenshot(path=os.path.join(OUT, 'fix-unit1-status.png'))
        await page.goto(BASE + '/study/?id=1-14')
        await page.wait_for_selector('[data-diagram]')
        await page.wait_for_timeout(4000)
        await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        info = await page.evaluate("""() => ({ok: document.querySelectorAll('[data-diagram=ok]').length, failed: document.querySelectorAll('[data-diagram=failed]').length,
          loading: document.querySelectorAll('[data-diagram=loading]').length, raw: [...document.querySelectorAll('.eyebrow')].filter(e=>e.textContent.includes('Unparsed')).length,
          overflow: document.documentElement.scrollWidth-document.documentElement.clientWidth})""")
        print("lesson:", info)
        print("errs:", await page.evaluate("[...document.querySelectorAll('[data-diagram=failed]')].map(e=>e.dataset.error)"))
        first = page.locator('[data-diagram]').first
        await first.scroll_into_view_if_needed()
        await page.evaluate("window.scrollBy(0,-120)")
        await page.wait_for_timeout(300)
        await page.screenshot(path=os.path.join(OUT, 'fix-114-repaired.png'))
        await page.screenshot(path=os.path.join(OUT, 'fix-114-repaired-full.png'), full_page=True)
        print('errors:', errs)
        await b.close()
asyncio.run(main())
