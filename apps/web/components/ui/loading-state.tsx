type Props = {
  label?: string;
};

export function LoadingState({ label = "Loading data..." }: Props) {
  return <div className="brainio-card rounded-2xl px-5 py-8 text-sm text-slate-500">{label}</div>;
}
