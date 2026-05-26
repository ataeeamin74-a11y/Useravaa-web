import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import { validateSettlementSettings, type SettlementSettings, type SettlementSettingsErrors } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type SettlementInfoModalProps = Readonly<{
  draft: SettlementSettings;
  errors: SettlementSettingsErrors;
  showErrors: boolean;
  onChange: (draft: SettlementSettings) => void;
  onClose: () => void;
  onSave: () => void;
}>;

export function SettlementInfoModal({ draft, errors, showErrors, onChange, onClose, onSave }: SettlementInfoModalProps) {
  const isValid = Object.keys(validateSettlementSettings(draft)).length === 0;

  return (
    <div className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="settlementInfoTitle">
      <div className={styles.modalCard}>
        <div className={styles.modalHead}>
          <h2 id="settlementInfoTitle">اطلاعات تسویه</h2>
          <button type="button" className={styles.modalClose} aria-label="بستن" onClick={onClose}>
            <UseravaaIcon name="close" size={18} />
          </button>
        </div>

        <div className={styles.settingsForm}>
          <div className={styles.field}>
            <label htmlFor="settlementOwner">نام صاحب حساب</label>
            <input id="settlementOwner" value={draft.accountOwner} onChange={(event) => onChange({ ...draft, accountOwner: event.target.value })} />
            {showErrors && errors.accountOwner ? <div className={styles.fieldError}>{errors.accountOwner}</div> : null}
          </div>

          <div className={styles.field}>
            <label htmlFor="settlementIban">شماره شبا</label>
            <input
              id="settlementIban"
              dir="ltr"
              placeholder="IRxxxxxxxxxxxxxxxxxxxxxxxx"
              value={draft.iban}
              onChange={(event) => onChange({ ...draft, iban: event.target.value })}
            />
            {showErrors && errors.iban ? <div className={styles.fieldError}>{errors.iban}</div> : null}
          </div>

          <div className={styles.inlineNote}>برای تسویه درآمد جلسه‌های موفق، ثبت شماره شبا لازم است.</div>
        </div>

        <div className={styles.accountActions}>
          <V51Button type="button" onClick={onClose}>
            انصراف
          </V51Button>
          <V51Button type="button" tone="primary" disabled={!isValid} onClick={onSave}>
            ذخیره اطلاعات تسویه
          </V51Button>
        </div>
      </div>
    </div>
  );
}
