/**
 * Generate the API reference from the TypeScript sources.
 *
 * Reads the two packages' public entry points with the TypeScript compiler API
 * and emits `src/generated/api.json`. Nothing about the reference page is
 * hand-written, so it cannot drift away from the actual exported API — if a
 * prop is renamed, the table changes on the next build.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '../../..');

const PACKAGES = [
  { id: 'calendar-core', name: '@rooz-calendar/core', entry: resolve(repoRoot, 'packages/calendar-core/src/index.ts') },
  { id: 'calendar-ui', name: '@rooz-calendar/ui', entry: resolve(repoRoot, 'packages/calendar-ui/src/index.ts') },
];

/** Components documented by their `<Name>Props` interface. */
const COMPONENT_ORDER = [
  'CalendarGrid',
  'CalendarHeader',
  'EventBlock',
  'MonthView',
  'WeekView',
  'DayView',
  'AgendaView',
  'Calendar',
];

const program = ts.createProgram(
  PACKAGES.map((pkg) => pkg.entry),
  {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    moduleResolution: ts.ModuleResolutionKind.Bundler,
    jsx: ts.JsxEmit.ReactJSX,
    strict: true,
    skipLibCheck: true,
    esModuleInterop: true,
  },
);
const checker = program.getTypeChecker();

function docOf(symbol) {
  return ts.displayPartsToString(symbol.getDocumentationComment(checker)).trim();
}

function tagOf(symbol, tagName) {
  const tag = symbol.getJsDocTags(checker).find((candidate) => candidate.name === tagName);
  if (!tag) return undefined;
  return ts.displayPartsToString(tag.text).trim() || undefined;
}

/** Render a type readably: collapse whitespace and clip runaway unions. */
function typeText(type, node) {
  const flags =
    ts.TypeFormatFlags.NoTruncation |
    ts.TypeFormatFlags.UseSingleQuotesForStringLiteralType |
    ts.TypeFormatFlags.InTypeAlias;
  let text = checker.typeToString(type, node, flags).replace(/\s+/g, ' ').trim();
  if (text.length > 220) text = `${text.slice(0, 217)}…`;
  return text;
}

function declarationOf(symbol) {
  return symbol.declarations?.[0];
}

/**
 * True when a declaration comes from React's own DOM typings.
 *
 * Only React's attribute interfaces are filtered — a base type from any other
 * dependency (CVA's `VariantProps`, say) contributes real, documentable props.
 */
function isReactDomDeclaration(declaration) {
  if (!declaration) return true;
  const file = declaration.getSourceFile().fileName;
  return /node_modules\/(@types\/react|csstype)\//.test(file);
}

/**
 * Base types whose members are React DOM attributes.
 *
 * Their ~250 members would drown the props table, so the base becomes a
 * footnote — "also accepts every standard div prop" — instead of rows.
 */
function externalBaseNames(symbol) {
  const declaration = declarationOf(symbol);
  if (!declaration || !ts.isInterfaceDeclaration(declaration)) return [];
  const names = [];
  for (const clause of declaration.heritageClauses ?? []) {
    for (const typeNode of clause.types) {
      const baseType = checker.getTypeAtLocation(typeNode);
      const contributesDomProps = checker
        .getPropertiesOfType(baseType)
        .some((property) => isReactDomDeclaration(declarationOf(property)));
      if (contributesDomProps) names.push(typeNode.getText().replace(/\s+/g, ' '));
    }
  }
  return names;
}

/**
 * Every documentable property of an interface or object-shaped type alias,
 * including ones inherited from a base.
 */
