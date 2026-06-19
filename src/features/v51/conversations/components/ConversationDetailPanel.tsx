"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { MetaChip } from "@/components/ui/MetaChip";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { getConversationStatusIconName } from "@/features/v51/conversations/conversation-icon-names";
import {
  attendanceVerificationCopy,
  cancelConversationByProvider,
  cancelConversation,
  cancellationPolicyCopy,
  cancellationReasonOptions,
  canProviderCancelConfirmedSession,
  canProviderCancelRequestBeforeSelection,
  canProviderReplaceProposedTimes,
  canProviderRejectRequest,
  canRequesterCancelRequest,
  canRequesterRequestNewTimes,
  conversationReliabilityCopy,
  formatDuration,
  formatPrice,
  formatToman,
  getAttendanceVerificationCodeForRequester,
  getAttendanceVerificationStatus,
  getCancellationRecoveryActions,
  getCancellationRecoveryCopy,
  getCancellationRefundPolicy,
  getClosedDetailDescription,
  getClosedDetailTitle,
  getProviderPayoutStatus,
  getSessionCoordinationContact,
  getConversationActions,
  getConversationPrice,
  getConversationStatusLabel,
  getDeadlineText,
  getNextActionText,
  getPersonName,
  getPersonRole,
  newTimeRequestCopy,
  providerTimeReplacementCopy,
  postPaymentContactCopy,
  providerRequestCancellationReasonOptions,
  providerRejectionReasonOptions,
  providerSessionCancellationReasonOptions,
  providerSideClosureCopy,
  requestNewTimesForConversation,
  getSimilarExperiences,
  isNearProviderExpiration,
  isPaidConfirmedSession,
  rejectConversationByProvider,
  verifySessionAttendanceCode,
  type CancellationReasonCode,
  type ConversationAction,
  type ConversationFixture,
  type ProviderCancellationReasonCode,
  type ProviderRejectionReasonCode
} from "@/features/v51/data/conversations";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import { ConfirmedSessionIllustration } from "./ConfirmedSessionIllustration";
import { StateActionButton } from "./StateActionButton";
import styles from "./ConversationCluster.module.css";

type ConversationDetailPanelProps = {
  conversation: ConversationFixture;
  onConversationChange?: (conversation: ConversationFixture) => void;
};

function isConfirmedSessionState(conversation: Pick<ConversationFixture, "status">) {
  return conversation.status === "confirmed" || (conversation.status as string) === "scheduled";
}

function getSelectedSessionTimeLabel(conversation: ConversationFixture) {
  return conversation.selectedTime ? `${conversation.selectedTime.dateLabel}، ساعت ${conversation.selectedTime.timeLabel}` : "زمان جلسه هنوز ثبت نشده است";
}

