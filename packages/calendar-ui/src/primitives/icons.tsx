import type { SVGProps } from 'react';

/**
 * Inline icons rather than an icon-library dependency: two chevrons are not
 * worth adding a peer dependency a consumer then has to install.
 */
function Chevron({ d, ...props }: SVGProps<SVGSVGElement> & { d: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d={d} />
    </svg>
  );
}

export function ChevronLeftIcon(props: SVGProps<SVGSVGElement>) {
  return <Chevron d="m15 18-6-6 6-6" {...props} />;
}

export function ChevronRightIcon(props: SVGProps<SVGSVGElement>) {
  return <Chevron d="m9 18 6-6-6-6" {...props} />;
}

export function CloseIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
