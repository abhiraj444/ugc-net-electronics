"""End-to-end test of the AI layer against scripts/mock-llm.py (no real keys).
Run: python3 scripts/mock-llm.py 8788 &  ; serve out/ on 4173 ; python3 scripts/e2e-ai.py
Proves: provider setup + test connection (OpenAI-compatible and Gemini adapters), model fetch, incremental
rendering while streaming, save + resume after a reload, line repair, KaTeX repair, unparsed fallback,
numeric mismatch flag, check pass + apply fix, block regenerate/delete + versions, remix, doubts (via Gemini),
topic tree review + add to course, AI practice set, and the GitHub publish payload (GitHub API mocked)."""
import asyncio, base64, json, os, sys, time, urllib.request
from playwright.async_api import async_playwright, expect

BASE = os.environ.get('BASE', 'http://localhost:4173')
MOCK = os.environ.get('MOCK', 'http://localhost:8788')
OUT = os.path.join(os.path.dirname(__file__), '..', 'screenshots')
RESULTS = []
NOPROXY = urllib.request.build_opener(urllib.request.ProxyHandler({}))

def ok(name, cond, detail=''):
    RESULTS.append((name, bool(cond), detail))
    print(('PASS ' if cond else 'FAIL ') + name + (' · ' + str(detail) if detail else ''), flush=True)

def stats():
    return json.loads(NOPROXY.open(MOCK + '/stats').read())

async def shot(page, name, full=True):
    await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
    await page.wait_for_timeout(400)
    ov = await page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
    await page.screenshot(path=os.path.join(OUT, f'{name}.png'), full_page=full)
    ok(f'no horizontal overflow · {name}', ov <= 0, f'overflow {ov}px')

