import { useMemo, useState } from 'react';
import { Code } from '../components/code';
import { Badge, Section } from '../components/layout';
import { Prose } from '../components/prose';
import { cx } from '../lib/cx';
import apiData from '../generated/api.json';

interface PropRow {
  name: string;
  type: string;
  optional: boolean;
  description: string;
  default?: string;
  inheritedFrom?: string;
}

interface ComponentDoc {
  name: string;
  description: string;
  propsTypeName: string;
  props: PropRow[];
  forwardedTo: string[];
}

interface Entry {
  name: string;
  kind: string;
  description: string;
  signature?: string;
  typeText?: string;
  properties: PropRow[];
}

interface PackageDoc {
  id: string;
  name: string;
  entries: Entry[];
}

const api = apiData as unknown as {
  generatedFrom: string[];
  components: ComponentDoc[];
  packages: PackageDoc[];
};

const STYLE_SETUP = `/* 1. No Tailwind in your project — ship the whole stylesheet.
      Contains no Preflight, so it will not reset your app's styles. */
import '@rooz/calendar-ui/styles.css';

/* 2. Tailwind + shadcn — add one line to your CSS. The calendar
      picks up your existing --background / --primary / --radius tokens. */
@source "../node_modules/@rooz/calendar-ui/dist";

/* 3. Tailwind without shadcn tokens — add the token map too. */
@import "@rooz/calendar-ui/tokens.css";
@source "../node_modules/@rooz/calendar-ui/dist";`;

function PropsTable({ rows, emptyLabel }: { rows: PropRow[]; emptyLabel: string }) {
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full min-w-[46rem] border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-start">
            <th className="px-3 py-2 text-start font-medium">Prop</th>
            <th className="px-3 py-2 text-start font-medium">Type</th>
            <th className="px-3 py-2 text-start font-medium">Default</th>
            <th className="px-3 py-2 text-start font-medium">Description</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-border/60 align-top last:border-b-0">
              <td className="whitespace-nowrap px-3 py-2.5">
                <code className="font-mono text-[0.8125rem] font-medium">{row.name}</code>
                {row.optional ? null : <span className="ms-1 text-destructive" title="required">*</span>}
                {row.inheritedFrom ? (
                  <div className="mt-1 text-[0.6875rem] text-muted-foreground">from {row.inheritedFrom}</div>
                ) : null}
              </td>
              <td className="px-3 py-2.5">
                <code className="font-mono text-[0.75rem] text-muted-foreground">{row.type}</code>
              </td>
              <td className="whitespace-nowrap px-3 py-2.5">
                {row.default ? (
                  <code className="font-mono text-[0.75rem]">{row.default}</code>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </td>
              <td className="px-3 py-2.5 text-muted-foreground">
                {row.description ? <Prose text={row.description} /> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EntryList({ entries }: { entries: Entry[] }) {
  return (
    <div className="divide-y divide-border rounded-lg border border-border">
      {entries.map((entry) => (
        <div key={entry.name} id={`api-${entry.name}`} className="scroll-mt-20 p-4">
          <div className="flex flex-wrap items-baseline gap-2">
            <code className="font-mono text-sm font-semibold">{entry.name}</code>
            <Badge tone="muted">{entry.kind}</Badge>
          </div>
          {entry.description ? (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              <Prose text={entry.description} />
            </p>
          ) : null}
          {entry.signature ? (
            <pre dir="ltr" className="mt-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-[0.75rem]">
              <code className="font-mono">{entry.signature}</code>
            </pre>
          ) : null}
          {entry.typeText && !entry.signature ? (
            <pre dir="ltr" className="mt-3 overflow-x-auto rounded-md bg-muted/50 p-3 text-[0.75rem]">
              <code className="font-mono">{`type ${entry.name} = ${entry.typeText}`}</code>
            </pre>
          ) : null}
          {entry.properties.length > 0 ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
                {entry.properties.length} members
              </summary>
              <div className="mt-3">
                <PropsTable rows={entry.properties} emptyLabel="No members." />
              </div>
            </details>
          ) : null}
        </div>
      ))}
    </div>
  );
}

const KIND_FILTERS = ['all', 'function', 'interface', 'type', 'const', 'class'] as const;

export function DocsPage() {
  const [activeComponent, setActiveComponent] = useState(api.components[0]?.name ?? '');
  const [packageId, setPackageId] = useState(api.packages[0]?.id ?? '');
  const [kind, setKind] = useState<(typeof KIND_FILTERS)[number]>('all');
  const [query, setQuery] = useState('');

  const component = api.components.find((item) => item.name === activeComponent) ?? api.components[0];
  const activePackage = api.packages.find((item) => item.id === packageId) ?? api.packages[0];

  const entries = useMemo(() => {
    const all = activePackage?.entries ?? [];
    const needle = query.trim().toLowerCase();
    return all.filter(
      (entry) =>
        (kind === 'all' || entry.kind === kind) &&
        (needle === '' ||
          entry.name.toLowerCase().includes(needle) ||
          entry.description.toLowerCase().includes(needle)),
    );
  }, [activePackage, kind, query]);

  return (
    <>
      <Section
        className="pt-12"
        title="API reference"
        lead={`Generated from the TypeScript sources of ${api.generatedFrom.join(' and ')} at build time — prop names, types, defaults and descriptions all come from the code, so this page cannot drift out of sync with it.`}
      />

      <Section id="styles" title="Installing the styles" lead="Three supported setups, depending on what your project already uses.">
        <Code language="css">{STYLE_SETUP}</Code>
      </Section>

      <Section id="components" title="Components">
        <div className="mb-5 flex flex-wrap gap-1.5">
          {api.components.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => setActiveComponent(item.name)}
              className={cx(
                'rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-colors',
                item.name === component?.name
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
              )}
            >
              {item.name}
            </button>
          ))}
        </div>

        {component ? (
          <div>
            <div className="mb-3 flex flex-wrap items-baseline gap-2">
              <h3 className="font-mono text-base font-semibold">{`<${component.name} />`}</h3>
              <Badge tone="muted">{component.propsTypeName}</Badge>
            </div>
            {component.description ? (
              <p className="mb-4 max-w-3xl text-sm leading-relaxed text-muted-foreground">
                <Prose text={component.description} />
              </p>
            ) : null}
            <PropsTable rows={component.props} emptyLabel="This component takes no props of its own." />
            {component.forwardedTo.length > 0 ? (
              <p className="mt-3 text-xs text-muted-foreground">
                Also accepts everything in{' '}
                {component.forwardedTo.map((base, index) => (
                  <span key={base}>
                    {index > 0 ? ' and ' : ''}
                    <code className="font-mono">{base}</code>
                  </span>
                ))}
                , forwarded to the underlying element along with a ref.
              </p>
            ) : null}
          </div>
        ) : null}
      </Section>

      <Section id="exports" title="Package exports" lead="Every public export of both packages, with its signature and doc comment.">
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div className="flex gap-1.5">
            {api.packages.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPackageId(item.id)}
                className={cx(
                  'rounded-md border px-3 py-1.5 font-mono text-xs font-medium transition-colors',
                  item.id === activePackage?.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-input bg-background hover:bg-accent hover:text-accent-foreground',
                )}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className="flex gap-1.5">
            {KIND_FILTERS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setKind(item)}
                className={cx(
                  'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                  item === kind ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Filter exports…"
            className="ms-auto h-8 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          />
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          {entries.length} of {activePackage?.entries.length ?? 0} exports
        </p>
        <EntryList entries={entries} />
      </Section>
    </>
  );
}
