class Parser {
  constructor(t){ this.t=t; this.i=0; }
  peek(){ return this.t[this.i]; }
  eat(v){ const k=this.peek();
    if(k && k.value===v){ this.i++; return k; }
    throw new Error(`Line ${k?k.line:'EOF'}: expected '${v}'`); }

  binary(next, ops){
    let left = next.call(this);
    while(this.peek() && ops.includes(this.peek().value)){
      const op = this.t[this.i++].value;
      left = {type:'BinOp', op, left, right: next.call(this)};
    }
    return left;
  }
  rel(){ return this.binary(this.add, ['<','>','==','!=']); }
  add(){ return this.binary(this.term, ['+','-']); }
  term(){ return this.binary(this.factor, ['*','/']); }
  factor(){
    const k=this.peek();
    if(!k) throw new Error('Unexpected end of input');
    if(k.type==='NUM'){ this.i++; return {type:'Num', value:k.value}; }
    if(k.type==='ID'){ this.i++; return {type:'Id', value:k.value}; }
    if(k.value==='('){ this.i++; const e=this.rel(); this.eat(')'); return e; }
    throw new Error(`Line ${k.line}: unexpected '${k.value}'`);
  }
  stmt(){
    const k=this.peek();
    if(k.value==='if'){ this.i++; this.eat('('); const c=this.rel(); this.eat(')');
      const th=this.block(); let el=null;
      if(this.peek()&&this.peek().value==='else'){ this.i++; el=this.block(); }
      return {type:'If', cond:c, then:th, else:el}; }
    if(k.value==='while'){ this.i++; this.eat('('); const c=this.rel(); this.eat(')');
      return {type:'While', cond:c, body:this.block()}; }
    if(k.type==='ID'){ this.i++; this.eat('='); const e=this.rel(); this.eat(';');
      return {type:'Assign', name:k.value, expr:e}; }
    throw new Error(`Line ${k.line}: invalid statement start '${k.value}'`);
  }
  block(){ this.eat('{'); const s=[];
    while(this.peek() && this.peek().value!=='}') s.push(this.stmt());
    this.eat('}'); return s; }
  program(){ const s=[]; while(this.peek()) s.push(this.stmt()); return {type:'Program', body:s}; }
}