function ConfirmedSessionSuccessBlock({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  if (!isConfirmedSessionState(conversation)) {
    return null;
  }

  const selectedTimeLabel = getSelectedSessionTimeLabel(conversation);

  return (
    <section className={styles.confirmedSuccessBlock} data-testid="confirmed-session-success-block" aria-labelledby="confirmed-session-title">
      <div className={styles.confirmedSuccessCopy}>
        <span className={styles.successEyebrow}>جلسه قطعی</span>
        <h1 id="confirmed-session-title">جلسه قطعی شد</h1>
        <p>زمان جلسه انتخاب شد و اطلاعات هماهنگی مربوط به این گفت‌وگو در دسترس است.</p>
        <div className={styles.confirmedSessionMeta}>
          <span>زمان جلسه</span>
          <strong>{selectedTimeLabel}</strong>
        </div>
        <div className={styles.confirmedActions}>
          <V51LinkButton href="#coordination" tone="primary">
            مشاهده اطلاعات هماهنگی
          </V51LinkButton>
          <V51LinkButton href="/sessions">بازگشت به جلسه‌ها</V51LinkButton>
        </div>
      </div>
      <ConfirmedSessionIllustration selectedTimeLabel={conversation.selectedTime?.timeLabel} />
    </section>
  );
}

function SessionContactAccess({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  const contact = getSessionCoordinationContact(conversation);

  if (!contact) {
    return (
      <section id="coordination" className={styles.contactBox} aria-label={postPaymentContactCopy.lockedTitle}>
        <h2 className={styles.panelTitleWithIcon}>
          <UseravaaIcon name="privacyLock" size={18} aria-hidden="true" />
          {postPaymentContactCopy.lockedTitle}
        </h2>
        <p>{postPaymentContactCopy.lockedHelper}</p>
      </section>
    );
  }

  return (
    <section id="coordination" className={styles.contactBox} aria-label={postPaymentContactCopy.unlockedTitle}>
      <h2 className={styles.panelTitleWithIcon}>
        <UseravaaIcon name="info" size={18} aria-hidden="true" />
        {postPaymentContactCopy.unlockedTitle}
      </h2>
      <p>{postPaymentContactCopy.unlockedHelper}</p>
      <div className={styles.contactRows}>
        <div className={styles.contactRow}>
          <span>شماره تماس</span>
          <strong dir="ltr">{contact.phoneNumber || postPaymentContactCopy.missingPhone}</strong>
        </div>
        <div className={styles.contactRow}>
          <span>ایمیل</span>
          <strong dir="ltr">{contact.email || postPaymentContactCopy.missingEmail}</strong>
        </div>
      </div>
    </section>
  );
}

function AttendanceVerificationSection({
  conversation,
  onConversationChange
}: Readonly<{
  conversation: ConversationFixture;
  onConversationChange?: (conversation: ConversationFixture) => void;
}>) {
  const [currentConversation, setCurrentConversation] = useState(conversation);
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationMessage, setVerificationMessage] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const verificationStatus = getAttendanceVerificationStatus(currentConversation);
  const requesterCode = getAttendanceVerificationCodeForRequester(currentConversation);
  const payoutStatus = getProviderPayoutStatus(currentConversation);

  if (!isPaidConfirmedSession(currentConversation) || verificationStatus === "NOT_REQUIRED") {
    return null;
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const result = verifySessionAttendanceCode(currentConversation, verificationCode);
    setCurrentConversation(result.conversation);
    setVerificationMessage(result.message);
    setVerificationCode("");
    onConversationChange?.(result.conversation);
  };

  const handleCopyCode = async () => {
    if (!requesterCode) {
      return;
    }

    try {
      await navigator.clipboard.writeText(requesterCode);
      setCopyMessage(attendanceVerificationCopy.copied);
    } catch {
      setCopyMessage(attendanceVerificationCopy.copyFailed);
    }
  };

  if (currentConversation.direction === "outgoing") {
    return (
      <section className={styles.attendanceBox} aria-labelledby="attendance-code-title">
        <div>
          <h2 id="attendance-code-title">{attendanceVerificationCopy.title}</h2>
          <p>{attendanceVerificationCopy.requesterDetail}</p>
        </div>
        {requesterCode ? (
          <div className={styles.verificationCodeRow}>
            <strong className={styles.verificationCode} dir="ltr">{requesterCode}</strong>
            <V51Button type="button" tone="secondary" onClick={handleCopyCode}>
              {attendanceVerificationCopy.copy}
            </V51Button>
          </div>
        ) : null}
        {copyMessage ? <p className={styles.attendanceHelper} role="status">{copyMessage}</p> : null}
        {verificationStatus === "VERIFIED" ? (
          <p className={styles.successBox}>
            <UseravaaIcon name="success" size={16} aria-hidden="true" />
            {attendanceVerificationCopy.verifiedTitle}
          </p>
        ) : (
          <p className={styles.attendanceHelper}>{attendanceVerificationCopy.requesterHelper}</p>
        )}
      </section>
    );
  }

  if (verificationStatus === "VERIFIED") {
    return (
      <section className={styles.attendanceBox} aria-labelledby="attendance-verified-title">
        <div>
          <h2 id="attendance-verified-title">{attendanceVerificationCopy.verifiedTitle}</h2>
          <p>{attendanceVerificationCopy.verifiedProvider}</p>
        </div>
        {payoutStatus === "BLOCKED_MISSING_SETTLEMENT_INFO" ? (
          <div className={styles.payoutNotice}>
            <p>{attendanceVerificationCopy.missingSettlement}</p>
            <V51LinkButton href="/wallet">{attendanceVerificationCopy.missingSettlementCta}</V51LinkButton>
          </div>
        ) : null}
        {payoutStatus === "PENDING_24H" ? <p className={styles.attendanceHelper}>{attendanceVerificationCopy.payoutPending}</p> : null}
      </section>
    );
  }

  return (
    <section className={styles.attendanceBox} aria-labelledby="attendance-provider-title">
      <div>
        <h2 id="attendance-provider-title">{attendanceVerificationCopy.providerTitle}</h2>
        <p>{attendanceVerificationCopy.providerDetail}</p>
      </div>
      <form className={styles.verificationForm} onSubmit={handleSubmit}>
        <label htmlFor={`attendance-code-${currentConversation.id}`}>{attendanceVerificationCopy.title}</label>
        <input
          id={`attendance-code-${currentConversation.id}`}
          inputMode="numeric"
          maxLength={5}
          pattern="[0-9۰-۹٠-٩]{5}"
          value={verificationCode}
          onChange={(event) => setVerificationCode(event.target.value)}
          placeholder="مثلاً ۴۸۲۹۱"
          aria-describedby={verificationMessage ? `attendance-message-${currentConversation.id}` : undefined}
        />
        <V51Button type="submit" tone="primary" disabled={verificationCode.trim().length < 5}>
          {attendanceVerificationCopy.providerTitle}
        </V51Button>
      </form>
      {verificationMessage ? (
        <p id={`attendance-message-${currentConversation.id}`} className={verificationStatus === "FAILED" ? styles.warningBox : styles.attendanceHelper}>
          {verificationMessage}
        </p>
      ) : null}
    </section>
  );
}

function ClosedConversationState({ conversation }: Readonly<{ conversation: ConversationFixture }>) {
  if (conversation.status !== "cancelled" && conversation.status !== "rejected") {
    return null;
  }

  const showRecovery = conversation.direction === "outgoing";
  const actions = showRecovery ? getCancellationRecoveryActions(conversation) : [];
  const isCancelledState = conversation.status === "cancelled";
  const isRequesterCancelled = conversation.status === "cancelled" && conversation.direction === "outgoing";
  const isProviderCompensated = conversation.status === "cancelled" && conversation.direction === "incoming" && (conversation.providerNetCompensation ?? 0) > 0;
  const paidAmount = getConversationPrice(conversation);

  return (
    <section className={`${styles.cancelledState} ${isCancelledState ? styles.cancelledStateDanger : ""}`} aria-labelledby="cancelled-request-title">
      <div className={`${styles.cancelledStatus} ${isCancelledState ? styles.cancelledStatusDanger : ""}`}>
        <UseravaaIcon name={isCancelledState ? "warning" : "archive"} size={20} aria-hidden="true" />
        <div>
          <h2 id="cancelled-request-title">{getClosedDetailTitle(conversation)}</h2>
          <p>{getClosedDetailDescription(conversation)}</p>
        </div>
      </div>
      {isRequesterCancelled ? (
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span>مبلغ پرداختی</span>
            <strong>{formatToman(paidAmount)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>درصد مبلغ برگشتی</span>
            <strong>{Math.round((conversation.refundRate ?? 0) * 100)}٪</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>مبلغ برگشتی</span>
            <strong>{formatToman(conversation.refundAmount ?? 0)}</strong>
          </div>
          {(conversation.refundAmount ?? 0) > 0 ? (
            <div className={styles.summaryRow}>
              <span>مقصد مبلغ برگشتی</span>
              <strong>کیف پول</strong>
            </div>
          ) : null}
        </div>
      ) : null}
      {isProviderCompensated ? (
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span>{cancellationPolicyCopy.providerCancellationGrossLabel}</span>
            <strong>{formatToman(conversation.providerGrossCompensation ?? 0)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{cancellationPolicyCopy.providerCancellationFeeLabel}</span>
            <strong>{formatToman(conversation.useravaaFeeAmount ?? 0)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{cancellationPolicyCopy.providerCancellationNetLabel}</span>
            <strong>{formatToman(conversation.providerNetCompensation ?? 0)}</strong>
          </div>
        </div>
      ) : null}
      {showRecovery ? (
        <div className={styles.recoveryBlock}>
          <h2>{cancellationPolicyCopy.recoveryTitle}</h2>
          <p>{getCancellationRecoveryCopy(conversation)}</p>
          <div className={styles.recoveryActions}>
            {actions.map((action) => (
              <V51LinkButton key={action.id} href={action.href} tone={action.tone}>
                {action.label}
              </V51LinkButton>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

type ProviderClosureMode = "reject" | "cancelRequest" | "cancelSession";

function getProviderClosureMode(conversation: ConversationFixture): ProviderClosureMode | null {
  if (canProviderRejectRequest(conversation)) {
    return "reject";
  }

  if (canProviderCancelRequestBeforeSelection(conversation)) {
    return "cancelRequest";
  }

  if (canProviderCancelConfirmedSession(conversation)) {
    return "cancelSession";
  }

  return null;
}

function getProviderClosureCopy(mode: ProviderClosureMode) {
  if (mode === "reject") {
    return {
      sectionTitle: providerSideClosureCopy.rejectSectionTitle,
      sectionText: providerSideClosureCopy.rejectSectionText,
      cta: providerSideClosureCopy.rejectCta,
      modalTitle: providerSideClosureCopy.rejectModalTitle,
      modalText: providerSideClosureCopy.rejectModalText,
      reasonLabel: providerSideClosureCopy.rejectionReasonLabel,
      confirm: providerSideClosureCopy.confirmReject
    };
  }

  if (mode === "cancelSession") {
    return {
      sectionTitle: providerSideClosureCopy.confirmedCancelSectionTitle,
      sectionText: providerSideClosureCopy.confirmedCancelSectionText,
      cta: providerSideClosureCopy.cancelSessionCta,
      modalTitle: providerSideClosureCopy.cancelSessionModalTitle,
      modalText: providerSideClosureCopy.cancelSessionModalText,
      reasonLabel: providerSideClosureCopy.cancelSessionReasonLabel,
      confirm: providerSideClosureCopy.confirmCancelSession
    };
  }

  return {
    sectionTitle: providerSideClosureCopy.changeSectionTitle,
    sectionText: providerSideClosureCopy.changeSectionTextWithoutReplacement,
    cta: providerSideClosureCopy.cancelRequestCta,
    modalTitle: providerSideClosureCopy.cancelRequestModalTitle,
    modalText: providerSideClosureCopy.cancelRequestModalText,
    reasonLabel: providerSideClosureCopy.cancelRequestReasonLabel,
    confirm: providerSideClosureCopy.continueCancelRequest
  };
}

function getProviderReasonOptions(mode: ProviderClosureMode) {
  if (mode === "reject") {
    return providerRejectionReasonOptions;
  }

  return mode === "cancelSession" ? providerSessionCancellationReasonOptions : providerRequestCancellationReasonOptions;
}

function ProviderSideClosureManager({
  conversation,
  onConversationChange
}: Readonly<{
  conversation: ConversationFixture;
  onConversationChange?: (conversation: ConversationFixture) => void;
}>) {
  const mode = getProviderClosureMode(conversation);
  const [modalStep, setModalStep] = useState<"closed" | "alternatives" | "reason">("closed");
  const [replacementModalOpen, setReplacementModalOpen] = useState(false);
  const [reasonCode, setReasonCode] = useState<ProviderRejectionReasonCode | ProviderCancellationReasonCode | "">("");
  const [reasonText, setReasonText] = useState("");

  if (!mode) {
    return null;
  }

  const copy = getProviderClosureCopy(mode);
  const reasonOptions = getProviderReasonOptions(mode);
  const canReplaceOptions = mode === "cancelRequest" && canProviderReplaceProposedTimes(conversation);
  const sectionTitle = canReplaceOptions ? providerTimeReplacementCopy.sectionTitle : copy.sectionTitle;
  const sectionText = canReplaceOptions ? providerTimeReplacementCopy.sectionText : copy.sectionText;
  const closureCta = canReplaceOptions ? providerTimeReplacementCopy.cancelCta : copy.cta;

  const closeModal = () => {
    setModalStep("closed");
    setReasonCode("");
    setReasonText("");
  };

  const openClosureModal = () => {
    setModalStep(canReplaceOptions ? "alternatives" : "reason");
  };

  const openReplacementModal = () => {
    setModalStep("closed");
    setReplacementModalOpen(true);
  };

  const confirmClosure = () => {
    if (!reasonCode) {
      return;
    }

    const nextConversation =
      mode === "reject"
        ? rejectConversationByProvider(conversation, {
            reasonCode: reasonCode as ProviderRejectionReasonCode,
            reasonText
          })
        : cancelConversationByProvider(conversation, {
            reasonCode: reasonCode as ProviderCancellationReasonCode,
            reasonText
          });

    onConversationChange?.(nextConversation);
    closeModal();
  };

  return (
    <section className={styles.cancellationSection} aria-labelledby="provider-closure-title">
      <div>
        <h2 id="provider-closure-title">{sectionTitle}</h2>
        <p>{sectionText}</p>
      </div>
      <div className={styles.cancellationAlternatives}>
        {canReplaceOptions ? (
          <V51Button type="button" tone="blueSecondary" onClick={openReplacementModal}>
            {providerTimeReplacementCopy.cta}
          </V51Button>
        ) : null}
        <V51Button type="button" tone="danger" onClick={openClosureModal}>
          {closureCta}
        </V51Button>
      </div>

      {modalStep !== "closed" ? (
        <div className={styles.cancelModalBackdrop} role="presentation">
          <section className={styles.cancelModal} role="dialog" aria-modal="true" aria-labelledby="provider-closure-modal-title">
            {modalStep === "alternatives" ? (
              <>
                <h2 id="provider-closure-modal-title">{providerTimeReplacementCopy.sectionTitle}</h2>
                <p>{providerTimeReplacementCopy.sectionText}</p>
                <div className={styles.cancelModalActions}>
                  <V51Button type="button" onClick={closeModal}>
                    {providerSideClosureCopy.back}
                  </V51Button>
                  <V51Button type="button" tone="blueSecondary" onClick={openReplacementModal}>
                    {providerTimeReplacementCopy.cta}
                  </V51Button>
                  <V51Button type="button" tone="danger" onClick={() => setModalStep("reason")}>
                    {providerSideClosureCopy.continueCancelRequest}
                  </V51Button>
                </div>
              </>
            ) : (
              <>
                <h2 id="provider-closure-modal-title">{copy.modalTitle}</h2>
                <p>{copy.modalText}</p>
                <div className={styles.reasonOptions} role="radiogroup" aria-label={copy.reasonLabel}>
                  <p className={styles.formHint}>{copy.reasonLabel}</p>
                  {reasonOptions.map((option) => (
                    <label key={option.code} className={styles.reasonOption}>
                      <input
                        type="radio"
                        name={`provider-closure-reason-${conversation.id}`}
                        value={option.code}
                        checked={reasonCode === option.code}
                        onChange={() => setReasonCode(option.code)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <label className={styles.formField}>
                  <span>{providerSideClosureCopy.optionalTextLabel}</span>
                  <textarea
                    className={styles.formInput}
                    rows={3}
                    value={reasonText}
                    onChange={(event) => setReasonText(event.target.value)}
                  />
                </label>
                <div className={styles.cancelModalActions}>
                  <V51Button type="button" onClick={closeModal}>
                    {providerSideClosureCopy.back}
                  </V51Button>
                  <V51Button type="button" tone="danger" disabled={!reasonCode} onClick={confirmClosure}>
                    {copy.confirm}
                  </V51Button>
                </div>
              </>
            )}
          </section>
        </div>
      ) : null}

      {replacementModalOpen ? (
        <div className={styles.cancelModalBackdrop} role="presentation">
          <section className={styles.cancelModal} role="dialog" aria-modal="true" aria-labelledby="provider-time-replacement-modal-title">
            <h2 id="provider-time-replacement-modal-title">{providerTimeReplacementCopy.modalTitle}</h2>
            <p>{providerTimeReplacementCopy.modalText}</p>
            <p className={styles.infoBox}>
              <UseravaaIcon name="info" size={16} aria-hidden="true" />
              {providerTimeReplacementCopy.modalHelper}
            </p>
            <div className={styles.cancelModalActions}>
              <V51LinkButton href={`/conversations/${conversation.id}/propose-times`} tone="primary">
                {providerTimeReplacementCopy.modalConfirm}
              </V51LinkButton>
              <V51Button type="button" onClick={() => setReplacementModalOpen(false)}>
                {providerTimeReplacementCopy.modalBack}
              </V51Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

function CancellationManager({
  conversation,
  onConversationChange
}: Readonly<{
  conversation: ConversationFixture;
  onConversationChange?: (conversation: ConversationFixture) => void;
}>) {
  const [modalStep, setModalStep] = useState<"closed" | "alternatives" | "reason" | "preview">("closed");
  const [reasonCode, setReasonCode] = useState<CancellationReasonCode | "">("");
  const [reasonText, setReasonText] = useState("");
  const [newTimeModalOpen, setNewTimeModalOpen] = useState(false);
  const [newTimeNote, setNewTimeNote] = useState("");
  const policy = getCancellationRefundPolicy(conversation);
  const canRequestNewTimes = canRequesterRequestNewTimes(conversation);

  if (!canRequesterCancelRequest(conversation)) {
    return null;
  }

  const closeModal = () => {
    setModalStep("closed");
    setReasonCode("");
    setReasonText("");
  };

  const openNewTimeModal = () => {
    setModalStep("closed");
    setNewTimeModalOpen(true);
  };

  const closeNewTimeModal = () => {
    setNewTimeModalOpen(false);
    setNewTimeNote("");
  };

  const confirmNewTimeRequest = () => {
    if (!canRequestNewTimes) {
      return;
    }

    const nextConversation = requestNewTimesForConversation(conversation, newTimeNote);
    onConversationChange?.(nextConversation);
    closeNewTimeModal();
  };

  const confirmCancellation = () => {
    if (!reasonCode) {
      return;
    }

    const nextConversation = cancelConversation(conversation, {
      reasonCode,
      reasonText,
      cancelledByRole: "REQUESTER"
    });
    onConversationChange?.(nextConversation);
    closeModal();
  };

  return (
    <section className={styles.cancellationSection} aria-labelledby="change-request-title">
      <div>
        <h2 id="change-request-title">{cancellationPolicyCopy.changeTitle}</h2>
        <p>{cancellationPolicyCopy.changeHelper}</p>
      </div>
      <div className={styles.cancellationAlternatives}>
        {canRequestNewTimes ? (
          <V51Button type="button" tone="primary" onClick={openNewTimeModal}>
            {newTimeRequestCopy.cta}
          </V51Button>
        ) : null}
        <V51Button type="button" tone="danger" onClick={() => setModalStep("alternatives")}>
          {cancellationPolicyCopy.cancelCta}
        </V51Button>
      </div>

      {modalStep !== "closed" ? (
        <div className={styles.cancelModalBackdrop} role="presentation">
          <section className={styles.cancelModal} role="dialog" aria-modal="true" aria-labelledby="cancel-modal-title">
            {modalStep === "alternatives" ? (
              <>
                <h2 id="cancel-modal-title">{cancellationPolicyCopy.alternativesTitle}</h2>
                <p>{cancellationPolicyCopy.alternativesText}</p>
                <div className={styles.cancelModalActions}>
                  <V51Button type="button" onClick={closeModal}>
                    {cancellationPolicyCopy.back}
                  </V51Button>
                  <V51Button type="button" tone="danger" onClick={() => setModalStep("reason")}>
                    {cancellationPolicyCopy.continueCancel}
                  </V51Button>
                </div>
              </>
            ) : null}

            {modalStep === "reason" ? (
              <>
                <h2 id="cancel-modal-title">{cancellationPolicyCopy.reasonTitle}</h2>
                <div className={styles.reasonOptions}>
                  {cancellationReasonOptions.map((option) => (
                    <label key={option.code} className={styles.reasonOption}>
                      <input
                        type="radio"
                        name="cancellation-reason"
                        value={option.code}
                        checked={reasonCode === option.code}
                        onChange={() => setReasonCode(option.code)}
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <label className={styles.formField}>
                  <span>{cancellationPolicyCopy.optionalTextLabel}</span>
                  <textarea
                    className={styles.formInput}
                    rows={3}
                    value={reasonText}
                    onChange={(event) => setReasonText(event.target.value)}
                  />
                </label>
                <div className={styles.cancelModalActions}>
                  <V51Button type="button" tone="primary" disabled={!reasonCode} onClick={() => setModalStep("preview")}>
                    ادامه
                  </V51Button>
                  <V51Button type="button" onClick={() => setModalStep("alternatives")}>
                    {cancellationPolicyCopy.back}
                  </V51Button>
                </div>
              </>
            ) : null}

            {modalStep === "preview" ? (
              <>
                <h2 id="cancel-modal-title">{policy.isLateRequesterCancellation ? cancellationPolicyCopy.nearSessionModalTitle : cancellationPolicyCopy.previewTitle}</h2>
                <p className={styles.infoBox}>
                  <UseravaaIcon name="info" size={16} aria-hidden="true" />
                  {policy.isLateRequesterCancellation ? cancellationPolicyCopy.nearSessionModalText : policy.copy}
                </p>
                <p>{policy.isLateRequesterCancellation ? cancellationPolicyCopy.nearSessionModalSecondaryText : policy.destinationCopy}</p>
                <div className={styles.summaryRows}>
                  <div className={styles.summaryRow}>
                    <span>مبلغ برگشتی</span>
                    <strong>{formatToman(policy.refundAmount)}</strong>
                  </div>
                  {policy.refundAmount > 0 ? (
                    <div className={styles.summaryRow}>
                      <span>مقصد بازگشت اعتبار</span>
                      <strong>کیف پول</strong>
                    </div>
                  ) : null}
                </div>
                <div className={styles.cancelModalActions}>
                  <V51Button type="button" tone="danger" disabled={!reasonCode} onClick={confirmCancellation}>
                    {cancellationPolicyCopy.confirmCancel}
                  </V51Button>
                  <V51Button type="button" onClick={() => setModalStep("reason")}>
                    {cancellationPolicyCopy.back}
                  </V51Button>
                </div>
              </>
            ) : null}
          </section>
        </div>
      ) : null}

      {newTimeModalOpen ? (
        <div className={styles.cancelModalBackdrop} role="presentation">
          <section className={styles.cancelModal} role="dialog" aria-modal="true" aria-labelledby="new-time-modal-title">
            <h2 id="new-time-modal-title">{newTimeRequestCopy.modalTitle}</h2>
            <p>{newTimeRequestCopy.modalText}</p>
            <p className={styles.infoBox}>
              <UseravaaIcon name="info" size={16} aria-hidden="true" />
              {newTimeRequestCopy.modalHelper}
            </p>
            <label className={styles.formField}>
              <span>{newTimeRequestCopy.optionalNoteLabel}</span>
              <textarea
                className={styles.formInput}
                rows={3}
                maxLength={200}
                value={newTimeNote}
                placeholder={newTimeRequestCopy.optionalNotePlaceholder}
                onChange={(event) => setNewTimeNote(event.target.value.slice(0, 200))}
              />
            </label>
            <div className={styles.cancelModalActions}>
              <V51Button type="button" tone="primary" onClick={confirmNewTimeRequest}>
                {newTimeRequestCopy.modalConfirm}
              </V51Button>
              <V51Button type="button" onClick={closeNewTimeModal}>
                {newTimeRequestCopy.modalBack}
              </V51Button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}

export function ConversationDetailPanel({ conversation, onConversationChange }: ConversationDetailPanelProps) {
  const actions = getConversationActions(conversation).filter((action) => action.kind !== "cancel");
  const deadlineText = getDeadlineText(conversation);
  const similarExperiences = getSimilarExperiences(conversation);
  const isConfirmedSession = isConfirmedSessionState(conversation);
  const selectedTimeLabel = getSelectedSessionTimeLabel(conversation);
  const topicLabel = conversation.requestTopic ?? "موضوع گفت‌وگو ثبت نشده است";
  const noteLabel = conversation.note || "توضیحی ثبت نشده است";

  const handleAction = (action: ConversationAction) => {
    if (action.kind === "cancel") {
      onConversationChange?.(cancelConversation(conversation));
    }
  };

  return (
    <div className={styles.detailGrid}>
      <ConfirmedSessionSuccessBlock conversation={conversation} />

      <section className={styles.panel}>
        <div className={styles.topline}>
          <div className={styles.person}>
            <Avatar src={conversation.direction === "incoming" ? undefined : conversation.profile.avatarUrl} alt="" size="lg" className={styles.avatar} />
            <div>
              <h2>{getPersonName(conversation)}</h2>
              <p className={styles.role}>{getPersonRole(conversation)}</p>
            </div>
          </div>
          <MetaChip className={`${styles.badge} ${styles.badgeAction}`} icon={getConversationStatusIconName(conversation.status)} iconSize={14}>
            {getConversationStatusLabel(conversation)}
          </MetaChip>
        </div>

        <div className={styles.badges}>
          <MetaChip className={styles.badge} icon="sessionTime" iconSize={14}>
            {formatDuration(conversation.duration)}
          </MetaChip>
          {!isConfirmedSession ? (
            <MetaChip className={styles.badge} icon="cost" iconSize={14}>
              {formatPrice(conversation)}
            </MetaChip>
          ) : null}
          <MetaChip className={styles.badge} icon="calendar" iconSize={14}>
            {conversation.submittedAtLabel}
          </MetaChip>
          {deadlineText ? (
            <MetaChip className={`${styles.badge} ${styles.badgeDeadline}`} icon="warning" iconSize={14}>
              {deadlineText}
            </MetaChip>
          ) : null}
          {conversation.selectedTime ? (
            <MetaChip className={`${styles.badge} ${styles.badgeSoft}`} icon="sessionTime" iconSize={14}>
              {conversation.selectedTime.dateLabel}، {conversation.selectedTime.timeLabel}
            </MetaChip>
          ) : null}
        </div>

        {conversation.status === "cancelled" || conversation.status === "rejected" ? (
          <ClosedConversationState conversation={conversation} />
        ) : (
          <>
            <p className={styles.infoBox}>
              <UseravaaIcon name="info" size={16} aria-hidden="true" />
              {getNextActionText(conversation)}
            </p>
            {isNearProviderExpiration(conversation) ? (
              <p className={styles.warningBox}>
                <UseravaaIcon name="warning" size={16} aria-hidden="true" />
                {conversationReliabilityCopy.nearExpirationWarning}
              </p>
            ) : null}

            <AttendanceVerificationSection conversation={conversation} onConversationChange={onConversationChange} />
            <SessionContactAccess conversation={conversation} />
          </>
        )}

        <h2>{isConfirmedSession ? "جزئیات جلسه" : "جزئیات درخواست"}</h2>
        <div className={styles.summaryRows}>
          <div className={styles.summaryRow}>
            <span>{conversation.direction === "incoming" ? "درخواست‌دهنده" : "تجربه‌آفرین"}</span>
            <strong>{getPersonName(conversation)}</strong>
          </div>
          {conversation.direction === "outgoing" ? (
            <div className={styles.summaryRow}>
              <span>عنوان شغلی</span>
              <strong>{conversation.profile.roleFa}</strong>
            </div>
          ) : null}
          <div className={styles.summaryRow}>
            <span>موضوع گفت‌وگو</span>
            <strong>{topicLabel}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>{conversation.direction === "incoming" ? "توضیح درخواست" : "توضیح شما"}</span>
            <strong>{noteLabel}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>مدت گفت‌وگو</span>
            <strong>{formatDuration(conversation.duration)}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>زمان جلسه</span>
            <strong>{conversation.selectedTime ? selectedTimeLabel : "هنوز انتخاب نشده است"}</strong>
          </div>
          <div className={styles.summaryRow}>
            <span>وضعیت</span>
            <strong>{getConversationStatusLabel(conversation)}</strong>
          </div>
        </div>
        <ProviderSideClosureManager conversation={conversation} onConversationChange={onConversationChange} />
        {similarExperiences.length > 0 ? (
          <section className={styles.similarSection} aria-label={conversationReliabilityCopy.similarTitle}>
            <h2>{conversationReliabilityCopy.similarTitle}</h2>
            <div className={styles.similarGrid}>
              {similarExperiences.map((profile) => (
                <a key={profile.profileId} href={`/profiles/${profile.profileId}`} className={styles.similarCard}>
                  <strong>{profile.displayName}</strong>
                  <span>{profile.jobTitle}</span>
                  <small>
                    {profile.jobField} · {profile.orgLevel}
                  </small>
                </a>
              ))}
            </div>
          </section>
        ) : null}
        <CancellationManager conversation={conversation} onConversationChange={onConversationChange} />
      </section>

      {isConfirmedSession ? (
        <aside className={styles.panel}>
          <h2>زمان جلسه</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineStep}>
              <strong>{conversation.selectedTime?.dateLabel ?? "زمان جلسه"}</strong>
              <span>{conversation.selectedTime ? `ساعت ${conversation.selectedTime.timeLabel}` : "زمان نهایی جلسه ثبت شده است."}</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>مدت گفت‌وگو: {formatDuration(conversation.duration)}</strong>
              <span>این زمان نهایی انتخاب‌شده برای همین گفت‌وگو است.</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>اطلاعات هماهنگی جلسه</strong>
              <span>جزئیات هماهنگی را از بخش اطلاعات هماهنگی همین صفحه دنبال کنید.</span>
            </div>
          </div>
          <div className={styles.actions}>
            <V51LinkButton href="/sessions" tone="primary">بازگشت به جلسه‌ها</V51LinkButton>
            {conversation.direction === "outgoing" ? <V51LinkButton href={`/profiles/${conversation.profile.id}`}>مشاهده پروفایل تجربه‌آفرین</V51LinkButton> : null}
          </div>
        </aside>
      ) : (
        <aside className={styles.panel}>
          <h2>اقدام بعدی</h2>
          <div className={styles.actions}>
            {actions.map((action) => (
              <StateActionButton key={action.kind} action={action} onAction={handleAction} />
            ))}
          </div>
          {actions.map((action) => (action.disabledMessage ? <p key={`${action.kind}-reason`} className={styles.disabledReason}>{action.disabledMessage}</p> : null))}

          <h2>جریان جلسه</h2>
          <div className={styles.timeline}>
            <div className={styles.timelineStep}>
              <strong>پرداخت امن</strong>
              <span>درخواست فقط بعد از پرداخت برای تجربه‌آفرین ارسال می‌شود.</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>درخواست ثبت شد</strong>
              <span>درخواست پرداخت‌شده در فهرست دریافتی تجربه‌آفرین قرار می‌گیرد.</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>پیشنهاد سه زمان</strong>
              <span>تجربه‌آفرین دقیقاً سه زمان پیشنهادی ارسال می‌کند.</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>انتخاب و قطعی‌شدن</strong>
              <span>بعد از انتخاب یکی از زمان‌ها، جلسه قطعی می‌شود.</span>
            </div>
            <div className={styles.timelineStep}>
              <strong>جلسه و بازخورد</strong>
              <span>بعد از جلسه مشاوره، بازخورد ثبت می‌شود.</span>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}
