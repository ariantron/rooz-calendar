import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <p className="text-sm text-muted-foreground">Nothing here.</p>
      <Link to="/" className="mt-3 inline-block text-sm font-medium underline underline-offset-4">
        Back to the overview
      </Link>
    </div>
  );
}
