function toTree(n){
  switch(n.type){
    case 'Program': return {label:'Program', kind:'kw', children:n.body.map(toTree)};
    case 'Assign':  return {label:'=', kind:'op', children:[{label:n.name,kind:'id',children:[]}, toTree(n.expr)]};
    case 'BinOp':   return {label:n.op, kind:'op', children:[toTree(n.left), toTree(n.right)]};
    case 'Num':     return {label:n.value, kind:'num', children:[]};
    case 'Id':      return {label:n.value, kind:'id', children:[]};
    case 'If': {
      const c=[toTree(n.cond), {label:'then',kind:'kw',children:n.then.map(toTree)}];
      if(n.else) c.push({label:'else',kind:'kw',children:n.else.map(toTree)});
      return {label:'if', kind:'kw', children:c};
    }
    case 'While':
      return {label:'while', kind:'kw', children:[toTree(n.cond), {label:'body',kind:'kw',children:n.body.map(toTree)}]};
  }
}

function drawTree(ast){
  const root = toTree(ast);
  const GAP = 84, LEVEL = 78, H = 34;
  let leaf = 0, maxD = 0;

  (function layout(n,d){
    maxD = Math.max(maxD,d);
    n.y = d*LEVEL + 36;
    n.w = Math.max(46, String(n.label).length*9 + 22);
    if(!n.children.length){ n.x = leaf++*GAP + 50; }
    else {
      n.children.forEach(c=>layout(c,d+1));
      n.x = (n.children[0].x + n.children[n.children.length-1].x)/2;
    }
  })(root,0);

  const esc = s => String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let edges='', nodes='', count=0;

  (function walk(n){
    n.children.forEach(c=>{
      const my = (n.y + c.y)/2;
      edges += `<path class="edge" d="M${n.x} ${n.y+H/2} C${n.x} ${my}, ${c.x} ${my}, ${c.x} ${c.y-H/2}"/>`;
      walk(c);
    });
    nodes += `<g class="node ${n.kind}" style="animation-delay:${count*35}ms">
      <rect x="${n.x-n.w/2}" y="${n.y-H/2}" width="${n.w}" height="${H}" rx="10"/>
      <text x="${n.x}" y="${n.y+4}">${esc(n.label)}</text></g>`;
    count++;
  })(root);

  const W = Math.max(leaf*GAP + 40, 320), HT = (maxD+1)*LEVEL + 30;
  document.getElementById('tree').innerHTML =
    `<svg width="${W}" height="${HT}" viewBox="0 0 ${W} ${HT}">${edges}${nodes}</svg>`;
  return count;
}