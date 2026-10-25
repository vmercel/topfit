"use client";

import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, BookOpen, Check, CheckCircle2, ChevronDown, Code2, Database, LoaderCircle, Play, RotateCcw, Search, Square, Terminal, Trophy } from 'lucide-react';
import pythonData from '@/lib/coding/python.json';
import sqlData from '@/lib/coding/sql.json';
import type { CodingTest, Lesson, RunResult, SQLTest } from '@/lib/coding/types';
import './coding-practice.css';
import SolutionDiagram from './SolutionDiagram';

const lessons = [...pythonData, ...sqlData] as Lesson[];
const storageKey = 'topfit-coding-v1';
const starter = (lesson: Lesson) => lesson.track === 'python'
  ? `def solve(${lesson.args}):\n    # Write your solution here.\n    pass\n`
  : '-- Write your SQLite solution here.\n-- Use the schema and example below.\n';
type Saved = { drafts: Record<string, string>; solved: string[] };
const emptySaved: Saved = { drafts: {}, solved: [] };
function format(value: unknown) { return JSON.stringify(value, null, 2); }

export default function CodingPractice() {
  const [track, setTrack] = useState<'python' | 'sql'>('python');
  const [selected, setSelected] = useState(lessons[0].id);
  const [query, setQuery] = useState('');
  const [pattern, setPattern] = useState('All patterns');
  const [difficulty, setDifficulty] = useState('All levels');
  const [saved, setSaved] = useState<Saved>(emptySaved);
  const [hydrated, setHydrated] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [step, setStep] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [mobilePane, setMobilePane] = useState<'theory' | 'practice'>('theory');
  const [status, setStatus] = useState<'idle' | 'loading' | 'running'>('idle');
  const [results, setResults] = useState<RunResult[]>([]);
  const [error, setError] = useState('');
  const [output, setOutput] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [customRun, setCustomRun] = useState(false);
  const worker = useRef<Worker | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runId = useRef(0);
  const lesson = lessons.find(l => l.id === selected) ?? lessons[0];
  const code = saved.drafts[lesson.id] ?? starter(lesson);
  const trackLessons = lessons.filter(l => l.track === track);
  const patterns = [...new Set(trackLessons.map(l => l.pattern))];
  const filtered = trackLessons.filter(l =>
    (pattern === 'All patterns' || l.pattern === pattern) &&
    (difficulty === 'All levels' || l.difficulty === difficulty) &&
    `${l.title} ${l.pattern}`.toLowerCase().includes(query.toLowerCase()));
  const completed = trackLessons.filter(l => saved.solved.includes(l.id)).length;

  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
    if (!active) return;
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const data = JSON.parse(raw);
        if (data && typeof data.drafts === 'object' && data.drafts !== null && !Array.isArray(data.drafts) && Array.isArray(data.solved)) {
          setSaved({ drafts: Object.fromEntries(Object.entries(data.drafts).filter((entry): entry is [string, string] => typeof entry[1] === 'string')), solved: data.solved.filter((s: unknown) => typeof s === 'string') });
        }
      }
    } catch { setStorageError(true); }
    setHydrated(true);
    const params = new URLSearchParams(window.location.search);
    const found = lessons.find(l => l.id === params.get('problem'));
    if (found) { setSelected(found.id); setTrack(found.track); }
    });
    return () => { active = false; worker.current?.terminate(); if (timer.current) clearTimeout(timer.current); };
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(storageKey, JSON.stringify(saved)); }
    catch { queueMicrotask(() => setStorageError(true)); }
  }, [saved, hydrated]);

  function stop() {
    runId.current += 1;
    worker.current?.terminate(); worker.current = null;
    if (timer.current) clearTimeout(timer.current);
    setStatus('idle');
  }
  function choose(next: Lesson) {
    stop(); setSelected(next.id); setStep(0); setReveal(false); setResults([]); setError(''); setOutput(''); setCustomMode(false); setCustomInput('');
    const url = new URL(window.location.href); url.searchParams.set('problem', next.id);
    window.history.replaceState(null, '', url);
  }
  function switchTrack(next: 'python' | 'sql') {
    setTrack(next); setPattern('All patterns'); setDifficulty('All levels'); setQuery('');
    choose(lessons.find(l => l.track === next)!);
  }
  function edit(value: string) { setSaved(s => ({ ...s, drafts: { ...s.drafts, [lesson.id]: value } })); }
  function run(custom = false) {
    stop(); setError(''); setResults([]); setOutput(''); setCustomRun(custom);
    let input: unknown;
    if (custom) {
      try { input = JSON.parse(customInput || JSON.stringify((lesson.tests[0] as CodingTest).input)); if (!Array.isArray(input)) throw new Error(); }
      catch { setError('Custom input must be a JSON array of function arguments, for example [[2,7,11,15],9].'); return; }
    }
    setStatus('loading');
    const activeId = runId.current;
    const w = new Worker('/coding/runner.js'); worker.current = w;
    const timeout = (ms: number, message: string) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => { stop(); setError(message); }, ms);
    };
    timeout(90000, 'Runtime loading timed out. Check your connection and try again.');
    w.onmessage = ({ data }) => {
      if (activeId !== runId.current) return;
      if (data.status === 'running') { setStatus('running'); timeout(12000, 'Execution stopped after 12 seconds. Check for an infinite loop or reduce input size.'); }
      if (data.status === 'error' || data.status === 'done') {
        stop();
        if (data.error) setError(data.error);
        else {
          setResults(data.results); setOutput(data.output || '');
          if (!custom && data.results.length === lesson.tests.length && data.results.every((r: RunResult) => r.passed)) {
            setSaved(s => ({ ...s, solved: [...new Set([...s.solved, lesson.id])] }));
          }
        }
      }
    };
    w.onerror = () => { stop(); setError('The execution worker failed. Check your connection, then retry.'); };
    w.postMessage({ track: lesson.track, code, tests: lesson.tests, verifyQuery: lesson.verifyQuery, ...(custom ? { custom: input } : {}) });
  }
  const example = lesson.tests[0];
  const lessonIndex = trackLessons.findIndex(l => l.id === lesson.id);
  return (
    <main className="coding-studio">
      <header className="studio-heading">
        <div><p className="studio-eyebrow"><span /> THE PRACTICE ROOM</p><h1>Understand it. <em>Then build it.</em></h1><p>Learn the pattern, trace the approach, and make the solution your own.</p></div>
        <div className="studio-progress"><Trophy size={20}/><div><strong>{completed}<span> / {trackLessons.length}</span></strong><small>{track === 'python' ? 'Python problems' : 'SQL patterns'} completed</small></div><progress value={completed} max={trackLessons.length} aria-label="Track progress" /></div>
      </header>
      <div className="studio-track" role="group" aria-label="Practice track">
        <button className={track === 'python' ? 'active' : ''} onClick={() => switchTrack('python')} aria-pressed={track === 'python'}><Code2 size={17}/> Python 75 <span>Algorithms & data structures</span></button>
        <button className={track === 'sql' ? 'active' : ''} onClick={() => switchTrack('sql')} aria-pressed={track === 'sql'}><Database size={17}/> SQL engineering <span>40 essential patterns</span></button>
        <p>Drafts & progress {storageError ? 'are not being saved' : 'saved on this browser'}</p>
      </div>
      {storageError && <p className="studio-notice" role="status">Browser storage is unavailable or full. You can still practice, but changes may not persist.</p>}
      <div className="studio-layout">
        <aside className="problem-library" aria-label="Problem library">
          <div className="library-title"><h2>The library</h2><span>{filtered.length} problems</span></div>
          <label className="library-search"><Search size={16}/><input aria-label="Search problems" placeholder="Find a problem or pattern…" value={query} onChange={e => setQuery(e.target.value)} /></label>
          <div className="library-filters"><label className="sr-only" htmlFor="pattern-filter">Pattern</label><select id="pattern-filter" value={pattern} onChange={e => setPattern(e.target.value)}><option>All patterns</option>{patterns.map(p => <option key={p}>{p}</option>)}</select><label className="sr-only" htmlFor="level-filter">Difficulty</label><select id="level-filter" value={difficulty} onChange={e => setDifficulty(e.target.value)}><option>All levels</option><option>Easy</option><option>Medium</option><option>Hard</option></select></div>
          <div className="problem-list">{filtered.length === 0 && <p className="empty-library">No matches. Try another search or clear the filters.</p>}{filtered.map(l => <button key={l.id} className={`problem-item ${lesson.id === l.id ? 'selected' : ''}`} onClick={() => choose(l)} aria-current={lesson.id === l.id ? 'true' : undefined}><span className={`problem-check ${saved.solved.includes(l.id) ? 'complete' : ''}`}>{saved.solved.includes(l.id) ? <Check size={12}/> : String(trackLessons.indexOf(l)+1).padStart(2,'0')}</span><span className="problem-name">{l.title}<small>{l.pattern}</small></span><span className={`difficulty-dot ${l.difficulty.toLowerCase()}`} title={l.difficulty}/></button>)}</div>
          <p className="library-footnote">An independently curated interview collection with original explanations. Common LeetCode-style patterns; not affiliated with LeetCode or a measured frequency ranking.</p>
        </aside>
        <section className="lesson-workspace" aria-label={lesson.title}>
          <div className="lesson-heading"><div><p>{lesson.pattern} <span>/</span> {String(lessonIndex+1).padStart(2,'0')} OF {trackLessons.length}</p><h2>{lesson.title}</h2></div><span className={`difficulty-badge ${lesson.difficulty.toLowerCase()}`}>{lesson.difficulty}</span></div>
          <p className="lesson-prompt">{lesson.prompt}</p>
          <div className="mobile-panes" role="group" aria-label="Workspace section"><button aria-pressed={mobilePane === 'theory'} onClick={() => setMobilePane('theory')}><BookOpen size={15}/> Theory</button><button aria-pressed={mobilePane === 'practice'} onClick={() => setMobilePane('practice')}><Terminal size={15}/> Practice</button></div>
          <div className="lesson-panes">
            <section className={`theory-pane ${mobilePane === 'theory' ? 'mobile-visible' : ''}`} aria-label="Theory">
              <div className="pane-heading"><BookOpen size={17}/><h3>01 <span>Theory</span></h3><span className="pane-caption">Understand the why</span></div>
              <div className="theory-body">
                <p className="section-label">THE KEY IDEA</p><p className="key-idea">{lesson.idea}</p>
                <SolutionDiagram lesson={lesson}/><div className="walkthrough"><div className="walkthrough-head"><strong>Walk through the approach</strong><span>{step+1} / {lesson.steps.length}</span></div><div className="flow-steps" aria-label="Solution flow">{lesson.steps.map((_,i) => <button key={i} className={i===step ? 'current' : i<step ? 'visited' : ''} onClick={() => setStep(i)} aria-label={`Walkthrough step ${i+1}`} aria-current={i===step ? 'step' : undefined}>{i<step ? <Check size={14}/> : i+1}</button>)}</div><p aria-live="polite">{lesson.steps[step]}</p><div className="walkthrough-controls"><button onClick={() => setStep(s => s-1)} disabled={step===0} aria-label="Previous walkthrough step"><ArrowLeft size={15}/></button><span>Follow the reasoning</span><button onClick={() => setStep(s => s+1)} disabled={step===lesson.steps.length-1} aria-label="Next walkthrough step"><ArrowRight size={15}/></button></div></div>
                <div className="complexity-note"><p className="section-label">{track==='python' ? 'COST & TRADE-OFF' : 'ENGINEERING NOTE'}</p><p>{lesson.complexity}</p></div>
                <button className="solution-toggle" aria-expanded={reveal} onClick={() => setReveal(!reveal)}><Code2 size={16}/>{reveal ? 'Hide' : 'Reveal'} {track === 'python' ? 'Python' : 'SQL'} solution<ChevronDown size={15}/></button>
                {reveal && <div className="reference-solution"><p>Reference solution · Compare after your attempt</p><pre><code>{lesson.solution}</code></pre>{track==='sql' && <details><summary>Use this query from Python</summary><pre><code>{`import sqlite3\n\n# Use your application's database connection.\nconnection = sqlite3.connect("practice.db")\nquery = ${JSON.stringify(lesson.solution)}\n# For one SELECT statement:\nrows = connection.execute(query).fetchall()\nprint(rows)\n# For multi-statement scripts, use executescript instead.`}</code></pre></details>}</div>}
                <details className="example-details" open><summary>{track === 'python' ? 'Example & function contract' : 'Schema & sample data'}</summary>{track === 'python' ? <><p>Implement <code>solve({lesson.args})</code>. JSON input is an array of positional arguments. Return a JSON-compatible value; do not print your answer.</p><pre>{`Input arguments:\n${format((example as CodingTest).input)}\n\nExpected return:\n${format(example.expected)}`}</pre></> : <><p>SQLite 3 dialect. Every run starts with a fresh database. Results must use the requested column names and row order. Engineering tasks are checked by inspecting the resulting database.</p><pre>{(example as SQLTest).setup}</pre><p>Expected result</p><ResultValue value={example.expected}/></>}</details>
              </div>
            </section>
            <section className={`practice-pane ${mobilePane === 'practice' ? 'mobile-visible' : ''}`} aria-label="Practice">
              <div className="pane-heading"><Terminal size={17}/><h3>02 <span>Practice</span></h3><span className="pane-caption">{track==='python' ? 'Python 3' : 'SQLite'}</span></div>
              <div className="editor-toolbar"><span><span className="editor-dot"/>{track==='python' ? 'solution.py' : 'query.sql'}</span><button onClick={() => { if (window.confirm('Reset this draft to the starter? Your completed status will be kept.')) edit(starter(lesson)); }} disabled={status!=='idle'} aria-label="Reset code"><RotateCcw size={14}/> Reset</button></div>
              <div className="code-editor"><div aria-hidden="true" className="line-numbers">{code.split('\n').map((_,i) => <div key={i}>{i+1}</div>)}</div><textarea aria-label={`${track==='python' ? 'Python' : 'SQL'} code editor`} spellCheck={false} autoCapitalize="off" autoCorrect="off" value={code} disabled={!hydrated || status!=='idle'} onChange={e => edit(e.target.value)} onKeyDown={e => { if (e.key === 'Tab') { e.preventDefault(); const el=e.currentTarget, start=el.selectionStart, end=el.selectionEnd; edit(code.slice(0,start)+'    '+code.slice(end)); requestAnimationFrame(() => { el.selectionStart=el.selectionEnd=start+4; }); } if ((e.ctrlKey || e.metaKey) && e.key==='Enter' && status==='idle') { e.preventDefault(); run(); } }}/></div>
              <div className="run-toolbar"><span>{track==='python' ? 'Ctrl / ⌘ + Enter to run' : 'Fresh database for each fixture'}</span>{status==='idle' ? <button className="run-button" onClick={() => run()} disabled={!hydrated}><Play size={15}/> Run tests</button> : <button className="run-button stop" onClick={stop}><Square size={14}/> Stop</button>}</div>
              {track==='python' && <div className="custom-input"><button aria-expanded={customMode} onClick={() => setCustomMode(!customMode)}>Custom input <ChevronDown size={14}/></button>{customMode && <><label htmlFor="custom-args">JSON array of arguments · Output only, does not mark complete</label><textarea id="custom-args" value={customInput || JSON.stringify((example as CodingTest).input)} onChange={e => setCustomInput(e.target.value)} spellCheck={false}/><button onClick={() => run(true)} disabled={status!=='idle'}>Run custom input <Play size={13}/></button></>}</div>}
              <div className="test-output" aria-live="polite"><div className="output-heading"><span><Terminal size={15}/> Results</span>{saved.solved.includes(lesson.id) && <span className="solved-label"><CheckCircle2 size={14}/> Completed</span>}</div>{status!=='idle' && <p className="runtime-status"><LoaderCircle className="animate-spin" size={17}/>{status==='loading' ? 'Loading runtime… First run may take a minute.' : 'Running your solution…'}</p>}{error && <p className="run-error" role="alert">{error}</p>}{status==='idle' && !error && results.length===0 && <div className="output-empty"><Code2 size={24}/><strong>Your next breakthrough starts here.</strong><p>Write your solution, run the tests, and learn from the result.</p></div>}{results.length>0 && <><p className={`results-summary ${!customRun && results.every(r => r.passed) ? 'passed' : ''}`}>{customRun ? 'Custom run complete' : `${results.filter(r => r.passed).length} / ${lesson.tests.length} checks passed`}</p>{results.map((r,i) => <details className="case-result" key={i} open={customRun || !r.passed}><summary><span className={r.passed ? 'pass-symbol' : ''}>{customRun ? '○' : r.passed ? '✓' : '×'}</span>{r.label}<small>{customRun ? 'Output' : r.passed ? 'Passed' : 'Needs another look'}</small></summary>{r.error ? <pre className="run-error">{r.error}</pre> : <><p>Your output</p><ResultValue value={r.actual}/></>}{!customRun && <><p>Expected</p><ResultValue value={r.expected}/></>}</details>)}</>}{output && <details><summary>Console output</summary><pre>{output}</pre></details>}</div>
              <p className="runner-note">Code runs locally in a browser worker. Runtime downloads require an internet connection. Passing these practice checks is feedback, not a guarantee for every possible input.</p>
            </section>
          </div>
          <div className="lesson-pagination"><button disabled={lessonIndex===0} onClick={() => choose(trackLessons[lessonIndex-1])}><ArrowLeft size={15}/> Previous problem</button><span>{lessonIndex+1} / {trackLessons.length}</span><button disabled={lessonIndex===trackLessons.length-1} onClick={() => choose(trackLessons[lessonIndex+1])}>Next problem <ArrowRight size={15}/></button></div>
        </section>
      </div>
    </main>
  );
}

function ResultValue({ value }: { value: unknown }) {
  if (value && typeof value==='object' && 'columns' in value && 'values' in value) {
    const table=value as { columns: string[]; values: unknown[][] };
    return <div className="result-table"><table><thead><tr>{table.columns.map((c,i) => <th key={i}>{c}</th>)}</tr></thead><tbody>{table.values.map((row,i) => <tr key={i}>{row.map((cell,j) => <td key={j}>{cell===null ? <em>NULL</em> : String(cell)}</td>)}</tr>)}</tbody></table>{table.values.length===0 && <p>0 rows</p>}</div>;
  }
  return <pre>{format(value) ?? 'No output'}</pre>;
}
