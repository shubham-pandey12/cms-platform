/**
 * Safe Expression Evaluator
 * 
 * Evaluates simple JavaScript expressions safely without using Function() constructor.
 * Only allows basic arithmetic, comparison, and logical operations.
 * 
 * SECURITY: This is a restricted evaluator that prevents arbitrary code execution.
 * It only supports:
 * - Basic arithmetic: +, -, *, /, %, **
 * - Comparison: <, >, <=, >=, ==, !=, ===, !==
 * - Logical: &&, ||, !
 * - Parentheses: ()
 * - Numbers and the 'value' variable
 * 
 * It explicitly rejects:
 * - Function calls
 * - Object property access (except 'value')
 * - Array access
 * - Keywords (if, for, while, etc.)
 * - Assignment operators
 */

interface Token {
  type: 'number' | 'operator' | 'variable' | 'paren' | 'whitespace';
  value: string;
}

/**
 * Tokenize an expression string
 */
function tokenize(expression: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;

  while (i < expression.length) {
    const char = expression[i];

    // Skip whitespace
    if (/\s/.test(char)) {
      i++;
      continue;
    }

    // Numbers (including decimals)
    if (/\d/.test(char)) {
      let num = '';
      while (i < expression.length && /[\d.]/.test(expression[i])) {
        num += expression[i];
        i++;
      }
      tokens.push({ type: 'number', value: num });
      continue;
    }

    // Operators (multi-character first)
    const operators = ['===', '!==', '<=', '>=', '==', '!=', '&&', '||', '**', '++', '--'];
    let matched = false;
    for (const op of operators) {
      if (expression.substring(i, i + op.length) === op) {
        tokens.push({ type: 'operator', value: op });
        i += op.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // Single character operators
    if (/[+\-*/%<>!&|()]/.test(char)) {
      tokens.push({ type: 'operator', value: char });
      i++;
      continue;
    }

    // Variables (only 'value' is allowed)
    if (/[a-zA-Z_]/.test(char)) {
      let varName = '';
      while (i < expression.length && /[a-zA-Z0-9_]/.test(expression[i])) {
        varName += expression[i];
        i++;
      }
      if (varName === 'value') {
        tokens.push({ type: 'variable', value: varName });
      } else {
        throw new Error(`Invalid variable name: ${varName}. Only 'value' is allowed.`);
      }
      continue;
    }

    throw new Error(`Unexpected character: ${char}`);
  }

  return tokens;
}

/**
 * Validate that expression doesn't contain dangerous patterns
 */
function validateExpression(expression: string): void {
  // Reject function calls
  if (/[a-zA-Z_$][a-zA-Z0-9_$]*\s*\(/.test(expression)) {
    throw new Error('Function calls are not allowed');
  }

  // Reject object property access (except 'value')
  if (/\.\s*[a-zA-Z_]/.test(expression)) {
    throw new Error('Object property access is not allowed');
  }

  // Reject array access
  if (/\[/.test(expression)) {
    throw new Error('Array access is not allowed');
  }

  // Reject assignment operators
  if (/[=:]\s*[^=!<>]/.test(expression)) {
    throw new Error('Assignment operators are not allowed');
  }

  // Reject keywords
  const keywords = ['if', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'return', 'var', 'let', 'const', 'function', 'class', 'new', 'this', 'typeof', 'instanceof', 'void', 'delete', 'in', 'of'];
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(expression)) {
      throw new Error(`Keyword '${keyword}' is not allowed`);
    }
  }

  // Reject template literals
  if (/`/.test(expression)) {
    throw new Error('Template literals are not allowed');
  }

  // Reject string literals (to prevent code injection)
  if (/['"]/.test(expression)) {
    throw new Error('String literals are not allowed');
  }
}

/**
 * Evaluate a safe expression
 * @param expression - The expression to evaluate (e.g., "value * 1.1")
 * @param value - The value to use for the 'value' variable
 * @returns The result of the expression
 */
export function evaluateSafeExpression(expression: string, value: unknown): unknown {
  if (!expression || typeof expression !== 'string') {
    return value;
  }

  // Trim whitespace
  const trimmed = expression.trim();
  if (!trimmed) {
    return value;
  }

  try {
    // Validate expression doesn't contain dangerous patterns
    validateExpression(trimmed);

    // Tokenize
    const tokens = tokenize(trimmed);

    // Convert to postfix notation (shunting yard algorithm)
    const output: Token[] = [];
    const operators: Token[] = [];
    const precedence: Record<string, number> = {
      '||': 1,
      '&&': 2,
      '==': 3, '!=': 3, '===': 3, '!==': 3,
      '<': 4, '>': 4, '<=': 4, '>=': 4,
      '+': 5, '-': 5,
      '*': 6, '/': 6, '%': 6,
      '**': 7,
      '!': 8,
    };

    for (const token of tokens) {
      if (token.type === 'number') {
        output.push(token);
      } else if (token.type === 'variable') {
        // Replace 'value' with actual value
        const numValue = typeof value === 'number' ? value : 
                        typeof value === 'string' ? parseFloat(value) || 0 :
                        typeof value === 'boolean' ? (value ? 1 : 0) : 0;
        output.push({ type: 'number', value: String(numValue) });
      } else if (token.type === 'operator') {
        if (token.value === '(') {
          operators.push(token);
        } else if (token.value === ')') {
          while (operators.length > 0 && operators[operators.length - 1].value !== '(') {
            output.push(operators.pop()!);
          }
          operators.pop(); // Remove '('
        } else {
          const opPrec = precedence[token.value] || 0;
          while (
            operators.length > 0 &&
            operators[operators.length - 1].value !== '(' &&
            (precedence[operators[operators.length - 1].value] || 0) >= opPrec
          ) {
            output.push(operators.pop()!);
          }
          operators.push(token);
        }
      }
    }

    while (operators.length > 0) {
      output.push(operators.pop()!);
    }

    // Evaluate postfix expression
    const stack: number[] = [];
    for (const token of output) {
      if (token.type === 'number') {
        stack.push(parseFloat(token.value));
      } else if (token.type === 'operator') {
        if (token.value === '!') {
          const a = stack.pop();
          if (a === undefined) throw new Error('Invalid expression');
          stack.push(a ? 0 : 1);
        } else if (token.value === '**') {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) throw new Error('Invalid expression');
          stack.push(Math.pow(a, b));
        } else {
          const b = stack.pop();
          const a = stack.pop();
          if (a === undefined || b === undefined) throw new Error('Invalid expression');

          switch (token.value) {
            case '+': stack.push(a + b); break;
            case '-': stack.push(a - b); break;
            case '*': stack.push(a * b); break;
            case '/': 
              if (b === 0) throw new Error('Division by zero');
              stack.push(a / b); 
              break;
            case '%': stack.push(a % b); break;
            case '<': stack.push(a < b ? 1 : 0); break;
            case '>': stack.push(a > b ? 1 : 0); break;
            case '<=': stack.push(a <= b ? 1 : 0); break;
            case '>=': stack.push(a >= b ? 1 : 0); break;
            case '==': stack.push(a == b ? 1 : 0); break;
            case '!=': stack.push(a != b ? 1 : 0); break;
            case '===': stack.push(a === b ? 1 : 0); break;
            case '!==': stack.push(a !== b ? 1 : 0); break;
            case '&&': stack.push(a && b ? 1 : 0); break;
            case '||': stack.push(a || b ? 1 : 0); break;
            default: throw new Error(`Unknown operator: ${token.value}`);
          }
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression');
    }

    return stack[0];
  } catch (error) {
    console.error('Error evaluating safe expression:', error);
    // Return original value on error
    return value;
  }
}
