"""Mock LLM server for end-to-end tests of the AI layer. No real model, no keys.
Speaks OpenAI-compatible SSE (/v1/chat/completions, /v1/models) and Gemini SSE
(/v1beta/models/<m>:streamGenerateContent?alt=sse, /v1beta/models). Emits NDJSON lesson blocks
slowly, including deliberately broken lines to exercise repair and the unparsed fallback.
Usage: python3 scripts/mock-llm.py [port]   (GET /stats shows how many calls each task got; POST /reset clears)
"""
import json, re, sys, time, threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8788
STATS = {}
LOCK = threading.Lock()

def L(o): return json.dumps(o, ensure_ascii=False)

def outline():
    return "\n".join([
        L({"type": "meta", "dek": "A diode is not a perfect switch, but three simple models get you most of the way. Pick the one the question needs.", "netWeight": "High", "minutes": 14, "buildsOn": ["1-7"]}),
        L({"type": "hook", "text": "You are fixing a torch that runs on two AA cells. The LED inside drops about 2 V, and the cells give 3 V.\n\nDo you need the full diode equation to pick a resistor? No. You need a good-enough picture."}),
        L({"type": "plan", "title": "Why not use the full equation every time?", "goal": "Show that the exponential is overkill for most circuit problems.", "figure": "none"}),
        L({"type": "plan", "title": "Try it: compare the three models", "goal": "Plot ideal, constant-drop and piecewise-linear models against the real curve.", "figure": "plot"}),
        L({"type": "plan", "title": "Which model does the exam want?", "goal": "Map question wording to the right model.", "figure": "none"}),
    ])

def section(n):
    if n == 1:
        return "\n".join([
            L({"type": "section", "title": "Why not use the full equation every time?"}),
            L({"type": "paragraph", "text": "The diode equation $I = I_s(e^{V/nV_T} - 1)$ is exact enough, but it is **implicit** once a resistor is in series: the current sets the voltage and the voltage sets the current."}),
            '{"type":"paragraph","txt":"This line is broken on purpose: wrong key, so the app must repair it."}',
            L({"type": "yourGuess", "question": "A silicon diode in series with 1 kΩ across 5 V. Roughly how much current flows?", "answer": "About **4.3 mA**: assume 0.7 V across the diode, so (5 − 0.7)/1000."}),
        ])
    if n == 2:
        return "\n".join([
            L({"type": "section", "title": "Try it: compare the three models"}),
            L({"type": "paragraph", "text": "The figure draws the real exponential curve and a straight-line model on top. Move the knee voltage and the resistance and watch where they part ways."}),
            L({"type": "tryThis", "text": "drag **$V_\\gamma$** from 0.6 V to 0.75 V and see where the line meets the curve."}),
            L({"type": "figure", "figure": "plot", "title": "A straight line pretending to be a curve", "label": "Figure 1.8", "plot": {
                "x": {"name": "V", "min": 0, "max": 0.9, "label": "V (volts)"}, "y": {"label": "I (mA)", "min": 0, "max": 20},
                "curves": [{"expr": "1e-11*(exp(V/0.02585)-1)*1e3", "label": "Real diode"}, {"expr": "max(0, (V - Vg)/r)*1e3", "label": "Piecewise-linear"}],
                "sliders": [{"name": "Vg", "label": "Knee voltage", "min": 0.55, "max": 0.8, "step": 0.01, "value": 0.65, "unit": "V"}, {"name": "r", "label": "Forward resistance", "min": 2, "max": 30, "step": 1, "value": 10, "unit": "Ω"}],
                "readouts": [{"label": "Real I at 0.7 V", "expr": "1e-11*(exp(0.7/0.02585)-1)*1e3", "unit": "mA"}, {"label": "Model I at 0.7 V", "expr": "max(0,(0.7-Vg)/r)*1e3", "unit": "mA"}]}}),
            L({"type": "describe", "text": "**What it shows.** The solid curve is the Shockley equation with $I_s = 10^{-11}$ A and $n = 1$. The dashed line is the piecewise-linear model. **Limits.** Series resistance and temperature are ignored."}),
            '{"type":"equationCard","title":"Piecewise-linear model","tex":"I = \\\\frac{V - V_\\\\gamma}{r_f","symbols":[{"s":"V_\\\\gamma","name":"knee voltage","unit":"V"}],"typical":"$V_\\\\gamma = 0.7$ V, $r_f = 10\\\\,\\\\Omega$."}',
        ])
    return "\n".join([
        L({"type": "section", "title": "Which model does the exam want?"}),
        L({"type": "paragraph", "text": "If the question gives no forward voltage, use the **ideal** model. If it says silicon, use the **constant-drop** model with 0.7 V."}),
        L({"type": "example", "title": "an Indian Railways signal lamp", "text": "LED signal heads run strings of LEDs from 110 V DC. Designers size the series resistor with the constant-drop model, then check heating with the full curve."}),
        '{"type":"mystery","text":"An unknown block type that repair cannot save."}',
        L({"type": "sideNote", "text": "The 0.7 V figure is a habit, not a law. At 1 µA a silicon diode drops nearer 0.4 V."}),
    ])

