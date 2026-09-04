import Decimal from "decimal.js";

export interface ParseResult {
  value: Decimal;
  formatted: string;
  error?: string;
}

type TokenType = "NUMBER" | "PLUS" | "MINUS" | "MULTIPLY" | "DIVIDE";

interface Token {
  type: TokenType;
  value: string;
}

/**
 * Tokenizes mathematical expressions safely without regex backtracking risks
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const clean = expression.replace(/\s+/g, "");

  while (i < clean.length) {
    const char = clean[i];

    if (char === "+") {
      tokens.push({ type: "PLUS", value: "+" });
      i++;
    } else if (char === "-") {
      // Support leading negative numbers or operators
      tokens.push({ type: "MINUS", value: "-" });
      i++;
    } else if (char === "*" || char === "×") {
      tokens.push({ type: "MULTIPLY", value: "*" });
      i++;
    } else if (char === "/" || char === "÷") {
      tokens.push({ type: "DIVIDE", value: "/" });
      i++;
    } else if (/\d|\./.test(char)) {
      let numStr = "";
      let hasDot = false;
      while (i < clean.length && (/\d/.test(clean[i]) || clean[i] === ".")) {
        if (clean[i] === ".") {
          if (hasDot) break; // Avoid multiple dots in single number
          hasDot = true;
        }
        numStr += clean[i];
        i++;
      }
      tokens.push({ type: "NUMBER", value: numStr });
    } else {
      // Ignore unsupported characters
      i++;
    }
  }

  return tokens;
}

/**
 * Evaluates an infix arithmetic expression deterministically using Shunting-yard algorithm
 * Strictly NO eval() or new Function() calls per Principle P4.
 */
export function evaluateExpression(expression: string): ParseResult {
  if (!expression || expression.trim() === "") {
    return { value: new Decimal(0), formatted: "0" };
  }

  const tokens = tokenize(expression);
  if (tokens.length === 0) {
    return { value: new Decimal(0), formatted: "0" };
  }

  // Precedence map
  const precedence: Record<TokenType, number> = {
    NUMBER: 0,
    PLUS: 1,
    MINUS: 1,
    MULTIPLY: 2,
    DIVIDE: 2,
  };

  const outputQueue: Token[] = [];
  const operatorStack: Token[] = [];

  for (let idx = 0; idx < tokens.length; idx++) {
    const token = tokens[idx];

    if (token.type === "NUMBER") {
      outputQueue.push(token);
    } else {
      // If operator is at the end with nothing following, we can safely ignore it for live evaluation
      if (idx === tokens.length - 1) {
        continue;
      }

      while (
        operatorStack.length > 0 &&
        precedence[operatorStack[operatorStack.length - 1].type] >= precedence[token.type]
      ) {
        outputQueue.push(operatorStack.pop()!);
      }
      operatorStack.push(token);
    }
  }

  while (operatorStack.length > 0) {
    outputQueue.push(operatorStack.pop()!);
  }

  // Evaluate postfix notation (Reverse Polish Notation) using Decimal.js
  const evalStack: Decimal[] = [];

  for (const token of outputQueue) {
    if (token.type === "NUMBER") {
      try {
        evalStack.push(new Decimal(token.value));
      } catch {
        evalStack.push(new Decimal(0));
      }
    } else {
      const b = evalStack.pop();
      const a = evalStack.pop();

      if (a === undefined || b === undefined) {
        continue;
      }

      switch (token.type) {
        case "PLUS":
          evalStack.push(a.plus(b));
          break;
        case "MINUS":
          evalStack.push(a.minus(b));
          break;
        case "MULTIPLY":
          evalStack.push(a.times(b));
          break;
        case "DIVIDE":
          if (b.isZero()) {
            return {
              value: new Decimal(0),
              formatted: "0",
              error: "Cannot divide by zero",
            };
          }
          evalStack.push(a.dividedBy(b));
          break;
      }
    }
  }

  const finalValue = evalStack.length > 0 ? evalStack[0] : new Decimal(0);
  return {
    value: finalValue,
    formatted: finalValue.toFixed(2),
  };
}
