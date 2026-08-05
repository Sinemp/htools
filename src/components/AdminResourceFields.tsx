import { useId, type ClipboardEvent, type ReactNode } from "react";
import { normalizeHttpUrlInput, normalizeTagInputText } from "../tool-helpers";

export function AdminUrlField({
  children,
  className = "",
  disabled = false,
  help,
  id,
  label,
  maxLength,
  onBlurValue,
  onChange,
  placeholder,
  required = false,
  value
}: {
  children?: ReactNode;
  className?: string;
  disabled?: boolean;
  help?: ReactNode;
  id?: string;
  label: string;
  maxLength?: number;
  onBlurValue?: (value: string) => void;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const fieldClassName = `tool-form-field admin-resource-url-field ${className}`.trim();

  return (
    <div className={fieldClassName}>
      <div className="tool-form-field-head">
        <label htmlFor={inputId}>{label}</label>
      </div>
      <input
        disabled={disabled}
        id={inputId}
        inputMode="url"
        maxLength={maxLength}
        onBlur={(event) => {
          const normalized = normalizeHttpUrlInput(event.currentTarget.value);
          onBlurValue?.(normalized);
          if (normalized !== value) onChange(normalized);
        }}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
      {help ? <small className="form-field-help">{help}</small> : null}
      {children}
    </div>
  );
}

export function AdminTextField({
  className = "",
  disabled = false,
  headingAside,
  id,
  label,
  maxLength,
  onBlurValue,
  onChange,
  onPaste,
  placeholder,
  required = false,
  value
}: {
  className?: string;
  disabled?: boolean;
  headingAside?: ReactNode;
  id?: string;
  label: string;
  maxLength?: number;
  onBlurValue?: (value: string) => void;
  onChange: (value: string) => void;
  onPaste?: (event: ClipboardEvent<HTMLInputElement>) => void;
  placeholder: string;
  required?: boolean;
  value: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`tool-form-field admin-resource-text-field ${className}`.trim()}>
      <div className="tool-form-field-head">
        <label htmlFor={inputId}>{label}</label>
        {headingAside}
      </div>
      <input
        disabled={disabled}
        id={inputId}
        maxLength={maxLength}
        onBlur={(event) => onBlurValue?.(event.currentTarget.value)}
        onChange={(event) => onChange(event.target.value)}
        onPaste={onPaste}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </div>
  );
}

export function AdminTextareaField({
  className = "",
  disabled = false,
  id,
  label,
  onChange,
  placeholder,
  required = false,
  rows,
  value
}: {
  className?: string;
  disabled?: boolean;
  id?: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  rows: number;
  value: string;
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  return (
    <div className={`tool-form-field admin-resource-textarea-field ${className}`.trim()}>
      <div className="tool-form-field-head">
        <label htmlFor={inputId}>{label}</label>
      </div>
      <textarea
        disabled={disabled}
        id={inputId}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        required={required}
        rows={rows}
        value={value}
      />
    </div>
  );
}

export function AdminTagsField({
  disabled = false,
  label,
  onChange,
  placeholder,
  value
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData("text");
    if (
      text.includes("\n") ||
      /^\s*tags\s*:/i.test(text) ||
      /#[^\s#]+/.test(text)
    ) {
      event.preventDefault();
      onChange(normalizeTagInputText(text));
    }
  }

  return (
    <label>
      {label}
      <input
        disabled={disabled}
        onBlur={(event) => onChange(normalizeTagInputText(event.currentTarget.value))}
        onChange={(event) => onChange(event.target.value)}
        onPaste={handlePaste}
        placeholder={placeholder}
        value={value}
      />
    </label>
  );
}
