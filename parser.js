class Parser {
  constructor(t){ this.t=t; this.i=0; }
  peek(){ return this.t[this.i]; }
  eat(v){ const k=this.peek();
    if(k && k.value===v){ this.i++; return k; }
    throw new Error(`Line ${k?k.line:'EOF'}: expected '${v}'`); }

  // precedence (low -> high):  ||  &&  relational  + -  * /  unary-  factor
  binary(next, ops){
    let left = next.call(this);
    while(this.peek() && ops.includes(this.peek().value)){
      const op = this.t[this.i++].value;
      left = {type:'BinOp', op, left, right: next.call(this)};
    }
    return left;
  }
  expr(){ return this.binary(this.and, ['||']); }
  and(){  return this.binary(this.rel, ['&&']); }
  rel(){  return this.binary(this.add, ['<','>','<=','>=','==','!=']); }
  add(){  return this.binary(this.term, ['+','-']); }
  term(){ return this.binary(this.unary, ['*','/']); }
  unary(){
    const k=this.peek();
    if(k && k.value==='-'){ this.i++; return {type:'Unary', op:'-', operand:this.unary()}; }
    return this.factor();
  }
  factor(){
    const k=this.peek();
    if(!k) throw new Error('Unexpected end of input');
    if(k.type==='NUM'){ this.i++; return {type:'Num', value:k.value}; }
    if(k.type==='ID'){ this.i++; return {type:'Id', value:k.value}; }
    if(k.value==='('){ this.i++; const e=this.expr(); this.eat(')'); return e; }
    throw new Error(`Line ${k.line}: unexpected '${k.value}'`);
  }
  assign(){                       // name = expr   (no ';')
    const k=this.peek();
    if(!k || k.type!=='ID') throw new Error(`Line ${k?k.line:'EOF'}: expected a variable name`);
    this.i++; this.eat('=');
    return {type:'Assign', name:k.value, expr:this.expr()};
  }
  stmt(){
    const k=this.peek();
    if(k.value==='if'){
      this.i++; this.eat('('); const c=this.expr(); this.eat(')');
      const th=this.block(); let el=null;
      if(this.peek() && this.peek().value==='else'){
        this.i++;
        el = (this.peek() && this.peek().value==='if') ? [this.stmt()] : this.block();   // else-if
      }
      return {type:'If', cond:c, then:th, else:el};
    }
    if(k.value==='while'){
      this.i++; this.eat('('); const c=this.expr(); this.eat(')');
      return {type:'While', cond:c, body:this.block()};
    }
    if(k.value==='for'){
      this.i++; this.eat('(');
      const init=this.assign(); this.eat(';');
      const cond=this.expr();   this.eat(';');
      const update=this.assign(); this.eat(')');
      return {type:'For', init, cond, update, body:this.block()};
    }
    if(k.type==='ID'){ const a=this.assign(); this.eat(';'); return a; }
    throw new Error(`Line ${k.line}: invalid statement start '${k.value}'`);
  }
  block(){ this.eat('{'); const s=[];
    while(this.peek() && this.peek().value!=='}') s.push(this.stmt());
    this.eat('}'); return s; }
  program(){ const s=[]; while(this.peek()) s.push(this.stmt()); return {type:'Program', body:s}; }
}