def quiz():
    return "\n".join([
        L({"type": "remember", "text": "Use the simplest diode model that answers the question: ideal for logic, 0.7 V drop for silicon bias, piecewise-linear when the resistance matters."}),
        L({"type": "quiz", "questions": [
            {"stem": "In the constant-drop model, a forward-biased silicon diode is replaced by:", "options": ["A short circuit", "A 0.7 V battery", "A 0.7 V battery in series with $r_f$", "An open circuit"], "answer": 1, "why": ["That is the ideal model.", "Right: a fixed drop and nothing else.", "That is the piecewise-linear model.", "That is reverse bias."]},
            {"stem": "Which model needs $r_f$?", "options": ["Ideal", "Constant drop", "Piecewise-linear", "None"], "answer": 2, "why": ["No resistance in the ideal model.", "Only a battery.", "The slope of the line is $1/r_f$.", "Piecewise-linear does."]}]}),
        L({"type": "netCorner", "questions": [
            {"tag": "Numerical", "stem": "A silicon diode (0.7 V drop) in series with 2.2 kΩ across 12 V. The current is closest to:", "options": ["5.1 mA", "5.5 mA", "4.3 mA", "0.32 mA"], "answer": 0, "why": ["(12 − 0.7)/2200 = 5.14 mA.", "Forgets the diode drop.", "Wrong resistor.", "Off by a factor of 16."],
             "numeric": {"formula": "(Vs - Vd)/R*1e3", "inputs": {"Vs": 12, "Vd": 0.7, "R": 2200}, "answer": 5.14, "unit": "mA"}},
            {"tag": "Numerical", "stem": "Same circuit with a germanium diode (0.3 V). The current is closest to:", "options": ["5.3 mA", "6.2 mA", "4.0 mA", "1.1 mA"], "answer": 1, "why": ["Close but not it.", "Marked correct here on purpose: the app should flag that the numbers disagree.", "Too low.", "Far too low."],
             "numeric": {"formula": "(Vs - Vd)/R*1e3", "inputs": {"Vs": 12, "Vd": 0.3, "R": 2200}, "answer": 6.2, "unit": "mA"}}],
            "traps": ["Read which model the question implies: **no drop given** usually means ideal.", "Germanium is 0.3 V, silicon 0.7 V, red LED about 1.8 V."],
            "formula": "I_D = \\frac{V_S - V_\\gamma}{R + r_f}", "formulaLabel": "Piecewise-linear current"}),
        L({"type": "doneWhen", "text": "You can solve a series diode-resistor circuit three ways and say which answer the question wanted."}),
        L({"type": "upNext", "teaser": "Push a diode hard enough in reverse and it suddenly conducts. Two different mechanisms do it."}),
    ])

def check():
    return "\n".join([
        L({"type": "issue", "block": 2, "severity": "low", "problem": "Say what $V_T$ is on first use.", "fix": {"type": "paragraph", "text": "The diode equation $I = I_s(e^{V/nV_T} - 1)$, with thermal voltage $V_T \\approx 25.85$ mV at 300 K, is exact enough, but it is **implicit** once a resistor is in series."}}),
        L({"type": "issue", "block": 0, "severity": "high", "problem": "NET question 2 marks 6.2 mA but the formula gives 5.32 mA.", "fix": None}),
    ])

