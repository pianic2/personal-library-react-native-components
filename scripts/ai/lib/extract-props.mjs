#!/usr/bin/env node
// Extracts component props from the public entry (src/index.ts) with the TypeScript compiler API.
// Deterministic: sorted object keys, no absolute paths, no timestamps.
// Library: import { extractProps, serialize } from './extract-props.mjs'.
// CLI: node scripts/ai/lib/extract-props.mjs [--root <dir>] [--entry <file>]  (prints JSON; exit 2 on error)
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const DEFAULT_OPTIONS = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  strict: true,
  noEmit: true,
  skipLibCheck: true,
};

const isPascal = (name) => /^[A-Z]/.test(name);

function compilerOptions(root) {
  const file = resolve(root, 'tsconfig.json');
  if (!existsSync(file)) return DEFAULT_OPTIONS;
  const read = ts.readConfigFile(file, ts.sys.readFile);
  if (read.error) throw new Error(ts.flattenDiagnosticMessageText(read.error.messageText, '\n'));
  const parsed = ts.parseJsonConfigFileContent(read.config, ts.sys, root);
  return { ...parsed.options, noEmit: true };
}

function functionLike(node) {
  if (!node) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;
  if (ts.isVariableDeclaration(node)) return functionLike(node.initializer);
  if (ts.isParenthesizedExpression(node) || ts.isAsExpression(node) || ts.isSatisfiesExpression(node)) return functionLike(node.expression);
  if (ts.isCallExpression(node)) {
    for (const arg of node.arguments) {
      const found = functionLike(arg);
      if (found) return found;
    }
  }
  return undefined;
}

function literalOf(node) {
  if (ts.isStringLiteralLike(node)) return { value: node.text };
  if (ts.isNumericLiteral(node)) return { value: Number(node.text) };
  if (node.kind === ts.SyntaxKind.TrueKeyword) return { value: true };
  if (node.kind === ts.SyntaxKind.FalseKeyword) return { value: false };
  if (node.kind === ts.SyntaxKind.NullKeyword) return { value: null };
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken && ts.isNumericLiteral(node.operand)) return { value: -Number(node.operand.text) };
  return undefined;
}

// Literal values in declaration order (TypeScript orders union members by internal type id).
function declaredLiterals(typeNode, checker, seen = new Set()) {
  if (!typeNode || seen.has(typeNode)) return [];
  seen.add(typeNode);
  if (ts.isUnionTypeNode(typeNode)) return typeNode.types.flatMap((t) => declaredLiterals(t, checker, seen));
  if (ts.isParenthesizedTypeNode(typeNode)) return declaredLiterals(typeNode.type, checker, seen);
  if (ts.isLiteralTypeNode(typeNode)) {
    const literal = literalOf(typeNode.literal);
    return literal ? [literal.value] : [];
  }
  if (ts.isTypeReferenceNode(typeNode)) {
    const alias = checker.getTypeFromTypeNode(typeNode).aliasSymbol?.declarations?.find(ts.isTypeAliasDeclaration);
    return alias ? declaredLiterals(alias.type, checker, seen) : [];
  }
  return [];
}

function destructuringDefaults(fn) {
  const defaults = new Map();
  const param = fn?.parameters[0];
  if (!param || !ts.isObjectBindingPattern(param.name)) return defaults;
  for (const element of param.name.elements) {
    if (element.dotDotDotToken || !element.initializer) continue;
    const key = element.propertyName ?? element.name;
    if (!ts.isIdentifier(key) && !ts.isStringLiteralLike(key)) continue;
    defaults.set(key.text, element.initializer);
  }
  return defaults;
}

function setDefault(entry, node, sourceFile) {
  const literal = literalOf(node);
  if (literal) entry.default = literal.value;
  else entry.defaultExpression = node.getText(sourceFile);
}

export function extractProps({ root = process.cwd(), entry = 'src/index.ts' } = {}) {
  const rootDir = resolve(root);
  const entryFile = resolve(rootDir, entry);
  if (!existsSync(entryFile)) throw new Error(`entry not found: ${entry}`);
  const program = ts.createProgram([entryFile], compilerOptions(rootDir));
  const checker = program.getTypeChecker();
  const source = program.getSourceFile(entryFile);
  const moduleSymbol = source && checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`entry has no exports: ${entry}`);

  const exported = checker.getExportsOfModule(moduleSymbol);
  const exportedNames = new Set(exported.map((s) => s.name));
  const components = {};
  const skipped = {};
  const flags = ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.InTypeAlias;

  for (const exportSymbol of exported) {
    const name = exportSymbol.name;
    const symbol = exportSymbol.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(exportSymbol) : exportSymbol;
    if (!(symbol.flags & ts.SymbolFlags.Value) || !isPascal(name)) continue;
    const declaration = symbol.valueDeclaration ?? symbol.declarations?.[0];
    if (!declaration) { skipped[name] = 'no declaration'; continue; }
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    const signature = type.getCallSignatures()[0];
    if (!signature) continue; // constants and non-callable values are not components

    const fn = functionLike(declaration);
    const defaults = destructuringDefaults(fn);
    const paramSymbol = signature.getParameters()[0];
    const props = {};
    let propsTypeName = null;
    if (paramSymbol) {
      const paramType = checker.getTypeOfSymbolAtLocation(paramSymbol, declaration);
      const named = paramType.aliasSymbol?.name ?? paramType.symbol?.name;
      propsTypeName = named && !named.startsWith('__') ? named : null;
      for (const prop of checker.getPropertiesOfType(paramType)) {
        const propDecl = prop.valueDeclaration ?? prop.declarations?.[0] ?? declaration;
        const propType = checker.getTypeOfSymbolAtLocation(prop, propDecl);
        const bare = checker.getNonNullableType(propType);
        const info = { optional: Boolean(prop.flags & ts.SymbolFlags.Optional), type: checker.typeToString(bare, undefined, flags) };
        const members = bare.isUnion() ? bare.types : [bare];
        if (members.length > 1 && members.every((t) => t.isStringLiteral() || t.isNumberLiteral())) {
          const actual = members.map((t) => t.value);
          const declared = declaredLiterals(propDecl.type, checker);
          const ordered = declared.length === actual.length && actual.every((v) => declared.includes(v)) ? declared : [...actual].sort();
          info.values = ordered;
        }
        const description = ts.displayPartsToString(prop.getDocumentationComment(checker)).trim();
        if (description) info.description = description;
        const tag = prop.getJsDocTags(checker).find((t) => t.name === 'default' || t.name === 'defaultValue');
        const initializer = defaults.get(prop.name);
        if (initializer) setDefault(info, initializer, initializer.getSourceFile());
        else if (tag) info.default = ts.displayPartsToString(tag.text).trim();
        props[prop.name] = info;
      }
    }
    components[name] = {
      props,
      propsType: propsTypeName,
      propsTypeExported: propsTypeName !== null && exportedNames.has(propsTypeName),
    };
  }
  return { entry, components, skipped };
}

function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((k) => [k, sortKeys(value[k])]));
  }
  return value;
}

export function serialize(result) {
  return `${JSON.stringify(sortKeys(result), null, 2)}\n`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const args = process.argv.slice(2);
    const opts = {};
    for (let i = 0; i < args.length; i += 2) {
      if (!['--root', '--entry'].includes(args[i]) || args[i + 1] === undefined) throw new Error(`unknown or incomplete argument: ${args[i]}`);
      opts[args[i].slice(2)] = args[i + 1];
    }
    process.stdout.write(serialize(extractProps(opts)));
  } catch (error) {
    console.error(`extract-props: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(2);
  }
}
