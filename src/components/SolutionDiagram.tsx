import type { CodingTest, Lesson } from '@/lib/coding/types';

const palette = { ink:'#31503b', faint:'#98ae8c', line:'#bacdb0', fill:'#e8f0e0', accent:'#be8957' };
const display = (v: unknown) => typeof v==='string' ? v : JSON.stringify(v);
function Node({ x, y, label, hot = false }: { x:number; y:number; label:string; hot?:boolean }) {
  return <g><rect x={x-18} y={y-17} width="36" height="34" rx="9" fill={hot ? '#24523d' : '#fafff5'} stroke={hot ? '#24523d' : palette.line}/><text x={x} y={y+4} textAnchor="middle" fontSize={label.length>4 ? 8 : 11} fontFamily="monospace" fill={hot ? '#e0efce' : palette.ink}>{label.length>7 ? label.slice(0,6)+'…' : label}</text></g>;
}
function Edge({ x1,y1,x2,y2,arrow=false }: { x1:number; y1:number; x2:number; y2:number; arrow?:boolean }) {
  return <g><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={palette.line} strokeWidth="1.5"/>{arrow && <path d={`M${x2-4},${y2-3} L${x2},${y2} L${x2-4},${y2+3}`} fill="none" stroke={palette.line} strokeWidth="1.5"/>}</g>;
}