function propertiesOf(symbol) {
  const declaration = declarationOf(symbol);
  if (!declaration) return [];
  const type = checker.getDeclaredTypeOfSymbol(symbol);
  return checker
    .getPropertiesOfType(type)
    .filter((property) => !isReactDomDeclaration(declarationOf(property)))
    .map((property) => {
      const propertyDeclaration = declarationOf(property);
      const propertyType = checker.getTypeOfSymbolAtLocation(property, propertyDeclaration ?? declaration);
      const owner = propertyDeclaration?.parent?.name?.getText?.();
      const optional = (property.flags & ts.SymbolFlags.Optional) !== 0;
      let text = typeText(propertyType, propertyDeclaration ?? declaration);
      // The `?` already says a prop may be absent; repeating `| undefined` in
      // every row is noise.
      if (optional) text = text.replace(/\s*\|\s*undefined$/, '');
      return {
        name: property.getName(),
        type: text,
        optional,
        description: docOf(property),
        default: tagOf(property, 'default'),
        inheritedFrom: owner && owner !== symbol.getName() ? owner : undefined,
      };
    })
    .filter((property) => !property.name.startsWith('__'))
    .sort((a, b) => {
      // Required props first, then alphabetical — the order a reader needs.
      if (a.optional !== b.optional) return a.optional ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
}

function kindOf(symbol) {
  const declaration = declarationOf(symbol);
  if (!declaration) return 'unknown';
  if (ts.isInterfaceDeclaration(declaration)) return 'interface';
  if (ts.isTypeAliasDeclaration(declaration)) return 'type';
  if (ts.isClassDeclaration(declaration)) return 'class';
  if (ts.isFunctionDeclaration(declaration)) return 'function';
  if (ts.isVariableDeclaration(declaration)) {
    const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
    return type.getCallSignatures().length > 0 ? 'function' : 'const';
  }
  return 'unknown';
}

/** One-line signature for a function export. */
function signatureOf(symbol) {
  const declaration = declarationOf(symbol);
  if (!declaration) return undefined;
  const type = checker.getTypeOfSymbolAtLocation(symbol, declaration);
  const [signature] = type.getCallSignatures();
  if (!signature) return undefined;
  const params = signature
    .getParameters()
    .map((parameter) => {
      const parameterDeclaration = declarationOf(parameter);
      const optional =
        parameterDeclaration && ts.isParameter(parameterDeclaration) && !!parameterDeclaration.questionToken;
      return `${parameter.getName()}${optional ? '?' : ''}: ${typeText(
        checker.getTypeOfSymbolAtLocation(parameter, parameterDeclaration ?? declaration),
        declaration,
      )}`;
    })
    .join(', ');
  return `${symbol.getName()}(${params}): ${typeText(signature.getReturnType(), declaration)}`;
}

function collect(pkg) {
  const source = program.getSourceFile(pkg.entry);
  if (!source) throw new Error(`Could not load ${pkg.entry}`);
  const moduleSymbol = checker.getSymbolAtLocation(source);
  if (!moduleSymbol) throw new Error(`No module symbol for ${pkg.entry}`);

  const entries = [];
  for (const raw of checker.getExportsOfModule(moduleSymbol)) {
    const symbol = raw.flags & ts.SymbolFlags.Alias ? checker.getAliasedSymbol(raw) : raw;
    const kind = kindOf(symbol);
    entries.push({
      name: raw.getName(),
      kind,
      description: docOf(symbol) || docOf(raw),
      signature: kind === 'function' ? signatureOf(symbol) : undefined,
      properties: kind === 'interface' || kind === 'type' ? propertiesOf(symbol) : [],
      forwardedTo: kind === 'interface' ? externalBaseNames(symbol) : [],
      typeText: kind === 'type' ? typeText(checker.getDeclaredTypeOfSymbol(symbol), declarationOf(symbol)) : undefined,
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name));
  return { ...pkg, entries };
}

const packages = PACKAGES.map(collect);

// Pair each component with its props interface for the components section.
const uiEntries = packages.find((pkg) => pkg.id === 'calendar-ui').entries;
const byName = new Map(uiEntries.map((entry) => [entry.name, entry]));

const missing = COMPONENT_ORDER.filter((name) => !byName.has(name));
if (missing.length > 0) throw new Error(`Components missing from @rooz-calendar/ui exports: ${missing.join(', ')}`);

const components = COMPONENT_ORDER.map((name) => {
  const component = byName.get(name);
  const props = byName.get(`${name}Props`);
  if (!props) throw new Error(`${name} has no exported ${name}Props interface to document`);
  return {
    name,
    description: component.description || props.description,
    propsTypeName: props.name,
    props: props.properties,
    forwardedTo: props.forwardedTo ?? [],
  };
});

const payload = {
  generatedFrom: PACKAGES.map((pkg) => pkg.name),
  components,
  packages: packages.map((pkg) => ({ id: pkg.id, name: pkg.name, entries: pkg.entries })),
};

const outFile = resolve(here, '../src/generated/api.json');
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, `${JSON.stringify(payload, null, 2)}\n`);

const counts = payload.packages.map((pkg) => `${pkg.name}: ${pkg.entries.length}`).join(', ');
console.log(`api.json written — ${payload.components.length} components documented (${counts})`);
