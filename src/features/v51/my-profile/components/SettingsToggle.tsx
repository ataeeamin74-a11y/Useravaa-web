import styles from "./MyProfile.module.css";

type SettingsToggleProps = Readonly<{
  checked: boolean;
  children: string;
  onChange: (checked: boolean) => void;
}>;

export function SettingsToggle({ checked, children, onChange }: SettingsToggleProps) {
  return (
    <label className={styles.settingsToggle}>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      {children}
    </label>
  );
}
