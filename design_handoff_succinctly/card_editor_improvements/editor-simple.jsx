// Direction A v2 — GitHub-comment simplicity: one Markdown textarea per face; rendered whenever you're not editing.
function useSimpleFace(init) {
  const [text, setText] = useState(init); const [editing, setEditing] = useState(false);
  const ta = useRef(null), fileIn = useRef(null), pend = useRef(null);
  const focusAt = (a, b = a) => { pend.current = [a, b]; };
  const fit = (tries = 0) => { const el = ta.current; if (!el) return; el.style.height = 'auto'; const h = el.scrollHeight; if (h) el.style.height = h + 'px'; else if (tries < 60) requestAnimationFrame(() => fit(tries + 1)); };
  useEffect(() => { if (!editing) return; const el = ta.current; if (!el) return; const ro = new ResizeObserver(() => fit()); ro.observe(el.parentElement); fit(); const t = setTimeout(() => fit(), 400); document.fonts && document.fonts.ready.then(() => fit()); return () => { ro.disconnect(); clearTimeout(t); }; }, [editing]);
  useLayoutEffect(() => {
    const el = ta.current; if (!el) return;
    fit();
    if (pend.current) { const [a, b] = pend.current; pend.current = null; el.focus({ preventScroll: true }); el.setSelectionRange(a, b); }
  });
  const open = (at) => { setEditing(true); focusAt(at == null ? text.length : at); };
  const close = () => setEditing(false);
  const replace = (a, b, ins, selA, selB) => { const v = text.slice(0, a) + ins + text.slice(b); setText(v); setEditing(true); focusAt(a + selA, a + (selB == null ? selA : selB)); };
  const sel = () => { const el = ta.current; return editing && el ? [el.selectionStart, el.selectionEnd] : [text.length, text.length]; };
  const lineStart = (a) => text.lastIndexOf('\n', a - 1) + 1;
  const fmt = (k) => {
    if (k === 'image') return fileIn.current && fileIn.current.click();
    const [a, b] = sel(); const s = text.slice(a, b);
    const nl = a > 0 && text[a - 1] !== '\n' ? '\n\n' : (a > 0 && text[a - 2] !== '\n' ? '\n' : '');
    if (k === 'bold') return replace(a, b, `**${s}**`, 2, 2 + s.length);
    if (k === 'italic') return replace(a, b, `*${s}*`, 1, 1 + s.length);
    if (k === 'code') { if (s && !s.includes('\n')) return replace(a, b, '`' + s + '`', 1, 1 + s.length); const ins = `${nl}\`\`\`python\n${s}\n\`\`\``; return replace(a, b, ins, nl.length + 10 + s.length); }
    if (k === 'math') { if (s || (a > 0 && text[a - 1] !== '\n')) return replace(a, b, `$${s}$`, 1, 1 + s.length); const ins = `${nl}$$\n${s}\n$$`; return replace(a, b, ins, nl.length + 3 + s.length); }
    if (k === 'list') { const ls = lineStart(a); return replace(ls, ls, '- ', 2 + (a - ls)); }
  };
  const insertImage = (file) => { if (!file || !file.type.startsWith('image/')) return; const [a, b] = sel(); const nl = a > 0 && text[a - 1] !== '\n' ? '\n\n' : ''; const ins = `${nl}![${file.name.replace(/\.\w+$/, '')}](${URL.createObjectURL(file)})\n`; replace(a, b, ins, ins.length); };
  const onKeyDown = (e) => {
    const el = e.currentTarget, mod = e.metaKey || e.ctrlKey, a = el.selectionStart;
    if (e.key === 'Escape') { e.preventDefault(); el.blur(); close(); return; }
    if (mod && (e.key === 'b' || e.key === 'i')) { e.preventDefault(); fmt(e.key === 'b' ? 'bold' : 'italic'); return; }
    const before = text.slice(0, a); const inCode = ((before.match(/^```/gm) || []).length % 2) === 1;
    if (e.key === 'Tab' && inCode) { e.preventDefault(); e.stopPropagation(); replace(a, el.selectionEnd, '    ', 4); return; }
    if (e.key === 'Enter' && !mod && !e.shiftKey && a === el.selectionEnd) {
      const ls = lineStart(a); const line = text.slice(ls, a); const m = line.match(/^(\s*)([-*]) (.*)$/);
      if (m) { e.preventDefault(); if (!m[3]) replace(ls, a, '', 0); else replace(a, a, `\n${m[1]}${m[2]} `, m[1].length + 3); }
    }
  };
  return { text, setText, editing, open, close, fmt, insertImage, onKeyDown, ta, fileIn, reset: (focus) => { setText(''); if (focus) { setEditing(true); focusAt(0); } else setEditing(false); } };
}

const simpleMono = { fontFamily: ET.mono, fontSize: 9.5, letterSpacing: 0.6, textTransform: 'uppercase' };

function SimpleFace({ f, size, codeSize, mobile, bottomPad, placeholder }) {
  const ink = CARD.ink;
  const pad = mobile ? `18px 20px ${bottomPad}px` : `26px 44px ${bottomPad}px`;
  const onDrop = e => { e.preventDefault(); f.insertImage(e.dataTransfer.files[0]); };
  const onPaste = e => { const file = [...(e.clipboardData.files || [])].find(x => x.type.startsWith('image/')); if (file) { e.preventDefault(); f.insertImage(file); } };
  return (
    <div onDragOver={e => e.preventDefault()} onDrop={onDrop} style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: pad, display: 'flex', flexDirection: 'column' }}>
      <input ref={f.fileIn} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { f.insertImage(e.target.files[0]); e.target.value = ''; }} />
      {f.editing ? (
        <>
          <textarea ref={f.ta} rows={3} value={f.text} placeholder={placeholder + '   **bold**  `code`  $math$'} spellCheck={false} onChange={e => f.setText(e.target.value)} onKeyDown={f.onKeyDown} onPaste={onPaste} onBlur={e => { const r = e.relatedTarget; if (r && (r.tagName === 'TEXTAREA' || e.currentTarget.closest('[data-face]').contains(r))) return; f.close(); }} style={{ display: 'block', width: '100%', minHeight: '6em', fieldSizing: 'content', resize: 'none', overflow: 'hidden', outline: 'none', border: 'none', background: 'transparent', color: ink, caretColor: ink, fontFamily: ET.mono, fontSize: mobile ? 12.5 : 14, lineHeight: 1.65, padding: 0 }}></textarea>
          <div style={{ marginTop: 14, paddingTop: 8, borderTop: `1px dashed ${ink}30`, ...simpleMono, color: `${ink}99`, display: 'flex', flexWrap: 'wrap', gap: '4px 12px' }}>
            <span>Markdown supported</span><span>Paste, drop or click to add images</span>
          </div>
        </>
      ) : (
        <div className="seg" onMouseDown={e => { if (e.target.closest('button,a')) return; e.preventDefault(); f.open(); }} style={{ cursor: 'text', display: 'flex', flexDirection: 'column', gap: Math.round(size * 0.55), color: ink, margin: '-6px -10px', padding: '6px 10px', borderRadius: 8 }}>
          {f.text.trim() ? parseMD(f.text).map((b, i) => <Block key={i} b={b} size={size} codeSize={codeSize} ink={ink} />) : <div style={{ fontFamily: ET.display, fontSize: size, opacity: 0.3 }}>{placeholder}</div>}
        </div>
      )}
      <div onMouseDown={e => { e.preventDefault(); if (!f.editing) f.open(); else f.ta.current && f.ta.current.focus(); }} style={{ flex: 1, minHeight: 40, cursor: 'text' }}></div>
    </div>
  );
}

function SimpleFmtBar({ onFmt, color, gap = 2, size = 26 }) {
  const items = [['bold', 'Bold ⌘B', <span style={{ fontFamily: ET.sans, fontWeight: 700, fontSize: 13 }}>B</span>], ['italic', 'Italic ⌘I', <span style={{ fontFamily: ET.display, fontStyle: 'italic', fontSize: 16 }}>I</span>], ['code', 'Code', <Ic.code size={15} />], ['math', 'Math', <Ic.sigma size={14} />], ['list', 'List', <Ic.list size={15} />], ['image', 'Image', <Ic.image size={15} />]];
  return <div style={{ display: 'flex', alignItems: 'center', gap }}>{items.map(([k, t, g]) => <button key={k} type="button" title={t} onMouseDown={e => e.preventDefault()} onClick={() => onFmt(k)} className="fmtbtn" style={{ width: size, height: size, borderRadius: 7, border: 'none', background: 'transparent', color, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>{g}</button>)}</div>;
}

function useSimpleDraft(startFace, editStart) {
  const q = useSimpleFace(SAMPLE_Q), a = useSimpleFace(SAMPLE_A.replace(/(```\w*)[ \t]*\{[^}]*\}/g, '$1'));
  const [face, setFace] = useState(startFace);
  useEffect(() => { if (editStart) (startFace === 'question' ? q : a).open(); }, []);
  const cur = face === 'question' ? q : a;
  const flip = () => { const to = face === 'question' ? 'answer' : 'question'; const from = cur, nxt = to === 'question' ? q : a; const wasEditing = from.editing; setFace(to); if (wasEditing) { nxt.open(); setTimeout(from.close, 420); } else nxt.close(); };
  const reset = () => { a.reset(false); q.reset(true); setFace('question'); };
  return { q, a, face, cur, flip, reset };
}