def repair(prompt):
    m = re.search(r"Line:\n(.*?)\nReturn ONLY", prompt, re.S)
    line = m.group(1) if m else prompt
    err = re.search(r"but it failed: (.*?)\nLine:", prompt, re.S)
    if err and '"root"' in line: return topics()
    prompt = line
    if "equationCard" in prompt:
        return L({"type": "equationCard", "title": "Piecewise-linear model", "tex": "I = \\frac{V - V_\\gamma}{r_f}", "symbols": [{"s": "V_\\gamma", "name": "knee voltage", "unit": "V"}, {"s": "r_f", "name": "forward resistance", "unit": "Ω"}], "typical": "$V_\\gamma = 0.7$ V, $r_f = 10\\,\\Omega$: at 0.75 V, $I = 5$ mA."})
    if "mystery" in prompt:
        return "Sorry, I cannot fix that."
    if '"txt"' in prompt:
        return L({"type": "paragraph", "text": "Repaired: models trade accuracy for speed. You pick the cheapest one that still answers the question."})
    if "root" in prompt or "topic" in prompt.lower():
        return topics()
    return L({"type": "paragraph", "text": "Repaired paragraph."})

def topics():
    return L({"root": "Varactor diodes", "nodes": [
        {"title": "Junction capacitance: a capacitor whose plates move", "why": "NET asks C–V dependence for abrupt vs graded junctions.", "prerequisites": ["1.6"], "netWeight": "High", "minutes": 14, "children": [
            {"title": "Abrupt vs linearly graded: why the exponent changes", "why": "−1/2 vs −1/3 is a classic trap.", "prerequisites": [], "netWeight": "High", "minutes": 10, "children": []}]},
        {"title": "Varactor tuning: turning a voltage into a frequency", "why": "Links devices to communication (Unit VIII).", "prerequisites": ["LC resonance"], "netWeight": "Medium", "minutes": 15, "children": []},
        {"title": "Diffusion capacitance: the forward-bias cousin", "why": "Often confused with depletion capacitance.", "prerequisites": [], "netWeight": "Medium", "minutes": 12, "children": []}]})

def practice(n):
    out = []
    for i in range(n):
        if i % 3 == 0:
            out.append(L({"type": "mcq", "lesson": "2.%d" % (i % 9 + 1), "tag": "Numerical", "stem": "An oxide grows to %d nm. Roughly how much silicon is consumed (0.44 × thickness)?" % (100 + 10 * i), "options": ["%.0f nm" % (0.44 * (100 + 10 * i)), "%.0f nm" % (0.56 * (100 + 10 * i)), "%d nm" % (100 + 10 * i), "%.0f nm" % (0.2 * (100 + 10 * i))], "answer": 0, "why": ["0.44 × t.", "That is the part above the original surface.", "Silicon is consumed, not all of it.", "Too small."], "numeric": {"formula": "0.44*t", "inputs": {"t": 100 + 10 * i}, "answer": 0.44 * (100 + 10 * i), "unit": "nm"}}))
        else:
            out.append(L({"type": "mcq", "lesson": "2.%d" % (i % 9 + 1), "stem": "Practice question %d: which etch is anisotropic?" % (i + 1), "options": ["Wet HF etch", "Reactive ion etch", "KOH on (100) only", "Thermal oxidation"], "answer": 1, "why": ["Wet etches are isotropic.", "Ion bombardment gives direction.", "Crystal-dependent, not general.", "Not an etch."]}))
    return "\n".join(out)

def remix(prompt):
    if "Mode: example" in prompt:
        return L({"type": "example", "title": "a phone charger LED", "text": "The tiny green LED on a charger uses the constant-drop model: 5 V, 1.9 V drop, 1 kΩ, about 3 mA."})
    return "\n".join([
        L({"type": "section", "title": "Why not use the full equation every time?"}),
        L({"type": "paragraph", "text": "Simpler version: the exact equation is hard to solve with a resistor in the loop. A rough model is quicker and nearly as good."}),
        L({"type": "paragraph", "text": "Think of it like rounding prices when you shop: you get close enough, fast."}),
    ])

