// Minimal Liquid preprocessor for AsciiDoc content.
// Supports the subset used by TC 154 content:
//   {% assign var = expr %}
//   {% for x in arr %} ... {% endfor %}
//   {% if cond %} ... {% endif %}
//   {{ var.path['literal'] }}
//   | sort: "field" filter
// Site context shape: { data: { members: { all: {...}, ... } }, groups: [...] }

// Whitespace control: tag-only lines (assign/for/endfor/if/endif) render empty,
// leaving extra blank lines. Collapse 3+ consecutive newlines to 2 (paragraph break)
// after rendering so AsciiDoctor sees clean input.
function collapseBlankLines(s) {
  return s.replace(/\n{3,}/g, '\n\n')
}

const TOKEN_RE = /(\{%[\s\S]*?%\}|\{\{[^}]*?\}\})/g

function tokenize(template) {
  const tokens = []
  let lastIdx = 0
  let m
  while ((m = TOKEN_RE.exec(template)) !== null) {
    if (m.index > lastIdx) {
      tokens.push({ type: 'text', value: template.slice(lastIdx, m.index) })
    }
    const raw = m[0]
    if (raw.startsWith('{%')) {
      tokens.push({ type: 'tag', value: raw.slice(2, -2).trim() })
    } else {
      tokens.push({ type: 'output', value: raw.slice(2, -2).trim() })
    }
    lastIdx = TOKEN_RE.lastIndex
  }
  if (lastIdx < template.length) {
    tokens.push({ type: 'text', value: template.slice(lastIdx) })
  }
  return tokens
}

function parse(tokens) {
  const root = { type: 'root', children: [] }
  const stack = [root]

  for (const tok of tokens) {
    const top = stack[stack.length - 1]
    if (tok.type === 'text') {
      top.children.push({ type: 'text', value: tok.value })
    } else if (tok.type === 'output') {
      top.children.push({ type: 'output', expr: tok.value })
    } else {
      const v = tok.value
      if (v.startsWith('assign ')) {
        top.children.push({ type: 'assign', expr: v.slice(7).trim() })
      } else if (v.startsWith('for ')) {
        const node = { type: 'for', expr: v.slice(4).trim(), children: [] }
        top.children.push(node)
        stack.push(node)
      } else if (v === 'endfor') {
        if (stack[stack.length - 1].type !== 'for') {
          throw new Error('Unexpected {% endfor %}')
        }
        stack.pop()
      } else if (v.startsWith('if ')) {
        const node = { type: 'if', expr: v.slice(3).trim(), children: [] }
        top.children.push(node)
        stack.push(node)
      } else if (v === 'endif') {
        if (stack[stack.length - 1].type !== 'if') {
          throw new Error('Unexpected {% endif %}')
        }
        stack.pop()
      }
    }
  }

  if (stack.length !== 1) {
    throw new Error(`Unclosed Liquid block: ${stack[stack.length - 1].type}`)
  }
  return root
}

function evalPath(path, scope) {
  const headMatch = /^([a-zA-Z_][a-zA-Z0-9_]*)/.exec(path)
  if (!headMatch) return undefined
  let current = scope[headMatch[1]]

  const rest = path.slice(headMatch[0].length)
  const tokenRe = /(?:\.([a-zA-Z_][a-zA-Z0-9_-]*)|\[\s*(['"])([^'"]+)\2\s*\]|\[\s*(\d+)\s*\])/g
  let m
  while ((m = tokenRe.exec(rest)) !== null) {
    if (current == null) return undefined
    if (m[1] != null) {
      current = current[m[1]]
    } else if (m[3] != null) {
      current = current[m[3]]
    } else if (m[4] != null) {
      current = Array.isArray(current) ? current[parseInt(m[4], 10)] : undefined
    }
  }
  return current
}

function evalExpr(expr, scope) {
  const parts = expr.split('|').map(s => s.trim())
  let value = evalPath(parts[0], scope)
  for (let i = 1; i < parts.length; i++) {
    value = applyFilter(parts[i], value)
  }
  return value
}

function applyFilter(filterExpr, value) {
  const colonIdx = filterExpr.indexOf(':')
  const name = (colonIdx === -1 ? filterExpr : filterExpr.slice(0, colonIdx)).trim()
  const arg = colonIdx === -1
    ? null
    : filterExpr.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '')

  if (name === 'sort') {
    if (!Array.isArray(value)) return value
    if (arg) {
      return [...value].sort((a, b) => {
        const av = a?.[arg]
        const bv = b?.[arg]
        if (av == null) return 1
        if (bv == null) return -1
        if (typeof av === 'number' && typeof bv === 'number') return av - bv
        return String(av).localeCompare(String(bv))
      })
    }
    return [...value].sort()
  }
  return value
}

function execAssign(assignExpr, scope) {
  const eqIdx = assignExpr.indexOf('=')
  if (eqIdx === -1) return
  const varName = assignExpr.slice(0, eqIdx).trim()
  const exprStr = assignExpr.slice(eqIdx + 1).trim()
  scope[varName] = evalExpr(exprStr, scope)
}

function isTruthy(v) {
  if (v == null || v === false || v === '' || v === 0) return false
  if (Array.isArray(v) && v.length === 0) return false
  return true
}

const FOR_RE = /^([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+([\s\S]+)$/

function renderNode(node, scope) {
  let out = ''
  for (const child of node.children) {
    switch (child.type) {
      case 'text':
        out += child.value
        break
      case 'output': {
        const v = evalExpr(child.expr, scope)
        out += v == null ? '' : String(v)
        break
      }
      case 'assign':
        execAssign(child.expr, scope)
        break
      case 'if':
        if (isTruthy(evalExpr(child.expr, scope))) {
          out += renderNode(child, scope)
        }
        break
      case 'for': {
        const m = FOR_RE.exec(child.expr)
        if (!m) break
        const iterVar = m[1]
        const arr = evalExpr(m[2], scope)
        if (Array.isArray(arr)) {
          for (const item of arr) {
            const childScope = Object.create(scope)
            childScope[iterVar] = item
            out += renderNode(child, childScope)
          }
        }
        break
      }
    }
  }
  return out
}

export function renderLiquid(template, site) {
  const tokens = tokenize(template)
  const ast = parse(tokens)
  const rendered = renderNode(ast, { site })
  return collapseBlankLines(rendered)
}

export function hasLiquid(template) {
  return /\{%|\{\{/.test(template)
}
