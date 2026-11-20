// Generates quadruples first, then derives TAC text and triples from them.
function generate(ast, opt = {}){
  const q=[]; let t=0, l=0, folded=0;
  const T=()=>'t'+(++t), L=()=>'L'+(++l);
  const isNum = s => /^-?\d+(\.\d+)?$/.test(s);
  const emit = (op, a1='', a2='', res='') => q.push({op, a1, a2, res});
  const FOLD = {
    '+':(a,b)=>a+b, '-':(a,b)=>a-b, '*':(a,b)=>a*b, '/':(a,b)=>b===0?null:a/b,
    '<':(a,b)=>+(a<b), '>':(a,b)=>+(a>b), '<=':(a,b)=>+(a<=b), '>=':(a,b)=>+(a>=b),
    '==':(a,b)=>+(a===b), '!=':(a,b)=>+(a!==b),
    '&&':(a,b)=>+(a!==0&&b!==0), '||':(a,b)=>+(a!==0||b!==0),
  };
  const num = v => String(+v.toFixed(6));

  function expr(n){
    if(n.type==='Num'||n.type==='Id') return n.value;
    if(n.type==='Unary'){
      const a=expr(n.operand);
      if(opt.fold && isNum(a)){ folded++; return num(-Number(a)); }
      const r=T(); emit('uminus', a, '', r); return r;
    }
    const a=expr(n.left), b=expr(n.right);
    if(opt.fold && isNum(a) && isNum(b)){
      const v = FOLD[n.op](Number(a), Number(b));
      if(v!==null){ folded++; return num(v); }
    }
    const r=T(); emit(n.op, a, b, r); return r;
  }
  function stmt(s){
    if(s.type==='Assign'){ emit('=', expr(s.expr), '', s.name); }
    else if(s.type==='If'){
      const c=expr(s.cond), Lelse=L(), Lend=s.else?L():null;
      emit('ifFalse', c, '', Lelse);
      s.then.forEach(stmt);
      if(s.else){ emit('goto','','',Lend); emit('label','','',Lelse); s.else.forEach(stmt); emit('label','','',Lend); }
      else emit('label','','',Lelse);
    } else if(s.type==='While'){
      const Ltop=L(), Lend=L();
      emit('label','','',Ltop);
      const c=expr(s.cond);
      emit('ifFalse', c, '', Lend);
      s.body.forEach(stmt);
      emit('goto','','',Ltop); emit('label','','',Lend);
    } else if(s.type==='For'){
      const Ltop=L(), Lend=L();
      stmt(s.init);
      emit('label','','',Ltop);
      const c=expr(s.cond);
      emit('ifFalse', c, '', Lend);
      s.body.forEach(stmt);
      stmt(s.update);
      emit('goto','','',Ltop); emit('label','','',Lend);
    }
  }
  ast.body.forEach(stmt);
  return {tac:q.map(quadText), quads:q, triples:toTriples(q), folded};
}

function quadText(x){
  switch(x.op){
    case 'label':   return x.res+':';
    case 'goto':    return 'goto '+x.res;
    case 'ifFalse': return `ifFalse ${x.a1} goto ${x.res}`;
    case '=':       return `${x.res} = ${x.a1}`;
    case 'uminus':  return `${x.res} = -${x.a1}`;
    default:        return `${x.res} = ${x.a1} ${x.op} ${x.a2}`;
  }
}

// Triples have no result field: a temporary is referred to by the index (n) of the triple that computed it.
function toTriples(quads){
  const idx = new Map();
  const ref = s => idx.has(s) ? `(${idx.get(s)})` : s;
  return quads.map((x,i)=>{
    let r;
    switch(x.op){
      case 'label': case 'goto': r={op:x.op, a1:x.res, a2:''}; break;
      case 'ifFalse': r={op:'ifFalse', a1:ref(x.a1), a2:x.res}; break;
      case '=':       r={op:'=', a1:x.res, a2:ref(x.a1)}; break;
      default:        r={op:x.op, a1:ref(x.a1), a2:ref(x.a2)}; idx.set(x.res, i);
    }
    return r;
  });
}