def respond(prompt, system):
    m = re.search(r"TASK: (\w+)", prompt)
    task = m.group(1) if m else ("doubt" if "patient tutor" in system else "chat")
    with LOCK: STATS[task] = STATS.get(task, 0) + 1
    if task == "outline": return task, outline()
    if task == "section":
        n = int(re.search(r"Write section (\d+)", prompt).group(1)); return task, section(n)
    if task == "quiz": return task, quiz()
    if task == "check": return task, check()
    if task == "repair": return task, repair(prompt)
    if task == "topics": return task, topics()
    if task == "practice":
        n = int(re.search(r"Write (\d+) practice", prompt).group(1)); return task, practice(n)
    if task == "remix": return task, remix(prompt)
    if task == "rewrite": return task, L({"type": "paragraph", "text": "Regenerated: a diode model is a promise about which details you may ignore."})
    if task == "doubt": return task, "Good question. The field points from **n to p** because the uncovered donor ions on the n side are positive, and field lines start on positive charge.\n\nSo $\\vec E$ points toward the negative acceptor ions on the p side."
    return task, "Connection works: this is the mock server."

def chunks(text, size=14):
    for i in range(0, len(text), size): yield text[i:i + size]

class H(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"
    def log_message(self, *a): pass
    def cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
    def do_OPTIONS(self):
        self.send_response(204); self.cors(); self.send_header("Content-Length", "0"); self.end_headers()
    def json(self, o, code=200):
        b = json.dumps(o).encode(); self.send_response(code); self.cors()
        self.send_header("Content-Type", "application/json"); self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self):
        p = self.path.split("?")[0].replace("/slow", "")
        if p == "/stats": return self.json(STATS)
        if p == "/v1/models": return self.json({"data": [{"id": "mock-writer"}, {"id": "mock-fast"}]})
        if p == "/v1beta/models": return self.json({"models": [{"name": "models/gemini-mock", "supportedGenerationMethods": ["generateContent"]}]})
        self.json({"error": {"message": "not found"}}, 404)
    def do_POST(self):
        n = int(self.headers.get("Content-Length") or 0); body = json.loads(self.rfile.read(n) or b"{}")
        path = self.path
        if path == "/reset":
            STATS.clear(); return self.json({"ok": True})
        delay = 0.05 if path.startswith("/slow") else 0.012
        path = path.replace("/slow", "")
        auth = self.headers.get("Authorization", "") + self.headers.get("x-goog-api-key", "")
        if "bad" in auth: return self.json({"error": {"message": "Invalid API key"}}, 401)
        gem = ":streamGenerateContent" in path
        if gem:
            msgs = body.get("contents", []); prompt = msgs[-1]["parts"][0]["text"] if msgs else ""
            system = (body.get("systemInstruction") or {}).get("parts", [{}])[0].get("text", "")
        else:
            msgs = body.get("messages", []); prompt = next((m["content"] for m in reversed(msgs) if m["role"] == "user"), "")
            system = next((m["content"] for m in msgs if m["role"] == "system"), "")
        task, text = respond(prompt, system)
        self.send_response(200); self.cors()
        self.send_header("Content-Type", "text/event-stream"); self.send_header("Cache-Control", "no-cache"); self.send_header("Connection", "close"); self.end_headers()
        try:
            for c in chunks(text):
                if gem: ev = {"candidates": [{"content": {"role": "model", "parts": [{"text": c}]}}]}
                else: ev = {"choices": [{"index": 0, "delta": {"content": c}}]}
                self.wfile.write(("data: " + json.dumps(ev) + "\n\n").encode()); self.wfile.flush(); time.sleep(delay)
            if gem:
                self.wfile.write(("data: " + json.dumps({"candidates": [{"content": {"role": "model", "parts": [{"text": ""}]}, "finishReason": "STOP"}], "usageMetadata": {"promptTokenCount": len(prompt) // 4, "candidatesTokenCount": len(text) // 4}}) + "\n\n").encode())
            else:
                self.wfile.write(("data: " + json.dumps({"choices": [], "usage": {"prompt_tokens": len(prompt) // 4, "completion_tokens": len(text) // 4}}) + "\n\n").encode())
                self.wfile.write(b"data: [DONE]\n\n")
            self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        self.close_connection = True

if __name__ == "__main__":
    print("mock LLM on", PORT, flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), H).serve_forever()
