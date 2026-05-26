import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  applyAccountSettings,
  applySettlementSettings,
  initialProfileSettingsFixture,
  normalizePersianDigits,
  updateNotificationSetting,
  updatePrivacySetting,
  validateAccountSettings,
  validateIranIban,
  validateSettlementSettings
} from "@/features/v51/data/my-profile";
import { ProfileSettingsPage } from "@/features/v51/my-profile/pages/ProfileSettingsPage";

describe("Phase 2C-3 V51 profile settings", () => {
  it("settings page renders account, notification, privacy, and settlement cards", () => {
    const html = renderToStaticMarkup(<ProfileSettingsPage />);

    expect(html).toContain("تنظیمات حساب");
    expect(html).toContain("اطلاعات حساب");
    expect(html).toContain("اعلان‌ها");
    expect(html).toContain("حریم خصوصی");
    expect(html).toContain("اطلاعات تسویه");
    expect(html).toContain("ویرایش اطلاعات حساب");
    expect(html).toContain("ثبت / ویرایش اطلاعات تسویه");
  });

  it("account edit modal opens and default settings page keeps it closed", () => {
    const closedHtml = renderToStaticMarkup(<ProfileSettingsPage />);
    const openHtml = renderToStaticMarkup(<ProfileSettingsPage initialAccountModalOpen />);

    expect(closedHtml).not.toContain('aria-labelledby="accountEditTitle"');
    expect(openHtml).toContain("ویرایش اطلاعات حساب");
    expect(openHtml).toContain("ذخیره تغییرات");
    expect(openHtml).toContain("انصراف");
  });

  it("account fields validate correctly", () => {
    const errors = validateAccountSettings({ name: "ع", email: "bad-email", phone: "۱۲۳" });

    expect(errors.name).toBe("نام را کامل وارد کن.");
    expect(errors.email).toBe("ایمیل معتبر وارد کن.");
    expect(errors.phone).toBe("شماره موبایل باید با 09 شروع شود و ۱۱ رقم باشد.");
    expect(normalizePersianDigits("۰۹۱۲۱۲۳۴۵۶۷")).toBe("09121234567");
  });

  it("save behavior updates valid mock account state and invalid save preserves previous state", () => {
    const current = initialProfileSettingsFixture.account;
    const valid = applyAccountSettings(current, { name: "سارا م.", email: "sara@example.com", phone: "09123456789" });
    const invalid = applyAccountSettings(current, { name: "", email: "bad", phone: "1" });

    expect(valid.saved).toBe(true);
    expect(valid.account.name).toBe("سارا م.");
    expect(valid.account.phone).toBe("09123456789");
    expect(invalid.saved).toBe(false);
    expect(invalid.account).toEqual(current);
  });

  it("notification toggles work with mock state", () => {
    const next = updateNotificationSetting(initialProfileSettingsFixture.notifications, "newRequests", false);

    expect(next.newRequests).toBe(false);
    expect(next.proposedTimes).toBe(true);
  });

  it("privacy toggles work with mock state", () => {
    const next = updatePrivacySetting(initialProfileSettingsFixture.privacy, "showFollowerCount", true);

    expect(next.showFollowerCount).toBe(true);
    expect(next.showProfileAfterApproval).toBe(true);
  });

  it("settlement Shaba form validates IR format", () => {
    expect(validateIranIban("IR123456789012345678901234")).toBe(true);
    expect(validateIranIban("IR123")).toBe(false);
    expect(validateIranIban("XX123456789012345678901234")).toBe(false);

    const errors = validateSettlementSettings({ accountOwner: "ع", iban: "IR123", verified: false });
    expect(errors.accountOwner).toBe("نام صاحب حساب را کامل وارد کن.");
    expect(errors.iban).toBe("شماره شبا باید با IR شروع شود و ۲۴ رقم بعد از آن داشته باشد.");
  });

  it("settlement save updates valid mock state and invalid save preserves previous state", () => {
    const current = initialProfileSettingsFixture.settlement;
    const valid = applySettlementSettings(current, {
      accountOwner: "علی ر.",
      iban: "IR123456789012345678901234",
      verified: false
    });
    const invalid = applySettlementSettings(current, { accountOwner: "", iban: "IR123", verified: false });

    expect(valid.saved).toBe(true);
    expect(valid.settlement.verified).toBe(true);
    expect(valid.settlement.iban).toBe("IR123456789012345678901234");
    expect(invalid.saved).toBe(false);
    expect(invalid.settlement).toEqual(current);
  });

  it("settlement modal opens with save and cancel controls", () => {
    const html = renderToStaticMarkup(<ProfileSettingsPage initialSettlementModalOpen />);

    expect(html).toContain("اطلاعات تسویه");
    expect(html).toContain("شماره شبا");
    expect(html).toContain("ذخیره اطلاعات تسویه");
    expect(html).toContain("انصراف");
  });
});
