type JobTitleInputProps = Readonly<{
  id?: string;
  value: string;
  onChange: (value: string) => void;
}>;

export function JobTitleInput({ id, value, onChange }: JobTitleInputProps) {
  return (
    <input
      id={id}
      value={value}
      placeholder="مثلاً مدیر محصول"
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