function EditorSimple_Desktop() {
  const d = useSimpleDraft('answer', false); const ses = useSession();
  const next = () => ses.saveNext(d.q.text, d.reset);
  const onKey = e => {
    const mod = e.metaKey || e.ctrlKey;
    if (e.key === 'Tab') { e.preventDefault(); d.flip(); }
    if (e.key === 'Enter' && mod) { e.preventDefault(); next(); }
  };
  const face = w => {
    const f = w === 'question' ? d.q : d.a;
    return {
      label: w === 'question' ? 'Question' : 'Answer',
      right: <SimpleFmtBar color={CARD.ink} onFmt={f.fmt} />,
      body: <div data-face style={{ position: 'absolute', inset: 0 }}><SimpleFace f={f} size={25} codeSize={13} bottomPad={74} placeholder={w === 'question' ? "What's the question?" : 'Write the answer…'} /><div style={{ position: 'absolute', bottom: 16, left: '50%', transform: 'translateX(-50%)' }}><QA face={d.face} setFace={x => x !== d.face && d.flip()} /></div></div>,
    };
  };
  return (
    <DesktopShell onKeyDown={onKey} hints={<><KeyHint k="Click" label="edit" /><KeyHint k="Esc" label="done" /><KeyHint k="Tab" label="flip" /><KeyHint k="⌘B ⌘I" label="format" /><KeyHint k="⌘↵" label="save & next" /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 22, padding: 24 }}>
        <div style={{ width: '100%', maxWidth: 760, height: 540 }}><div style={ses.cardStyle}><FlipCard flipped={d.face === 'answer'} front={face('question')} back={face('answer')} /></div></div>
        <div style={{ width: '100%', maxWidth: 760 }}><DesktopFooter ses={ses} onSave={() => {}} onSaveNext={next} /></div>
      </div>
    </DesktopShell>
  );
}

