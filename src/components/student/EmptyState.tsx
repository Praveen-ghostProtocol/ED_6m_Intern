type EmptyStateProps = {
  title: string;
  description: string;
};

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-portal border border-dashed border-portal-line bg-white px-6 py-10 text-center">
      <h2 className="text-base font-semibold text-portal-ink">{title}</h2>
      <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-portal-muted">{description}</p>
    </div>
  );
}