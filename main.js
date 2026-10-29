const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
let currentTAC = [];

function setStep(n, state){
  $('step'+n).className = 'step ' + state;
  $('step'+n).querySelector('.num').textContent = state==='done' ? '✓' : state==='fail' ? '✕' : n;
}
function toast(msg){
  const t = $('toast'); t.textContent = msg; t.classList.add('show');
  setTimeout(()=>t.classList.remove('show'), 1800);
}
function showError(m){
  const e = $('error'); e.textContent = m; e.style.display = m ? 'block' : 'none';
}
function showTokens(tokens){
  let h = '<table><tr><th>Lexeme</th><th>Type</th><th>Line</th></tr>';
  tokens.forEach(t => h += `<tr><td>${esc(t.value)}</td><td><span class="chip ${t.type}">${t.type}</span></td><td>${t.line}</td></tr>`);
  $('tokens').innerHTML = h + '</table>';
  $('st-tok').textContent = tokens.length;
}
function highlight(line){
  let s = esc(line);
  s = s.replace(/^(L\d+):$/, '<span class="l">$1:</span>');
  s = s.replace(/\b(ifFalse|goto)\b/g, '<span class="k">$1</span>');
  s = s.replace(/\b(t\d+)\b/g, '<span class="t">$1</span>');
  s = s.replace(/(?<![\w])(L\d+)(?![\w:])/g, '<span class="l">$1</span>');
  s = s.replace(/ (\+|-|\*|\/|==|!=|&lt;|&gt;|=) /g, ' <span class="o">$1</span> ');
  return s;
}
function showTAC(code){
  currentTAC = code;
  $('tac').innerHTML = code.map((c,i)=>`<span class="ln">${i+1}</span>${highlight(c)}`).join('\n');
  $('st-tac').textContent = code.length;
}
function resetOutput(){
  showError('');
  [1,2,3].forEach(n => setStep(n,''));
  $('tokens').innerHTML = '<div class="empty">No tokens.</div>';
  $('tree').innerHTML = '<div class="empty">No tree.</div>';
  $('tac').innerHTML = '<span class="empty">No output.</span>';
  $('st-tok').textContent = $('st-node').textContent = $('st-tac').textContent = 0;
  currentTAC = [];
}

function analyze(){
  resetOutput();
  const {tokens, errors} = lex($('editor').value);          // Module 1
  showTokens(tokens);
  if (errors.length){ setStep(1,'fail'); showError(errors.join('\n')); return; }
  setStep(1,'done');

  let ast;
  try {
    ast = new Parser(tokens).program();                     // Module 2
    $('st-node').textContent = drawTree(ast);
    setStep(2,'done');
  } catch(e){ setStep(2,'fail'); showError('Syntax error: ' + e.message); return; }

  try {
    showTAC(generate(ast));                                 // Module 3
    setStep(3,'done');
  } catch(e){ setStep(3,'fail'); showError('Code generation error: ' + e.message); }
}

$('run').onclick = analyze;
$('samples').onchange = e => { $('editor').value = e.target.value; analyze(); };
$('editor').addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') analyze(); });
$('copy').onclick = () => {
  if (!currentTAC.length) return toast('Nothing to copy yet');
  navigator.clipboard.writeText(currentTAC.join('\n')); toast('TAC copied to clipboard');
};
$('download').onclick = () => {
  if (!currentTAC.length) return toast('Nothing to download yet');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([currentTAC.join('\n')], {type:'text/plain'}));
  a.download = 'tac.txt'; a.click();
  toast('TAC downloaded');
};