async def main():
    NOPROXY.open(urllib.request.Request(MOCK + '/reset', data=b'{}', method='POST'))
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        errs = []
        page.on('pageerror', lambda e: errs.append(str(e)))
        page.on('dialog', lambda d: asyncio.ensure_future(d.accept()))

        # ---------- 1. provider: OpenAI-compatible (mock) ----------
        await page.goto(BASE + '/settings/?new=custom', wait_until='networkidle')
        await page.get_by_label('Name', exact=True).fill('Mock writer')
        await page.get_by_label('Base URL').fill(MOCK + '/slow/v1')
        await page.get_by_label('API key').fill('sk-test-not-a-real-key')
        await page.get_by_role('button', name='Fetch models from provider').click()
        await expect(page.get_by_text('2 models found')).to_be_visible(timeout=10000)
        ok('fetch models (OpenAI /models)', True)
        await page.get_by_label('Model name to add').fill('mock-writer')
        await page.get_by_role('button', name='Add', exact=True).click()
        await page.get_by_label('Extra params (JSON merged into the request body; null removes a key)').fill('{"reasoning_effort": ')
        await expect(page.get_by_text('Extra params is not valid JSON')).to_be_visible()
        ok('extra params JSON validated', True)
        await page.get_by_label('Extra params (JSON merged into the request body; null removes a key)').fill('{"seed": 7}')
        await page.get_by_role('button', name='Test connection').click()
        await expect(page.get_by_text('Connected in')).to_be_visible(timeout=15000)
        ok('test connection streams (OpenAI-compatible)', 'mock server' in await page.inner_text('body'))
        await shot(page, 'ai-provider-edit-390')
        # bad key shows a clear error
        await page.get_by_label('API key').fill('bad-key')
        await page.get_by_role('button', name='Test connection').click()
        await expect(page.get_by_text('HTTP 401')).to_be_visible(timeout=10000)
        ok('401 shows a clear error + hint', 'The key was rejected' in await page.inner_text('body'))
        await page.get_by_label('API key').fill('sk-test-not-a-real-key')
        await page.get_by_role('button', name='Save', exact=True).click()
        await page.get_by_role('button', name='← All settings').click()

        # ---------- 2. provider: Gemini native (mock) ----------
        await page.get_by_label('Add a provider').select_option('gemini')
        await page.get_by_role('button', name='Add', exact=True).click()
        await page.get_by_label('Base URL').fill(MOCK + '/v1beta')
        await page.get_by_label('API key').fill('g-test-key')
        await page.get_by_role('button', name='Test connection').click()
        await expect(page.get_by_text('Connected in')).to_be_visible(timeout=15000)
        ok('test connection streams (Gemini streamGenerateContent)', True)
        # CORS / network failure hint
        await page.get_by_label('Base URL').fill('http://localhost:9/v1beta')
        await page.get_by_role('button', name='Test connection').click()
        await expect(page.get_by_text('Network error')).to_be_visible(timeout=15000)
        ok('network/CORS failure shows hint', 'could not reach' in (await page.inner_text('body')).lower() or 'cors' in (await page.inner_text('body')).lower())
        await page.get_by_label('Base URL').fill(MOCK + '/v1beta')
        await page.get_by_role('button', name='Save', exact=True).click()
        await page.get_by_role('button', name='← All settings').click()
        # doubts -> Gemini
        d = page.locator('details', has_text='Doubts')
        await d.locator('summary').click()
        await d.locator('select').first.select_option(label='Google Gemini')
        await page.wait_for_timeout(300)
        await shot(page, 'ai-settings-390')
        # the legacy NDJSON flow below runs with Output format = JSON lines; Markdown is tested in section 9
        await page.get_by_role('button', name='JSON lines (legacy)').click()
        await page.wait_for_timeout(300)
        ok('output format setting: JSON lines selectable (default Markdown)', await page.get_by_role('button', name='JSON lines (legacy)').get_attribute('aria-pressed') == 'true')

        # ---------- 3. generate a Coming soon lesson, interrupt, resume ----------
        await page.goto(BASE + '/course/unit-1/', wait_until='networkidle')
        await page.get_by_role('link', name='Diode equivalent circuits').click()
        await page.wait_for_url('**/study/?id=1-8', timeout=10000)
        await expect(page.get_by_role('button', name='Generate this lesson')).to_be_visible()
        ok('Coming soon lesson is clickable -> /study generate screen', True)
        await shot(page, 'ai-study-generate-390')
        await page.get_by_role('button', name='Generate this lesson').click()
        t0 = time.time()
        while stats().get('section', 0) < 1 and time.time() - t0 < 40: await page.wait_for_timeout(300)
        await page.wait_for_timeout(1500)
        typing = await page.locator('.typing').count()
        h2 = await page.locator('article h2').count()
        hook = await page.get_by_text('fixing a torch').count()
        ok('incremental render while streaming (hook visible, typing preview, section started)', hook > 0 and typing > 0, f'typing={typing} h2={h2}')
        await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
        await page.screenshot(path=os.path.join(OUT, 'ai-study-streaming-390.png'))
        # interrupt mid-section
        await page.reload(wait_until='networkidle')
        resume = page.get_by_role('button', name='Resume ·')
        await expect(resume).to_be_visible(timeout=10000)
        txt = await resume.inner_text()
        ok('progress saved across reload (Resume shown)', '1 of' in txt, txt)
        await page.screenshot(path=os.path.join(OUT, 'ai-study-resume-390.png'))
        await resume.click()
        t0 = time.time()
        while time.time() - t0 < 110:
            body = await page.inner_text('body')
            if 'issues found' in body or 'issue found' in body or 'no open issues' in body: break
            await page.wait_for_timeout(500)
        s = stats()
        ok('resume skipped the finished outline step', s.get('outline') == 1, s)
        ok('resume re-ran the interrupted section (4 section calls for 3 sections)', s.get('section') == 4, s)
        body = await page.inner_text('body')
        ok('schema-invalid line repaired', 'Repaired: models trade accuracy' in body)
        ok('broken KaTeX repaired (equation card renders)', await page.locator('figure.card .katex').count() >= 1)
        ok('unrepairable line shown as plain text', 'Unparsed block' in body)
        ok('numeric mismatch flagged', 'Number check failed' in body)
        ok('generic plot figure rendered', await page.locator('svg[aria-label^="A straight line"]').count() == 1)
        ok('quiz + NET corner rendered', 'NET corner' in body and 'Quiz · check yourself' in body)
        ok('AI-written tag', 'AI-written · mock-writer' in body)
        ok('check pass ran', s.get('check') == 1, s)
        ok('repair calls made', s.get('repair', 0) >= 3, s)
        # slider moves the plot
        sl = page.locator('input[type=range]').first
        before = await page.locator('.readout-cell').nth(1).inner_text()
        await sl.fill('0.6')
        await page.wait_for_timeout(300)
        after = await page.locator('.readout-cell').nth(1).inner_text()
        ok('plot slider updates readout', before != after, f'{before!r} -> {after!r}')
        await shot(page, 'ai-study-lesson-390')
        await page.set_viewport_size({'width': 1280, 'height': 900})
        await page.wait_for_timeout(500)
        await shot(page, 'ai-study-lesson-1280')
        await page.set_viewport_size({'width': 390, 'height': 844})

        # persisted in IndexedDB
        n = await page.evaluate("""() => new Promise(r => { const q = indexedDB.open('bm-ai'); q.onsuccess = () => { const t = q.result.transaction('lessons').objectStore('lessons').get('1-8'); t.onsuccess = () => r(t.result ? t.result.blocks.length : -1); }; })""")
        ok('lesson saved in IndexedDB', n > 10, f'{n} blocks')

        # ---------- 4. review: issues, regenerate, delete, versions ----------
        await page.get_by_role('button', name='issues found').or_(page.get_by_role('button', name='issue found')).first.click()
        await expect(page.get_by_text('Apply the suggested fix')).to_be_visible()
        await page.get_by_role('button', name='Apply the suggested fix').click()
        await expect(page.get_by_text('Fixed', exact=True)).to_be_visible(timeout=5000)
        ok('check issue fix applied', 'thermal voltage' in await page.inner_text('body'))
        await page.get_by_role('button', name='Close').click()
        await page.get_by_role('button', name='Review and edit').click()
        await page.wait_for_timeout(300)
        await page.screenshot(path=os.path.join(OUT, 'ai-study-review-390.png'))
        raw = page.locator('div', has_text='Unparsed block').locator('xpath=ancestor::div[contains(@class,"ring-1")][1]').first
        await raw.get_by_role('button', name='Delete').click()
        await page.wait_for_timeout(600)
        ok('block delete', 'Unparsed block' not in await page.inner_text('body'))
        para = page.locator('div.ring-1', has_text='Think of it like').first
        regen = page.locator('div.ring-1', has_text='Which model does the exam want').locator('button', has_text='Regenerate').first
        await page.locator('div.ring-1', has_text='If the question gives no forward voltage').get_by_role('button', name='Regenerate').first.click()
        await expect(page.get_by_text('Regenerated: a diode model')).to_be_visible(timeout=20000)
        ok('block regenerate', True)
        vers = await page.get_by_role('button', name='Versions ·').inner_text()
        ok('version history recorded', int(vers.split('·')[1]) >= 3, vers)
        # edit a paragraph by hand
        await page.locator('div.ring-1', has_text='Regenerated: a diode model').get_by_role('button', name='Edit').first.click()
        await page.get_by_label('Block content').fill('Edited by hand: a model is a promise about **what to ignore**, with $V_\\gamma$ fixed.')
        await page.get_by_role('button', name='Save', exact=True).click()
        await expect(page.get_by_text('Edited by hand')).to_be_visible(timeout=5000)
        ok('block edit (validated) saved', True)
        # rollback
        await page.get_by_role('button', name='Versions ·').click()
        await page.get_by_role('button', name='Roll back').first.click()
        await page.wait_for_timeout(600)
        ok('rollback restores previous version', 'Edited by hand' not in await page.inner_text('body'))
        await page.get_by_role('button', name='Done reviewing').click()

        # ---------- 5. remix ----------
        await page.get_by_role('button', name='Simpler').first.click()
        await expect(page.get_by_text('Simpler version: the exact equation')).to_be_visible(timeout=20000)
        ok('remix: simpler replaces section prose', 'the voltage sets the current' not in await page.inner_text('body'))
        await page.get_by_role('button', name='New example').nth(2).click()
        await expect(page.get_by_text('a phone charger LED')).to_be_visible(timeout=20000)
        ok('remix: another example inserted', True)

        # ---------- 6. doubt (task profile -> Gemini) ----------
        before = stats()
        await page.get_by_role('button', name='Ask a doubt about this lesson').click()
        await page.get_by_label('Your doubt').fill('Why does the field point from n to p?')
        await page.get_by_role('button', name='Ask', exact=True).click()
        await expect(page.get_by_text('Good question')).to_be_visible(timeout=15000)
        ok('doubt sheet answers with lesson context', 'Lesson:' not in await page.locator('[role=dialog]').inner_text())
        await page.screenshot(path=os.path.join(OUT, 'ai-doubt-390.png'))
        await page.get_by_role('button', name='Close').click()
        # publish (GitHub API mocked by the browser test)
        await page.goto(BASE + '/settings/', wait_until='networkidle')
        await page.get_by_label('Token', exact=True).fill('github_pat_test_only')
        await page.locator('section[aria-label="Publish to course"]').get_by_role('button', name='Save').click()
        put = {}
        async def gh(route):
            r = route.request
            if r.method == 'GET': await route.fulfill(status=404, body='{"message":"Not Found"}', headers={'access-control-allow-origin': '*'})
            elif r.method == 'PUT':
                put.update(json.loads(r.post_data)); put['url'] = r.url
                await route.fulfill(status=201, body=json.dumps({'commit': {'html_url': 'https://github.com/x/y/commit/abc'}}), headers={'content-type': 'application/json', 'access-control-allow-origin': '*'})
            else: await route.continue_()
        await page.route('https://api.github.com/**', gh)
        await page.goto(BASE + '/study/?id=1-8', wait_until='networkidle')
        await page.get_by_label('I have reviewed this lesson').click()
        await expect(page.get_by_role('button', name='Publish to course')).to_be_enabled(timeout=5000)
        await page.get_by_role('button', name='Publish to course').click()
        await expect(page.get_by_text('Published to the course repo')).to_be_visible(timeout=10000)
        doc = json.loads(base64.b64decode(put['content']).decode()) if put.get('content') else {}
        ok('publish commits content/published/1-8.json on main', put.get('url', '').endswith('/repos/abhiraj444/ugc-net-electronics/contents/content/published/1-8.json') and put.get('branch') == 'main', put.get('url'))
        ok('published JSON has no raw blocks and no _step', doc and all(bl['type'] != 'raw' and '_step' not in bl for bl in doc['blocks']), f"{len(doc.get('blocks', []))} blocks")
        json.dump(doc, open('/tmp/published-1-8.json', 'w'), ensure_ascii=False, indent=2)

        # ---------- 7. topic tree ----------
        await page.goto(BASE + '/course/unit-1/', wait_until='networkidle')
        await page.get_by_role('button', name='Add a topic').click()
        await page.get_by_label('What topic do you want to add?').fill('Varactor diodes and junction capacitance')
        await page.get_by_role('button', name='Suggest lessons').click()
        await expect(page.get_by_text('selected')).to_be_visible(timeout=20000)
        n_inputs = await page.get_by_label('Lesson title').count()
        ok('topic tree returned and editable', n_inputs == 4, n_inputs)
        await page.get_by_label('Lesson title').nth(3).fill('Diffusion capacitance: the forward-bias twin')
        await page.get_by_role('button', name='Move up').nth(2).click()
        await page.get_by_label('Include Varactor tuning: turning a voltage into a frequency').uncheck()
        await page.screenshot(path=os.path.join(OUT, 'ai-topic-tree-390.png'))
        await page.get_by_role('button', name='Add 3 to course').click()
        await expect(page.get_by_text('Added 3 lessons')).to_be_visible(timeout=5000)
        ok('topic added to course (3 ticked nodes -> 3 lessons)', True)
        await page.get_by_role('button', name='Close').click()
        await page.wait_for_timeout(4500)
        body = await page.inner_text('body')
        ok('custom topic shown on unit page', 'Your topic' in body and 'forward-bias twin' in body)
        await shot(page, 'ai-unit1-custom-390')
        await page.goto(BASE + '/course/', wait_until='networkidle')
        await page.wait_for_timeout(1200)
        ok('custom topic shown on course map', 'Varactor diodes' in await page.inner_text('body'))
        # go deeper from a hand-written lesson section
        await page.goto(BASE + '/course/unit-1/1-6/', wait_until='networkidle')
        nd = await page.get_by_role('button', name='Go deeper').count()
        ok('Go deeper on hand-written lesson + each section', nd >= 6, nd)
        await page.set_viewport_size({'width': 1280, 'height': 900})
        await page.get_by_role('button', name='Go deeper').first.click()
        await page.get_by_role('button', name='Suggest lessons').click()
        await expect(page.get_by_text('selected')).to_be_visible(timeout=20000)
        await page.screenshot(path=os.path.join(OUT, 'ai-topic-tree-1280.png'))
        await page.set_viewport_size({'width': 390, 'height': 844})

        # ---------- 8. practice for Unit II ----------
        await page.goto(BASE + '/course/unit-2/', wait_until='networkidle')
        await page.get_by_role('link', name='Practice · generate a set').click()
        await page.wait_for_url('**/study/?practice=unit-2', timeout=10000)
        await page.get_by_role('button', name='Generate practice set').click()
        await expect(page.get_by_text('15 practice questions')).to_be_visible(timeout=60000)
        body = await page.inner_text('body')
        ok('practice set generated (labelled Practice, never PYQ)', 'Practice ·' in body and 'PYQ' not in body)
        await page.get_by_role('radio').first.click()
        await shot(page, 'ai-practice-390')

        # ---------- 9. Markdown output format ----------
        await page.goto(BASE + '/settings/', wait_until='networkidle')
        await page.get_by_role('button', name='Markdown (recommended)').click()
        await page.wait_for_timeout(300)
        rep0 = stats().get('repair', 0); sec0 = stats().get('section', 0)
        await page.goto(BASE + '/study/?id=1-9', wait_until='networkidle')
        await page.get_by_role('button', name='Generate this lesson').click()
        previews, shot_taken = [], False
        t0 = time.time()
        while time.time() - t0 < 110:
            if await page.locator('.typing').count():
                try: previews.append(await page.locator('.typing').first.inner_text(timeout=500))
                except Exception: pass
                if not shot_taken and stats().get('section', 0) > sec0 and await page.locator('article h2').count():
                    await page.evaluate("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))")
                    await page.locator('.typing').first.evaluate("e => e.scrollIntoView({block: 'center'})")
                    await page.wait_for_timeout(200)
                    await page.screenshot(path=os.path.join(OUT, 'fix-md-streaming.png')); shot_taken = True
            body = await page.inner_text('body')
            if 'issues found' in body or 'issue found' in body or 'no open issues' in body: break
            await page.wait_for_timeout(250)
        bad = [x for x in previews if '``' in x or ':::' in x]
        ok('md: live preview shown while streaming, never raw ``` or ::: markup', previews and not bad, f'{len(previews)} samples, bad: {bad[:2]!r}')
        ok('md: streaming screenshot taken', shot_taken)
        body = await page.inner_text('body')
        await page.wait_for_selector('[data-diagram=ok]', timeout=15000)
        ok('md: mermaid fence -> diagram block drawn', await page.locator('[data-diagram=ok]').count() == 1 and 'How breakdown starts' in body)
        ok('md: :::guess, :::example, :::sidenote rendered', 'heavily doped' in body and 'Voltage reference in a 230 V adapter' in body and 'Zener voltage' in body)
        ok('md: plot fence -> interactive plot', await page.locator('svg[aria-label^="Reverse current near breakdown"]').count() == 1)
        ok('md: equation fence (LaTeX in YAML) renders', await page.locator('figure.card .katex').count() >= 1 and 'Avalanche multiplication' in body)
        ok('md: broken YAML quiz fence repaired in one call', 'Which mechanism dominates in a 3 V Zener diode?' in body and 'Quiz · check yourself' in body)
        ok('md: NET corner from YAML', 'NET corner' in body and 'Zener current' in body)
        ok('md: unrepairable mermaid -> plain text (Unparsed block)', 'Unparsed block' in body and 'Mermaid' in body)
        s9 = stats()
        ok('md: exactly one repair call per broken block (2)', s9.get('repair', 0) - rep0 == 2, s9)
        types = await page.evaluate("""() => new Promise(r => { const q = indexedDB.open('bm-ai'); q.onsuccess = () => { const t = q.result.transaction('lessons').objectStore('lessons').get('1-9'); t.onsuccess = () => r(t.result ? t.result.blocks.map(b => b.type) : []); }; })""")
        ok('md: stored as the same block JSON', types.count('diagram') == 1 and types.count('raw') == 1 and types.count('section') == 3 and 'quiz' in types and 'netCorner' in types and 'upNext' in types, types)
        await page.get_by_role('button', name='Review and edit').click()
        await page.wait_for_timeout(300)
        rawbox = page.locator('div.ring-1', has_text='Unparsed block').first
        ok('md: broken block offers Regenerate', await rawbox.get_by_role('button', name='Regenerate').count() == 1)
        await page.get_by_role('button', name='Done reviewing').click()
        await shot(page, 'fix-md-lesson-390')

        # dark mode render of the AI lesson
        await page.emulate_media(color_scheme='dark')
        await page.evaluate("localStorage.removeItem('esc-theme')")
        await page.goto(BASE + '/study/?id=1-8', wait_until='networkidle')
        await page.wait_for_timeout(800)
        await page.screenshot(path=os.path.join(OUT, 'ai-study-dark-390.png'))
        ok('no page errors', not errs, errs[:3])
        await b.close()
    fails = [r for r in RESULTS if not r[1]]
    print(f'\n{len(RESULTS) - len(fails)}/{len(RESULTS)} passed', flush=True)
    json.dump(RESULTS, open('/tmp/e2e-results.json', 'w'), indent=1)

asyncio.run(main())
