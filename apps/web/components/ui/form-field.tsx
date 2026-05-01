import {
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes
} from "react";

type BaseProps = {
  label: string;
  error?: string;
  helper?: string;
  className?: string;
};

type InputProps = BaseProps & {
  as?: "input";
} & InputHTMLAttributes<HTMLInputElement>;

type TextareaProps = BaseProps & {
  as: "textarea";
} & TextareaHTMLAttributes<HTMLTextAreaElement>;

type SelectProps = BaseProps & {
  as: "select";
  children?: ReactNode;
} & SelectHTMLAttributes<HTMLSelectElement>;

type Props = InputProps | TextareaProps | SelectProps;

function Wrapper({
  label,
  error,
  helper,
  children
}: {
  label: string;
  error?: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
      {!error && helper ? <span className="text-xs text-slate-500">{helper}</span> : null}
    </label>
  );
}

export function FormField(props: Props) {
  const shared =
    "brainio-input w-full rounded-lg px-3 py-2 text-sm text-slate-900 transition";

  if (props.as === "textarea") {
    const { label, error, helper, className, as, ...textareaProps } = props;
    return (
      <Wrapper label={label} error={error} helper={helper}>
        <textarea {...textareaProps} className={`${shared} min-h-[92px] ${className ?? ""}`} />
      </Wrapper>
    );
  }

  if (props.as === "select") {
    const { label, error, helper, className, as, children, ...selectProps } = props;
    return (
      <Wrapper label={label} error={error} helper={helper}>
        <select {...selectProps} className={`${shared} ${className ?? ""}`}>
          {children}
        </select>
      </Wrapper>
    );
  }

  const { label, error, helper, className, as, ...inputProps } = props;
  return (
    <Wrapper label={label} error={error} helper={helper}>
      <input {...inputProps} className={`${shared} ${className ?? ""}`} />
    </Wrapper>
  );
}
