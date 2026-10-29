const RULES = [
  ['WS',     /^\s+/],
  ['KEYWORD',/^(if|else|while)\b/],
  ['NUM',    /^\d+(\.\d+)?/],
  ['ID',     /^[A-Za-z_]\w*/],
  ['OP',     /^(==|!=|<=|>=|[+\-*\/<>=])/],
  ['PUNCT',  /^[(){};]/],
];

function lex(src) {
  const tokens = [], errors = [];
  let line = 1;
  while (src.length) {
    let matched = false;
    for (const [type, re] of RULES) {
      const m = src.match(re);
      if (m) {
        if (type === 'WS') line += (m[0].match(/\n/g) || []).length;
        else tokens.push({type, value: m[0], line});
        src = src.slice(m[0].length);
        matched = true; break;
      }
    }
    if (!matched) { errors.push(`Line ${line}: invalid character '${src[0]}'`); src = src.slice(1); }
  }
  return {tokens, errors};
}