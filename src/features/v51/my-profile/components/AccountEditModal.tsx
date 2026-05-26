import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import { validateAccountSettings, type AccountSettings, type AccountSettingsErrors } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type AccountEditModalProps = Readonly<{
  draft: AccountSettings;
  errors: AccountSettingsErrors;
  showErrors: boolean;
  onChange: (draft: AccountSettings) => void;
  onClose: () => void;
  onSave: () => void;
}>;

export function AccountEditModal({ draft, errors, showErrors, onChange, onClose, onSave }: AccountEditModalProps) {
  const isValid = Object.keys(validateAccountSettings(draft)).length === 0;

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="accountEditTitle">
      <div className={styles.modalCard}>
        <div className={styles.modalHead}>
          <h2 id="accountEditTitle">ویرایش اطلاعات حساب</h2>
          <button type="button" className={styles.modalClose} aria-label="بستن" onClick={onClose}>
            <UseravaaIcon name="close" size={18} />
          </button>
        </div>

        <div className={styles.settingsForm}>
          <div className={styles.field}>
            <label htmlFor="accountName">نام</label>
            <input id="accountName" value={draft.name} onChange={(event) => onChange({ ...draft, name: event.target.value })} />
            {showErrors && errors.name ? <div className={styles.fieldError}>{errors.name}</div> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="accountEmail">ایمیل</label>
            <input id="accountEmail" dir="ltr" value={draft.email} onChange={(event) => onChange({ ...draft, email: event.target.value })} />
            {showErrors && errors.email ? <div className={styles.fieldError}>{errors.email}</div> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="accountPhone">شماره موبایل</label>
            <input id="accountPhone" dir="ltr" value={draft.phone} onChange={(event) => onChange({ ...draft, phone: event.target.value })} />
            {showErrors && errors.phone ? <div className={styles.fieldError}>{errors.phone}</div> : null}
          </div>
        </div>

        <div className={styles.accountActions}>
          <V51Button type="button" onClick={onClose}>
            انصراف
          </V51Button>
          <V51Button type="button" tone="primary" disabled={!isValid} onClick={onSave}>
            ذخیره تغییرات
          </V51Button>
        </div>
      </div>
    </div>
  );
}