export default function SolutionDiagram({ lesson }: { lesson: Lesson }) {
  const input = (lesson.tests[0] as CodingTest).input;
  const expected = lesson.tests[0].expected;
  let drawing: React.ReactNode;
  let caption: string;
  if (lesson.track==='sql') {
    const department = /employee|department|salar|manager|hierarchy/.test(lesson.prompt);
    const events = /cohort|funnel|island|event|spine/.test(lesson.title.toLowerCase());
    const tables = department ? [['departments','PK id','name'],['employees','FK department_id','salary · manager_id']] : events ? [['events','user_id · event_date','event_type'],['users / dates','cohort or partition','one group per key']] : [['customers','PK id','name · email'],['orders','FK customer_id','amount · ordered_at']];
    caption = department ? 'Join on department_id → id. A unique parent key prevents accidental row multiplication.' : events ? 'Choose the user and date grain first. Grouping and ordering determine the meaning of the metric.' : 'One customer can have many orders. Aggregate at the intended grain before combining results.';
    drawing = <svg viewBox="0 0 340 184" role="img" aria-label="SQL relationships and query processing"><Edge x1={144} y1={52} x2={194} y2={52}/><text x="169" y="43" textAnchor="middle" fontSize="8" fill={palette.faint}>{events ? 'grain' : '1 → many'}</text>{tables.map((t,i) => <g key={t[0]} transform={`translate(${i*188+8},10)`}><rect width="136" height="88" rx="9" fill="#fbfff6" stroke={palette.line}/><path d="M0,30 H136" stroke={palette.line}/><text x="10" y="20" fontSize="10" fontWeight="600" fill={palette.ink}>{t[0]}</text><text x="10" y="49" fontSize="8" fill={palette.ink}>{t[1]}</text><text x="10" y="68" fontSize="8" fill={palette.faint}>{t[2]}</text></g>)}<path d="M76 100 V117 H264 V100 M170 117 V135" fill="none" stroke={palette.line} strokeDasharray="3 3"/><rect x="63" y="135" width="214" height="35" rx="8" fill="#24523d"/><text x="170" y="149" textAnchor="middle" fontSize="8" fill="#b5cda4">{lesson.pattern.toUpperCase()}</text><text x="170" y="162" textAnchor="middle" fontSize="9" fill="#e3f0d5">{lesson.pattern==='Engineering' || lesson.title.includes('indexes') ? 'Apply change → verify database state' : 'Filter → transform → return ordered rows'}</text></svg>;
  } else if (lesson.id==='two-sum') {
    caption='The complement is the missing piece. Look it up before saving the current number.';
    drawing=<svg viewBox="0 0 340 190" role="img" aria-label="Two Sum: 2 plus 7 equals 9. Hash map lookup finds index zero."><text x="16" y="19" fontSize="9" fill={palette.faint}>nums</text>{[2,7,11,15].map((v,i) => <g key={i}><Node x={55+i*70} y={52} label={String(v)} hot={i===1}/><text x={55+i*70} y={82} textAnchor="middle" fontSize="8" fill={palette.faint}>index {i}</text></g>)}<path d="M125 72 V103 H70 V122" fill="none" stroke={palette.accent} strokeWidth="1.5" strokeDasharray="4 3"/><rect x="15" y="123" width="120" height="50" rx="8" fill="#fbfff6" stroke={palette.line}/><text x="28" y="141" fontSize="8" fill={palette.faint}>SEEN MAP</text><text x="28" y="160" fontSize="12" fontFamily="monospace" fill={palette.ink}>2 → index 0</text><rect x="161" y="113" width="162" height="60" rx="8" fill="#24523d"/><text x="176" y="133" fontSize="9" fill="#b9d2ab">target − current = need</text><text x="176" y="153" fontSize="15" fontFamily="monospace" fill="#e0efce">9 − 7 = 2 ✓</text></svg>;
  } else if (lesson.pattern==='Trees' && !lesson.id.includes('traversals')) {
    const values = input?.[0] as (number|null)[];
    const nodes: {value:number; x:number; y:number; depth:number}[]=[];
    const edges: {x1:number;y1:number;x2:number;y2:number}[]=[];
    if (Array.isArray(values) && values.length && values[0]!==null) {
      nodes.push({value:values[0],x:170,y:30,depth:0}); let cursor=1;
      for (let i=0;i<nodes.length && cursor<values.length;i++) {
        const parent=nodes[i];
        for (const direction of [-1,1]) {
          const v=values[cursor++];
          if (v!==undefined && v!==null) {
            const x=parent.x+direction*(88/2**parent.depth),y=parent.y+58;
            nodes.push({value:v,x,y,depth:parent.depth+1}); edges.push({x1:parent.x,y1:parent.y+17,x2:x,y2:y-17});
          }
        }
      }
    }
    caption='Read the example tree from the root downward. Each branch preserves the parent–child relationship.';
    drawing=<svg viewBox="0 0 340 220" role="img" aria-label={`Example tree for ${lesson.title}`}>{edges.filter(e=>e.y2<200).map((e,i)=><Edge key={i} {...e}/>)}{nodes.filter(n=>n.y<210).map((n,i)=><Node key={i} x={n.x} y={n.y} label={String(n.value)} hot={i===0}/>)}<text x="8" y="215" fontSize="8" fill={palette.faint}>root → left subtree / right subtree</text></svg>;
  } else if (lesson.pattern==='Matrices' || lesson.id==='word-search' || lesson.id==='word-search-ii' || lesson.id==='number-of-islands' || lesson.id==='pacific-atlantic-water-flow') {
    const grid=input?.[0] as unknown[][]; const rows=grid?.slice(0,5) ?? []; const cols=Math.min(rows[0]?.length ?? 0,7);
    caption='Coordinates matter: orthogonal neighbors share an edge. Use the walkthrough to see which cells the algorithm visits or changes.';
    drawing=<svg viewBox="0 0 340 210" role="img" aria-label={`Example input grid for ${lesson.title}`}>{rows.map((row,r)=>row.slice(0,7).map((value,c)=><g key={`${r}-${c}`}><rect x={170-cols*20+c*40} y={15+r*34} width="34" height="28" rx="6" stroke={palette.line} fill={value===0 ? '#e5ecdd' : '#fbfff6'}/><text x={187-cols*20+c*40} y={33+r*34} textAnchor="middle" fontSize="11" fill={palette.ink}>{display(value)}</text></g>))}<text x="170" y="201" textAnchor="middle" fontSize="9" fill={palette.faint}>row, column · example input</text></svg>;
  } else if (lesson.pattern==='Graphs') {
    let count=typeof input?.[0]==='number' ? input[0] as number : 4;
    let edgePairs: number[][]=[];
    if (lesson.id==='clone-graph') { const adj=input[0] as number[][]; count=adj.length; edgePairs=adj.flatMap((list,a)=>list.filter(b=>b>a).map(b=>[a,b])); }
    else if (Array.isArray(input?.[1])) edgePairs=input[1] as number[][];
    const directed=lesson.id==='course-schedule';
    if(directed) edgePairs=edgePairs.map(([a,b])=>[b,a]);
    const points=Array.from({length:Math.min(count,8)},(_,i)=>({x:170+90*Math.cos(i*2*Math.PI/Math.min(count,8)-Math.PI/2),y:100+70*Math.sin(i*2*Math.PI/Math.min(count,8)-Math.PI/2)}));
    caption=directed ? 'An arrow points from prerequisite to dependent course. A directed cycle prevents a valid schedule.' : 'Each line is a relationship from the example. Traversal or union-find reveals connectivity.';
    if(lesson.id==='alien-dictionary') {caption='Adjacent words reveal character precedence: the first differing pair creates a directed constraint.';drawing=<svg viewBox="0 0 340 160" role="img" aria-label="Alien dictionary character precedence w to e to r to t to f">{['w','e','r','t','f'].map((c,i)=><g key={c}>{i<4&&<Edge x1={46+i*64} y1={70} x2={74+i*64} y2={70} arrow/>}<Node x={28+i*64} y={70} label={c} hot={i===0}/></g>)}<text x="170" y="124" textAnchor="middle" fontSize="9" fill={palette.faint}>constraints → topological character order</text></svg>;} else drawing=<svg viewBox="0 0 340 200" role="img" aria-label={`Example graph for ${lesson.title}`}>{edgePairs.map(([a,b],i)=>points[a]&&points[b]&&<Edge key={i} x1={points[a].x} y1={points[a].y} x2={points[b].x} y2={points[b].y} arrow={directed}/>)}{points.map((p,i)=><Node key={i} {...p} label={String(i)} hot={i===0}/>)}</svg>;
  } else if (lesson.pattern==='Intervals') {
    const intervals=(input?.[0] as number[][]).slice(0,5); const max=Math.max(1,...intervals.flat());
    caption='Horizontal position represents time. Overlapping bars compete for the same span; endpoint rules are stated in the problem.';
    drawing=<svg viewBox="0 0 340 190" role="img" aria-label={`Example interval timeline for ${lesson.title}`}><line x1="24" y1="23" x2="317" y2="23" stroke={palette.line}/>{[0,.25,.5,.75,1].map((x,i)=><g key={i}><line x1={24+x*290} y1="19" x2={24+x*290} y2="168" stroke={palette.line} strokeDasharray="2 5" opacity=".5"/><text x={24+x*290} y="13" textAnchor="middle" fontSize="8" fill={palette.faint}>{Math.round(x*max)}</text></g>)}{intervals.map(([a,b],i)=><g key={i}><rect x={24+a/max*290} y={36+i*27} width={Math.max(5,(b-a)/max*290)} height="19" rx="5" fill={i%2 ? '#c3d8b4' : '#527b4d'}/><text x={28+a/max*290} y={49+i*27} fontSize="8" fill={i%2 ? '#31503b' : '#f1f9e7'}>{a} → {b}</text></g>)}</svg>;
  } else if (lesson.pattern==='Linked lists') {
    const values=(input[0] as unknown[]).slice(0,5);
    caption='Boxes represent nodes; arrows represent next pointers. The result below shows the final traversal, not the pointer-changing steps.';
    drawing=<svg viewBox="0 0 340 140" role="img" aria-label={`Input linked list for ${lesson.title}`}><text x="14" y="22" fontSize="8" fill={palette.faint}>HEAD</text>{values.map((v,i)=><g key={i}>{i<values.length-1&&<Edge x1={48+i*63} y1={62} x2={73+i*63} y2={62} arrow/>}<Node x={30+i*63} y={62} label={display(v)} hot={i===0}/></g>)}{lesson.id==='linked-list-cycle'&&<path d="M219 80 V112 H93 V83" fill="none" stroke={palette.accent} strokeDasharray="4 3"/>}<text x="170" y="133" textAnchor="middle" fontSize="8" fill={palette.faint}>{lesson.id==='linked-list-cycle' ? 'tail reconnects to pos = 1' : 'follow next → in traversal order'}</text></svg>;
  } else {
    const raw=typeof input?.[0]==='string' ? [...input[0]] : Array.isArray(input?.[0]) ? input[0] : [input?.[0]];
    const items=raw.slice(0,8);
    caption=lesson.pattern==='Dynamic programming' ? 'Reuse smaller answers rather than recomputing them. The state rule in the walkthrough connects this input to the result.' : lesson.pattern==='Bit manipulation' ? `Bit view of the first input: ${(Number(input[0])>>>0).toString(2).padStart(8,'0')}. Track the bit operation in each walkthrough step.` : lesson.pattern==='Sliding window' || lesson.pattern==='Two pointers' ? 'Position and order matter. A moving boundary or two pointers reduce repeated scanning; follow their movement in the walkthrough.' : lesson.pattern==='Heaps' ? 'A heap exposes the next priority value. Maintain only the ordering information the problem needs.' : 'Start with this example input. The key idea explains which information to retain and which work to avoid.';
    drawing=<svg viewBox="0 0 340 150" role="img" aria-label={`Input sequence for ${lesson.title}`}><text x="12" y="19" fontSize="8" fill={palette.faint}>EXAMPLE INPUT</text>{items.map((v,i)=><g key={i}><rect x={12+i*40} y="39" width="35" height="37" rx="7" fill="#fbfff6" stroke={palette.line}/><text x={29+i*40} y="61" textAnchor="middle" fontSize="10" fill={palette.ink}>{display(v).length>4 ? display(v).slice(0,3)+'…' : display(v)}</text><text x={29+i*40} y="93" textAnchor="middle" fontSize="8" fill={palette.faint}>{i}</text></g>)}{(lesson.pattern==='Sliding window'||lesson.pattern==='Two pointers')&&<path d={`M13 105 V112 H${Math.max(43,items.length*40+5)} V105`} fill="none" stroke={palette.accent} strokeWidth="1.5"/>}<text x="170" y="137" textAnchor="middle" fontSize="9" fill={palette.faint}>{raw.length>8 ? 'first 8 items shown · see the complete input below' : lesson.pattern==='Dynamic programming' ? 'state → transition → reuse' : 'positions reveal the structure'}</text></svg>;
  }
  return <figure className="solution-diagram"><div className="diagram-label"><span>THE PATTERN, VISUALIZED</span><span>EXAMPLE 01</span></div>{drawing}<figcaption>{caption}</figcaption>{lesson.track==='python'&&<div className="diagram-answer"><span>EXAMPLE RESULT</span><code>{display(expected)}</code></div>}</figure>;
}
