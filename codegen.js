function generate(ast){
  const code=[]; let t=0, l=0;
  const T=()=>'t'+(++t), L=()=>'L'+(++l);

  function expr(n){
    if(n.type==='Num'||n.type==='Id') return n.value;
    const a=expr(n.left), b=expr(n.right), r=T();
    code.push(`${r} = ${a} ${n.op} ${b}`);
    return r;
  }
  function stmt(s){
    if(s.type==='Assign'){ code.push(`${s.name} = ${expr(s.expr)}`); }
    else if(s.type==='If'){
      const c=expr(s.cond), Lelse=L(), Lend=L();
      code.push(`ifFalse ${c} goto ${Lelse}`);
      s.then.forEach(stmt);
      if(s.else){ code.push(`goto ${Lend}`); code.push(`${Lelse}:`); s.else.forEach(stmt); code.push(`${Lend}:`); }
      else code.push(`${Lelse}:`);
    } else if(s.type==='While'){
      const Ltop=L(), Lend=L();
      code.push(`${Ltop}:`);
      const c=expr(s.cond);
      code.push(`ifFalse ${c} goto ${Lend}`);
      s.body.forEach(stmt);
      code.push(`goto ${Ltop}`, `${Lend}:`);
    }
  }
  ast.body.forEach(stmt);
  return code;
}