function EditorSimple_Mobile() {
  const d = useSimpleDraft('answer', false); const ses = useSession();
  const next = () => ses.saveNext(d.q.text, d.reset);
  const face = w => {
    const f = w === 'question' ? d.q : d.a;
    return {
      label: w === 'question' ? 'Question' : 'Answer',
      right: f.editing ? <button type="button" onMouseDown={e => e.preventDefault()} onClick={f.close} style={{ ...simpleMono, letterSpacing: 0.7, border: 'none', borderRadius: 999, padding: '5px 10px', background: CARD.ink, color: CARD.bg, cursor: 'pointer' }}>Done</button> : null,
      body: <div data-face style={{ position: 'absolute', inset: 0 }}><SimpleFace f={f} mobile size={19} codeSize={10.5} bottomPad={66} placeholder={w === 'question' ? "What's the question?" : 'Write the answer…'} /><div style={{ position: 'absolute', bottom: 14, left: '50%', transform: 'translateX(-50%)' }}><QA face={d.face} setFace={x => x !== d.face && d.flip()} /></div></div>,
    };
  };
  return (
    <MobileShell n={ses.n}>
      <div style={{ flex: 1, minHeight: 0, padding: '0 12px 10px' }}><div style={ses.cardStyle}><FlipCard compact flipped={d.face === 'answer'} front={face('question')} back={face('answer')} /></div></div>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '8px 10px 30px', borderTop: `1px solid ${ET.border}`, background: ET.bgElev }}>
        <SimpleFmtBar color={ET.text} gap={0} size={38} onFmt={d.cur.fmt} />
        <button type="button" onClick={next} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px', borderRadius: 999, background: CARD.bg, color: CARD.ink, border: 'none', fontFamily: ET.sans, fontSize: 12.5, fontWeight: 600, cursor: 'pointer' }}>Next<Ic.arrowR size={14} stroke={2.2} /></button>
      </div>
    </MobileShell>
  );
}

Object.assign(window, { EditorSimple_Desktop, EditorSimple_Mobile });
