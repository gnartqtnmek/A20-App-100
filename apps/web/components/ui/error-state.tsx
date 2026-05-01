type Props = {
  title?: string;
  description: string;
};

export function ErrorState({ title = "Something went wrong", description }: Props) {
  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-8 text-red-700 shadow-[0_6px_20px_rgba(185,28,28,0.08)]">
      <p className="text-base font-semibold">{title}</p>
      <p className="mt-1 text-sm">{description}</p>
    </div>
  );
}
