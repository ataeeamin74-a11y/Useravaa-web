"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button } from "@/features/v51/components/V51Button";
import {
  applyAccountSettings,
  applySettlementSettings,
  formatIban,
  getLatestCompanyDisplayItem,
  getSelectablePublicCompanyItems,
  initialProfileSettingsFixture,
  normalizeIban,
  normalizePublicCompanyDisplayIds,
  updateNotificationSetting,
  updatePrivacySetting,
  validateAccountSettings,
  validateCompanyDisplaySettings,
  validateSettlementSettings,
  type AccountSettings,
  type CompanyDisplaySettings,
  type NotificationSettings,
  type PrivacySettings,
  type ProfileSettingsFixture,
  type SettlementSettings
} from "@/features/v51/data/my-profile";
import { AccountEditModal } from "../components/AccountEditModal";
import { SettingsToggle } from "../components/SettingsToggle";
import { SettlementInfoModal } from "../components/SettlementInfoModal";
import styles from "../components/MyProfile.module.css";

type ProfileSettingsPageProps = Readonly<{
  fixture?: ProfileSettingsFixture;
  initialAccountModalOpen?: boolean;
  initialSettlementModalOpen?: boolean;
}>;

export function ProfileSettingsPage({
  fixture = initialProfileSettingsFixture,
  initialAccountModalOpen = false,
  initialSettlementModalOpen = false
}: ProfileSettingsPageProps) {
  const [account, setAccount] = useState<AccountSettings>(fixture.account);
  const [accountDraft, setAccountDraft] = useState<AccountSettings>(fixture.account);
  const [accountErrors, setAccountErrors] = useState(validateAccountSettings(fixture.account));
  const [showAccountErrors, setShowAccountErrors] = useState(false);
  const [accountModalOpen, setAccountModalOpen] = useState(initialAccountModalOpen);
  const [notifications, setNotifications] = useState<NotificationSettings>(fixture.notifications);
  const [privacy, setPrivacy] = useState<PrivacySettings>(fixture.privacy);
  const [settlement, setSettlement] = useState<SettlementSettings>(fixture.settlement);
  const [settlementDraft, setSettlementDraft] = useState<SettlementSettings>(fixture.settlement);
  const [settlementErrors, setSettlementErrors] = useState(validateSettlementSettings(fixture.settlement));
  const [showSettlementErrors, setShowSettlementErrors] = useState(false);
  const [settlementModalOpen, setSettlementModalOpen] = useState(initialSettlementModalOpen);
  const [companyDisplay, setCompanyDisplay] = useState<CompanyDisplaySettings>(fixture.companyDisplay);
  const [statusMessage, setStatusMessage] = useState("");
  const latestCompany = getLatestCompanyDisplayItem(companyDisplay);
  const selectablePublicCompanies = getSelectablePublicCompanyItems(companyDisplay);
  const companyDisplayErrors = validateCompanyDisplaySettings(companyDisplay);

  const openAccountModal = () => {
    setAccountDraft(account);
    setAccountErrors(validateAccountSettings(account));
    setShowAccountErrors(false);
    setStatusMessage("");
    setAccountModalOpen(true);
  };

  const closeAccountModal = () => {
    setAccountDraft(account);
    setShowAccountErrors(false);
    setAccountModalOpen(false);
  };

  const updateAccountDraft = (draft: AccountSettings) => {
    setAccountDraft(draft);
    setAccountErrors(validateAccountSettings(draft));
  };

  const saveAccount = () => {
    const result = applyAccountSettings(account, accountDraft);
    setAccountErrors(result.errors);

    if (!result.saved) {
      setShowAccountErrors(true);
      setStatusMessage("اطلاعات حساب را کامل کن.");
      return;
    }

    setAccount(result.account);
    setAccountModalOpen(false);
    setShowAccountErrors(false);
    setStatusMessage("اطلاعات حساب ذخیره شد.");
  };

  const updateNotification = (key: keyof NotificationSettings, checked: boolean) => {
    setNotifications((current) => updateNotificationSetting(current, key, checked));
    setStatusMessage("تنظیمات اعلان‌ها ذخیره شد.");
  };

  const updatePrivacy = (key: keyof PrivacySettings, checked: boolean) => {
    setPrivacy((current) => updatePrivacySetting(current, key, checked));
    setStatusMessage("تنظیمات حریم خصوصی ذخیره شد.");
  };

  const deactivateProfile = () => {
    setPrivacy((current) => ({ ...current, showProfileAfterApproval: false }));
    setStatusMessage("پروفایل تجربه غیرفعال شد.");
  };

  const openSettlementModal = () => {
    const draft = {
      ...settlement,
      accountOwner: settlement.accountOwner || account.name,
      iban: settlement.iban ? formatIban(settlement.iban) : ""
    };
    setSettlementDraft(draft);
    setSettlementErrors(validateSettlementSettings(draft));
    setShowSettlementErrors(false);
    setStatusMessage("");
    setSettlementModalOpen(true);
  };

  const closeSettlementModal = () => {
    setSettlementDraft(settlement);
    setShowSettlementErrors(false);
    setSettlementModalOpen(false);
  };

  const updateSettlementDraft = (draft: SettlementSettings) => {
    const nextDraft = {
      ...draft,
      iban: draft.iban ? formatIban(normalizeIban(draft.iban).startsWith("IR") ? draft.iban : `IR${normalizeIban(draft.iban).replace(/^IR/i, "")}`) : ""
    };
    setSettlementDraft(nextDraft);
    setSettlementErrors(validateSettlementSettings(nextDraft));
  };

  const saveSettlement = () => {
    const result = applySettlementSettings(settlement, settlementDraft);
    setSettlementErrors(result.errors);

    if (!result.saved) {
      setShowSettlementErrors(true);
      setStatusMessage("اطلاعات تسویه را کامل کن.");
      return;
    }

    setSettlement(result.settlement);
    setSettlementModalOpen(false);
    setShowSettlementErrors(false);
    setStatusMessage("اطلاعات تسویه ذخیره شد.");
  };

  const updateLatestCompany = (latestCompanyId: string) => {
    setCompanyDisplay((current) => ({
      ...current,
      latestCompanyId,
      publicExperienceCompanyIds: normalizePublicCompanyDisplayIds({
        ...current,
        latestCompanyId
      })
    }));
    setStatusMessage("آخرین شرکت محل فعالیت ذخیره شد.");
  };

  const togglePublicCompany = (companyId: string) => {
    setCompanyDisplay((current) => {
      const isSelected = current.publicExperienceCompanyIds.includes(companyId);
      return {
        ...current,
        publicExperienceCompanyIds: normalizePublicCompanyDisplayIds({
          ...current,
          publicExperienceCompanyIds: isSelected
            ? current.publicExperienceCompanyIds.filter((item) => item !== companyId)
            : [...current.publicExperienceCompanyIds, companyId]
        })
      };
    });
    setStatusMessage("شرکت‌های قابل نمایش در پروفایل ذخیره شد.");
  };

  return (
    <div className={styles.settingsShell}>
      <h1>تنظیمات حساب</h1>
      <p className={styles.lead}>اطلاعات حساب، اعلان‌ها و حریم خصوصی.</p>

      <div className={styles.settingsPageGrid}>
        <section className={styles.settingsPageCard}>
          <h2>اطلاعات حساب</h2>
          <div className={styles.row}>
            <span className={styles.k}>نام</span>
            <span className={styles.v}>{account.name}</span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>ایمیل</span>
            <span className={styles.v} dir="ltr">
              {account.email}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>شماره موبایل</span>
            <span className={styles.v} dir="ltr">
              {account.phone}
            </span>
          </div>
          <V51Button type="button" onClick={openAccountModal}>
            <UseravaaIcon name="edit" size={16} aria-hidden="true" />
            ویرایش اطلاعات حساب
          </V51Button>
        </section>

        <section className={styles.settingsPageCard}>
          <h2>اعلان‌ها</h2>
          <SettingsToggle checked={notifications.newRequests} onChange={(checked) => updateNotification("newRequests", checked)}>
            درخواست‌های جدید
          </SettingsToggle>
          <SettingsToggle checked={notifications.proposedTimes} onChange={(checked) => updateNotification("proposedTimes", checked)}>
            زمان‌های پیشنهادی
          </SettingsToggle>
          <SettingsToggle checked={notifications.paymentSettlement} onChange={(checked) => updateNotification("paymentSettlement", checked)}>
            پرداخت و تسویه
          </SettingsToggle>
        </section>

        <section className={styles.settingsPageCard}>
          <h2>حریم خصوصی</h2>
          <SettingsToggle checked={privacy.showProfileAfterApproval} onChange={(checked) => updatePrivacy("showProfileAfterApproval", checked)}>
            نمایش پروفایل در کشف تجربه‌ها بعد از تأیید
          </SettingsToggle>
          <V51Button type="button" tone="danger" onClick={deactivateProfile}>
            غیرفعال‌سازی پروفایل تجربه
          </V51Button>
        </section>

        <section className={styles.settingsPageCard}>
          <h2>نمایش تجربه کاری</h2>
          <label className={styles.companyDisplayField} htmlFor="latestCompanyId">
            <span>آخرین شرکت محل فعالیت</span>
            <span className={styles.companyDisplaySelectWrap}>
              <select id="latestCompanyId" value={companyDisplay.latestCompanyId} onChange={(event) => updateLatestCompany(event.target.value)}>
                {companyDisplay.experienceTimeline.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.companyName}
                  </option>
                ))}
              </select>
              <span className={styles.selectCaret} aria-hidden="true">
                <UseravaaIcon name="dropdown" size={16} />
              </span>
            </span>
          </label>
          <p className={styles.companyDisplayHelp}>آخرین شرکت محل فعالیت الزامی است و نمی‌تواند پنهان شود.</p>
          {companyDisplayErrors.latestCompanyId ? <p className={styles.fieldError}>{companyDisplayErrors.latestCompanyId}</p> : null}
          {latestCompany ? <p className={styles.companyDisplayCurrent}>نمایش الزامی: {latestCompany.companyName}</p> : null}

          <div className={styles.companyDisplayOptions} aria-label="شرکت‌های قابل نمایش در پروفایل">
            <strong>شرکت‌های قابل نمایش در پروفایل</strong>
            <p>این شرکت‌ها در کارت‌های بینش و خلاصه تجربه شما نمایش داده می‌شوند.</p>
            {selectablePublicCompanies.length ? (
              selectablePublicCompanies.map((item) => (
                <label key={item.id} className={styles.companyDisplayOption}>
                  <input
                    type="checkbox"
                    checked={companyDisplay.publicExperienceCompanyIds.includes(item.id)}
                    onChange={() => togglePublicCompany(item.id)}
                  />
                  <span>{item.companyName}</span>
                </label>
              ))
            ) : (
              <p className={styles.companyDisplayHelp}>فقط یک شرکت در سوابق شما ثبت شده است.</p>
            )}
          </div>
        </section>

        <section className={styles.settingsPageCard}>
          <h2>اطلاعات تسویه</h2>
          <div className={styles.row}>
            <span className={styles.k}>شماره شبا</span>
            <span className={styles.v} dir="ltr">
              {settlement.iban ? formatIban(settlement.iban) : "ثبت نشده"}
            </span>
          </div>
          <div className={styles.row}>
            <span className={styles.k}>نام صاحب حساب</span>
            <span className={styles.v}>{settlement.accountOwner || "ثبت نشده"}</span>
          </div>
          <V51Button type="button" onClick={openSettlementModal}>
            <UseravaaIcon name="edit" size={16} aria-hidden="true" />
            ثبت / ویرایش اطلاعات تسویه
          </V51Button>
        </section>
      </div>

      {statusMessage ? <p className={styles.successBox}>{statusMessage}</p> : null}

      {accountModalOpen ? (
        <AccountEditModal
          draft={accountDraft}
          errors={accountErrors}
          showErrors={showAccountErrors}
          onChange={updateAccountDraft}
          onClose={closeAccountModal}
          onSave={saveAccount}
        />
      ) : null}

      {settlementModalOpen ? (
        <SettlementInfoModal
          draft={settlementDraft}
          errors={settlementErrors}
          showErrors={showSettlementErrors}
          onChange={updateSettlementDraft}
          onClose={closeSettlementModal}
          onSave={saveSettlement}
        />
      ) : null}
    </div>
  );
}
