// Builds a simple symbol table by walking the AST in source order.
function analyzeSymbols(ast){
  const syms = new Map();
  const get = n => { if(!syms.has(n)) syms.set(n,{name:n, assigns:0, uses:0, readFirst:false}); return syms.get(n); };
  function expr(n){
    if(n.type==='Id'){ const s=get(n.value); s.uses++; if(s.assigns===0) s.readFirst=true; }
    else if(n.type==='BinOp'){ expr(n.left); expr(n.right); }
    else if(n.type==='Unary'){ expr(n.operand); }
  }
  function stmt(s){
    if(s.type==='Assign'){ expr(s.expr); get(s.name).assigns++; }
    else if(s.type==='If'){ expr(s.cond); s.then.forEach(stmt); if(s.else) s.else.forEach(stmt); }
    else if(s.type==='While'){ expr(s.cond); s.body.forEach(stmt); }
    else if(s.type==='For'){ stmt(s.init); expr(s.cond); s.body.forEach(stmt); stmt(s.update); }
  }
  ast.body.forEach(stmt);
  return [...syms.values()].map(s=>({
    ...s,
    note: s.assigns===0 ? 'input variable (never assigned)' : s.readFirst ? 'read before first assignment' : 'ok'
  }));
}
