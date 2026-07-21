function maskCharacter(character) {
  return /\s/u.test(character) ? character : " ";
}

export function lexPostgresTopLevel(input) {
  const sql = String(input);
  const tokens = [];
  let maskedSql = "";
  let index = 0;
  let blockCommentDepth = 0;

  const maskRange = (start, end) => {
    for (let cursor = start; cursor < end; cursor += 1) {
      maskedSql += maskCharacter(sql[cursor]);
    }
  };

  while (index < sql.length) {
    const current = sql[index];
    const next = sql[index + 1];

    if (current === "-" && next === "-") {
      const start = index;
      index += 2;
      while (index < sql.length && sql[index] !== "\n" && sql[index] !== "\r") index += 1;
      maskRange(start, index);
      continue;
    }

    if (current === "/" && next === "*") {
      const start = index;
      blockCommentDepth = 1;
      index += 2;
      while (index < sql.length && blockCommentDepth > 0) {
        if (sql[index] === "/" && sql[index + 1] === "*") {
          blockCommentDepth += 1;
          index += 2;
        } else if (sql[index] === "*" && sql[index + 1] === "/") {
          blockCommentDepth -= 1;
          index += 2;
        } else index += 1;
      }
      if (blockCommentDepth > 0) throw new Error("Unterminated SQL block comment");
      maskRange(start, index);
      continue;
    }

    if (current === "'") {
      const start = index;
      const prefix = tokens.at(-1);
      const isEscapeString = prefix?.type === "word"
        && prefix.end === index
        && (prefix.raw === "E" || prefix.raw === "e")
        && (prefix.start === 0 || !/[A-Za-z0-9_$]/u.test(sql[prefix.start - 1]));
      index += 1;
      let closed = false;
      while (index < sql.length) {
        if (isEscapeString && sql[index] === "\\" && index + 1 < sql.length) index += 2;
        else if (sql[index] === "'" && sql[index + 1] === "'") index += 2;
        else if (sql[index] === "'") {
          index += 1;
          closed = true;
          break;
        } else index += 1;
      }
      if (!closed) throw new Error("Unterminated SQL string literal");
      maskRange(start, index);
      continue;
    }

    if (current === "$") {
      const dollarMatch = sql.slice(index).match(/^\$[A-Za-z_][A-Za-z0-9_]*\$|^\$\$/u);
      if (dollarMatch) {
        const start = index;
        const tag = dollarMatch[0];
        index += tag.length;
        const closeAt = sql.indexOf(tag, index);
        if (closeAt < 0) throw new Error("Unterminated SQL dollar-quoted body");
        index = closeAt + tag.length;
        maskRange(start, index);
        continue;
      }
    }

    if (current === '"') {
      const start = index;
      let value = "";
      index += 1;
      let closed = false;
      while (index < sql.length) {
        if (sql[index] === '"' && sql[index + 1] === '"') {
          value += '"';
          index += 2;
        } else if (sql[index] === '"') {
          index += 1;
          closed = true;
          break;
        } else {
          value += sql[index];
          index += 1;
        }
      }
      if (!closed) throw new Error("Unterminated SQL quoted identifier");
      const raw = sql.slice(start, index);
      maskedSql += raw;
      tokens.push({ type: "identifier", value, raw, start, end: index });
      continue;
    }

    if (/[A-Za-z_]/u.test(current)) {
      const start = index;
      index += 1;
      while (index < sql.length && /[A-Za-z0-9_$]/u.test(sql[index])) index += 1;
      const raw = sql.slice(start, index);
      maskedSql += raw;
      tokens.push({ type: "word", value: raw.toUpperCase(), raw, start, end: index });
      continue;
    }

    maskedSql += current;
    if (!/\s/u.test(current)) {
      tokens.push({ type: "symbol", value: current, raw: current, start: index, end: index + 1 });
    }
    index += 1;
  }

  return { maskedSql, tokens };
}

export function splitTopLevelStatements(sql) {
  const { tokens } = lexPostgresTopLevel(sql);
  const statements = [];
  let statement = [];
  for (const token of tokens) {
    if (token.type === "symbol" && token.value === ";") {
      if (statement.length) statements.push(statement);
      statement = [];
    } else statement.push(token);
  }
  if (statement.length) statements.push(statement);
  return statements;
}
