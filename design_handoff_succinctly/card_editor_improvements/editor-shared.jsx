const { useState, useRef, useEffect, useLayoutEffect } = React;

const ET = {
  bg: '#0A0A0B', bgElev: '#111113', bgCard: '#17171A', bgHover: '#1D1D21',
  border: 'rgba(255,255,255,0.08)', borderStrong: 'rgba(255,255,255,0.14)',
  text: '#F5F5F7', muted: 'rgba(245,245,247,0.6)', faint: 'rgba(245,245,247,0.38)',
  display: '"Instrument Serif", Georgia, serif', sans: '"Inter Tight", -apple-system, system-ui, sans-serif', mono: '"JetBrains Mono", ui-monospace, monospace',
};
const CARD = { bg: '#F5D96B', ink: '#3A2E0A' };
const NOISE = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.06 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>")`;

const SAMPLE_Q = "What does `fib(5)` return, and what is the time complexity?\n\n```python\ndef fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n```";
const SAMPLE_A = "Returns **5**. Each call branches twice, so the running time follows\n\n$$T(n) = T(n-1) + T(n-2) + O(1)$$\n\nwhich grows as $O(\\varphi^n) \\approx O(1.618^n)$. Caching makes it *linear*:\n\n```python {3|4-7}\nfrom functools import cache\n\n@cache\ndef fib(n):\n    if n < 2:\n        return n\n    return fib(n - 1) + fib(n - 2)\n```";

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function tex(c, display) { try { return katex.renderToString(c, { throwOnError: false, displayMode: display }); } catch (e) { return esc(c); } }
function inlineHTML(t) {
  const toks = [];
  const hold = (h) => { toks.push(h); return `\u0000${toks.length - 1}\u0000`; };
  t = t.replace(/`([^`]+)`/g, (m, c) => hold(`<code class="ic">${esc(c)}</code>`));
  t = t.replace(/\$([^$]+)\$/g, (m, c) => hold(tex(c, false)));
  t = esc(t).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>');
  return t.replace(/\u0000(\d+)\u0000/g, (m, i) => toks[i]);
}
function parseMD(src) {
  const lines = (src || '').split('\n'); const out = []; let i = 0; let para = [];
  const flush = () => { if (para.length) { out.push({ type: 'text', text: para.join(' ') }); para = []; } };
  while (i < lines.length) {
    const l = lines[i];
    const f = l.match(/^```(\w+)?\s*(?:\{([\d|,\-\s]*)\}|([\d|,\-]+))?\s*$/);
    if (f) { flush(); const body = []; i++; while (i < lines.length && !/^```\s*$/.test(lines[i])) { body.push(lines[i]); i++; } i++; out.push({ type: 'code', lang: f[1] || 'plaintext', steps: (f[2] || f[3] || '').replace(/\s/g, ''), body: body.join('\n') }); continue; }
    if (l.trim().startsWith('$$')) {
      flush(); const s = l.trim().slice(2);
      if (s.endsWith('$$')) { out.push({ type: 'math', tex: s.slice(0, -2) }); i++; continue; }
      const body = [s]; i++;
      while (i < lines.length && !lines[i].trim().endsWith('$$')) { body.push(lines[i]); i++; }
      if (i < lines.length) { body.push(lines[i].trim().slice(0, -2)); i++; }
      out.push({ type: 'math', tex: body.join('\n') }); continue;
    }
    const im = l.match(/^!\[([^\]]*)\]\(([^)]*)\)/);
    if (im) { flush(); out.push({ type: 'image', alt: im[1], src: im[2] }); i++; continue; }
    if (/^\s*[-*] /.test(l)) { flush(); const items = []; while (i < lines.length && /^\s*[-*] /.test(lines[i])) { items.push(lines[i].replace(/^\s*[-*] /, '')); i++; } out.push({ type: 'list', items }); continue; }
    if (!l.trim()) { flush(); i++; continue; }
    para.push(l.trim()); i++;
  }
  flush(); return out;
}
function parseSteps(s) {
  if (!s) return [];
  return s.split('|').map(p => { const set = new Set(); p.split(',').forEach(r => { const [a, b] = r.split('-').map(Number); if (!a) return; for (let k = a; k <= (b || a); k++) set.add(k); }); return set; }).filter(s => s.size);
}

function CodeBlock({ lang, body, steps, size = 13 }) {
  const st = parseSteps(steps); const [k, setK] = useState(-1);
  let html; try { html = hljs.getLanguage(lang) ? hljs.highlight(body, { language: lang }).value : esc(body); } catch (e) { html = esc(body); }
  const active = k >= 0 ? st[k] : null;
  return (
    <div style={{ background: '#1E1B14', borderRadius: 10, padding: '9px 0 10px', fontFamily: ET.mono, fontSize: size, lineHeight: 1.6, color: '#EDE6D6', textAlign: 'left', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 12px 5px', fontSize: 9.5, letterSpacing: 0.8, textTransform: 'uppercase', color: 'rgba(237,230,214,0.45)' }}>
        <span>{lang}</span>
        {st.length > 0 && (
          <button type="button" onClick={e => { e.stopPropagation(); setK(x => x + 1 >= st.length ? -1 : x + 1); }} style={{ background: k >= 0 ? 'rgba(245,217,107,0.18)' : 'rgba(237,230,214,0.08)', color: k >= 0 ? '#F5D96B' : 'rgba(237,230,214,0.6)', border: 'none', borderRadius: 999, padding: '2px 8px', fontFamily: ET.mono, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase', cursor: 'pointer' }}>
            {k < 0 ? `▸ ${st.length} steps` : `step ${k + 1} / ${st.length}`}
          </button>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        {html.split('\n').map((ln, i) => {
          const on = active && active.has(i + 1);
          return (
            <div key={i} style={{ display: 'flex', padding: '0 12px', opacity: active && !on ? 0.28 : 1, background: on ? 'rgba(245,217,107,0.09)' : 'transparent', transition: 'opacity 220ms, background 220ms' }}>
              <span style={{ width: '2.4ch', flexShrink: 0, color: 'rgba(237,230,214,0.28)', userSelect: 'none' }}>{i + 1}</span>
              <span style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: ln || ' ' }}></span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ImageSlot({ ink, h = 130, label = 'Drop or paste an image' }) {
  return <div style={{ height: h, borderRadius: 10, border: `1.5px dashed ${ink}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: ink, opacity: 0.7, fontFamily: ET.mono, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase' }}><Ic.image size={15} />{label}</div>;
}

function Block({ b, size, codeSize, ink }) {
  if (b.type === 'text') return <div className="rt" style={{ fontFamily: ET.display, fontSize: size, lineHeight: 1.28, letterSpacing: -0.3, textWrap: 'pretty' }} dangerouslySetInnerHTML={{ __html: inlineHTML(b.text) }}></div>;
  if (b.type === 'math') return <div style={{ fontSize: size * 0.8, overflowX: 'auto', overflowY: 'hidden' }} dangerouslySetInnerHTML={{ __html: tex(b.tex, true) }}></div>;
  if (b.type === 'code') return <CodeBlock {...b} size={codeSize} />;
  if (b.type === 'image') return b.src && b.src !== 'upload' ? <img src={b.src} alt={b.alt} style={{ display: 'block', maxWidth: '100%', maxHeight: size * 9, borderRadius: 10, objectFit: 'contain' }} /> : <ImageSlot ink={ink} h={size * 5} />;
  if (b.type === 'list') return <ul style={{ fontFamily: ET.display, fontSize: size * 0.92, lineHeight: 1.3, margin: 0, paddingLeft: '1.1em' }}>{b.items.map((t, i) => <li key={i} dangerouslySetInnerHTML={{ __html: inlineHTML(t) }}></li>)}</ul>;
  return null;
}

function Rich({ src, blocks, size = 24, codeSize = 13, ink = CARD.ink, empty }) {
  const bs = blocks || parseMD(src);
  if (!bs.length) return <div style={{ fontFamily: ET.display, fontSize: size, color: ink, opacity: 0.3, textAlign: 'center' }}>{empty}</div>;
  const center = bs.length === 1 && bs[0].type === 'text';
  return <div style={{ display: 'flex', flexDirection: 'column', gap: Math.round(size * 0.55), textAlign: center ? 'center' : 'left', color: ink }}>{bs.map((b, i) => <Block key={i} b={b} size={size} codeSize={codeSize} ink={ink} />)}</div>;
}

function FlipCard({ flipped, front, back, radius = 22, compact }) {
  const face = (f, isBack) => (
    <div style={{ position: 'absolute', inset: 0, borderRadius: radius, background: CARD.bg, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: isBack ? 'rotateY(180deg)' : 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.3), 0 24px 60px rgba(0,0,0,0.4)', color: CARD.ink }}>
      <div style={{ position: 'absolute', inset: 0, backgroundImage: NOISE, mixBlendMode: 'multiply', opacity: 0.5, pointerEvents: 'none' }}></div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: compact ? '10px 16px' : '11px 20px', minHeight: 28, borderBottom: `1px solid ${CARD.ink}20`, position: 'relative', flexShrink: 0 }}>
        <span style={{ fontFamily: ET.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', opacity: 0.55 }}>{f.label}</span>
        {f.mid}
        <span style={{ display: 'flex', alignItems: 'center' }}>{f.right}</span>
      </div>
      <div style={{ flex: 1, position: 'relative', minHeight: 0 }}>{f.body}</div>
    </div>
  );
  return (
    <div style={{ perspective: 1800, height: '100%', width: '100%' }}>
      <div style={{ position: 'relative', height: '100%', transformStyle: 'preserve-3d', transition: 'transform 380ms cubic-bezier(0.4,0,0.2,1)', transform: flipped ? 'rotateY(180deg)' : 'none' }}>
        {face(front, false)}{face(back, true)}
      </div>
    </div>
  );
}

function QA({ face, setFace, style }) {
  return (
    <div style={{ display: 'flex', gap: 4, padding: 4, borderRadius: 999, background: ET.bgCard, ...style }}>
      {['question', 'answer'].map(f => (
        <button key={f} type="button" onClick={e => { e.stopPropagation(); setFace(f); }} style={{ padding: '6px 16px', borderRadius: 999, border: 'none', cursor: 'pointer', fontFamily: ET.mono, fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', background: face === f ? '#F5F5F7' : 'transparent', color: face === f ? '#0A0A0B' : 'rgba(245,245,247,0.4)' }}>{f === 'question' ? 'Q' : 'A'}</button>
      ))}
    </div>
  );
}

const svg = (d, extra) => ({ size = 16, color = 'currentColor', stroke = 1.7 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round">{d.map((p, i) => <path key={i} d={p}></path>)}{extra}</svg>
);
const Ic = {
  back: svg(['M15 6l-6 6 6 6']),
  arrowR: svg(['M5 12h14', 'M13 6l6 6-6 6']),
  plus: svg(['M12 5v14', 'M5 12h14']),
  x: svg(['M6 6l12 12', 'M18 6L6 18']),
  code: svg(['M8 8l-4 4 4 4', 'M16 8l4 4-4 4', 'M14 5l-4 14']),
  sigma: svg(['M18 5H6l6 7-6 7h12']),
  image: svg(['M4 5h16v14H4z', 'M4 16l5-5 4 4 2-2 5 5', 'M15.5 9.5h.01']),
  list: svg(['M9 6h11', 'M9 12h11', 'M9 18h11', 'M4.5 6h.01', 'M4.5 12h.01', 'M4.5 18h.01']),
  text: svg(['M5 6h14', 'M12 6v13', 'M9 19h6']),
  check: svg(['M5 12.5l4.5 4.5L19 7']),
};

function useSession(start = 4) {
  const [n, setN] = useState(start); const [anim, setAnim] = useState(null); const [toast, setToast] = useState(null); const [saved, setSaved] = useState(['Big-O of binary search?', 'Define a complete binary tree', 'Stable vs unstable sort']);
  const saveNext = (q, reset) => {
    setAnim('out');
    setTimeout(() => { reset(); setSaved(s => [...s, (q || 'Untitled').split('\n')[0].replace(/[`*$#]/g, '').slice(0, 48)]); setToast(`Card ${n} saved`); setN(x => x + 1); setAnim('in'); requestAnimationFrame(() => requestAnimationFrame(() => setAnim(null))); setTimeout(() => setToast(null), 1800); }, 200);
  };
  const cardStyle = { height: '100%', transition: anim === 'in' ? 'none' : 'transform 200ms cubic-bezier(0.4,0,0.2,1), opacity 200ms', transform: anim === 'out' ? 'translateX(-48px)' : anim === 'in' ? 'translateX(48px)' : 'none', opacity: anim ? 0 : 1 };
  return { n, toast, saved, saveNext, cardStyle };
}

function Toast({ text }) {
  return <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: ET.mono, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: ET.muted, opacity: text ? 1 : 0, transition: 'opacity 240ms' }}><Ic.check size={13} color="#B8DFC4" stroke={2.2} />{text || ' '}</span>;
}

function Btn({ primary, children, onClick, kbd, small }) {
  return (
    <button type="button" onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: small ? '7px 14px' : '9px 16px', borderRadius: 10, cursor: 'pointer', fontFamily: ET.sans, fontSize: small ? 12 : 13.5, fontWeight: 500, background: primary ? ET.text : 'transparent', color: primary ? ET.bg : ET.muted, border: primary ? 'none' : `1px solid ${ET.border}` }}>
      {children}
      {kbd && <kbd style={{ fontFamily: ET.mono, fontSize: 10, padding: '1px 5px', borderRadius: 4, border: `1px solid ${primary ? 'rgba(0,0,0,0.18)' : ET.borderStrong}`, color: primary ? 'rgba(10,10,11,0.55)' : ET.faint }}>{kbd}</kbd>}
    </button>
  );
}

function KeyHint({ k, label }) {
  return <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontFamily: ET.mono, fontSize: 10, padding: '4px 10px', borderRadius: 999, border: `1px solid ${ET.borderStrong}`, color: ET.text }}>{k}</span><span style={{ fontFamily: ET.mono, fontSize: 10, letterSpacing: 0.8, textTransform: 'uppercase', color: ET.faint }}>{label}</span></span>;
}

function DesktopShell({ children, hints, onKeyDown }) {
  return (
    <div tabIndex={-1} onKeyDown={onKeyDown} style={{ width: '100%', height: '100%', background: ET.bg, color: ET.text, fontFamily: ET.sans, display: 'flex', flexDirection: 'column', outline: 'none' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0 28px', height: 56, borderBottom: `1px solid ${ET.border}`, flexShrink: 0 }}>
        <Ic.back size={16} color={ET.muted} />
        <span style={{ fontSize: 14 }}>Algorithms<span style={{ color: ET.faint }}> · New card</span></span>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '12px 28px', borderTop: `1px solid ${ET.border}`, flexShrink: 0 }}>{hints}</div>
    </div>
  );
}

function DesktopFooter({ ses, onSave, onSaveNext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
      <span style={{ fontFamily: ET.mono, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: ET.faint }}>Card #{ses.n} · Algorithms</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Toast text={ses.toast} />
        <Btn>Cancel</Btn>
        <Btn onClick={onSave}>Save</Btn>
        <Btn primary kbd="⌘↵" onClick={onSaveNext}>Save &amp; next</Btn>
      </div>
    </div>
  );
}

function MobileShell({ children, onSave, n }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: ET.bg, color: ET.text, fontFamily: ET.sans, paddingTop: 54 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2px 16px 10px', flexShrink: 0 }}>
        <div style={{ width: 34, height: 34, borderRadius: 999, background: ET.bgCard, border: `1px solid ${ET.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Ic.back size={16} /></div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: ET.muted }}>Algorithms · New card</div>
          <div style={{ fontFamily: ET.mono, fontSize: 10, color: ET.faint, marginTop: 1 }}>card {n}</div>
        </div>
        <button type="button" onClick={onSave} style={{ padding: '7px 14px', borderRadius: 999, background: ET.text, color: ET.bg, border: 'none', fontFamily: ET.sans, fontSize: 12, fontWeight: 500, cursor: 'pointer' }}>Save</button>
      </div>
      {children}
    </div>
  );
}

function fmt(ta, val, set, kind) {
  const s = ta ? ta.selectionStart : val.length, e = ta ? ta.selectionEnd : val.length; const sel = val.slice(s, e);
  const W = { bold: ['**', '**'], italic: ['*', '*'], code: (sel.includes('\n') || !sel) ? ['\n```python\n', '\n```\n'] : ['`', '`'], math: ['$', '$'], list: ['\n- ', ''], image: ['\n![image](upload)\n', ''] }[kind];
  set(val.slice(0, s) + W[0] + sel + W[1] + val.slice(e));
  requestAnimationFrame(() => { if (ta) { ta.focus(); ta.selectionStart = s + W[0].length; ta.selectionEnd = s + W[0].length + sel.length; } });
}

Object.assign(window, { ET, CARD, NOISE, SAMPLE_Q, SAMPLE_A, parseMD, inlineHTML, tex, CodeBlock, ImageSlot, Block, Rich, FlipCard, QA, Ic, useSession, Toast, Btn, KeyHint, DesktopShell, DesktopFooter, MobileShell, fmt });
