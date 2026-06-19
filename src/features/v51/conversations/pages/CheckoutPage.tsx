"use client";

import { useState, type ChangeEvent } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import {
  applyExpiration,
  calculateCheckout,
  cancellationPolicyCopy,
  expiredTimeSelectionMessage,
  getConversationRouteAccess,
  getConversationStatusLabel,
  getRepeatRequestHref,
  manualPaymentCardDetails,
  manualPaymentCopy,
  payConversation,
  repeatRequestCtaLabel,
  submitManualPaymentForReview,
  type ConversationFixture,
  type ManualPaymentReceiptInput
} from "@/features/v51/data/conversations";
import { SUPPORT_MAILTO } from "@/lib/support";
import { CheckoutSummary } from "../components/CheckoutSummary";
import styles from "../components/ConversationCluster.module.css";
import { RequestSentIllustration } from "../components/RequestSentIllustration";

type CheckoutPageProps = {
  initialConversation: ConversationFixture;
};

type RequestSentSuccessPanelProps = {
  conversation: ConversationFixture;
  isFreeHelp: boolean;
};

type ManualPaymentReviewPanelProps = {
  conversation: ConversationFixture;
  variant: "submitted" | "approved" | "rejected";
};

function buildReceiptInput(file: File | null): ManualPaymentReceiptInput | null {
  if (!file) {
    return null;
  }

  return {
    fileName: file.name,
    mimeType: file.type,
    size: file.size
  };
}

export function RequestSentSuccessPanel({ conversation, isFreeHelp }: RequestSentSuccessPanelProps) {
  const successDescription = isFreeHelp
    ? "درخواست جلسه رایگان شما همراه با موضوع گفت‌وگو برای تجربه‌آفرین ارسال شد. پس از اعلام سه زمان پیشنهادی، می‌توانید یکی را انتخاب کنید و جلسه را قطعی کنید."
    : "درخواست پرداخت‌شده شما همراه با موضوع گفت‌وگو برای تجربه‌آفرین ارسال شد. پس از اعلام سه زمان پیشنهادی، می‌توانید یکی را انتخاب کنید و جلسه را قطعی کنید.";

  return (
    <section className={styles.requestSentSuccessBlock} data-testid="request-sent-success-panel" aria-labelledby="request-sent-title">
      <RequestSentIllustration />
      <div className={styles.requestSentSuccessCopy}>
        <p className={styles.successEyebrow}>در انتظار پیشنهاد زمان</p>
        <h1 id="request-sent-title">درخواست شما ارسال شد</h1>
        <p>{successDescription}</p>
        <p className={styles.requestSentStatusRow}>
          <UseravaaIcon name="success" size={16} aria-hidden="true" />
          وضعیت درخواست: در انتظار پیشنهاد زمان
        </p>
        {!isFreeHelp ? (
          <p className={styles.infoBox}>
            <UseravaaIcon name="privacyLock" size={16} aria-hidden="true" />
            مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود.
          </p>
        ) : null}
        <div className={styles.requestSentActions}>
          <V51LinkButton href={`/conversations/${conversation.id}`} tone="primary">
            مشاهده درخواست
          </V51LinkButton>
          <V51LinkButton href="/discover">بازگشت به کشف تجربه‌ها</V51LinkButton>
        </div>
      </div>
    </section>
  );
}

function ManualPaymentReviewPanel({ conversation, variant }: ManualPaymentReviewPanelProps) {
  const isApproved = variant === "approved";
  const isRejected = variant === "rejected";
  const title = isApproved ? manualPaymentCopy.approvedTitle : isRejected ? manualPaymentCopy.rejectedTitle : manualPaymentCopy.submittedTitle;
  const text = isApproved ? manualPaymentCopy.approvedText : isRejected ? manualPaymentCopy.rejectedText : manualPaymentCopy.submittedText;
  const status = isApproved ? "در انتظار پیشنهاد زمان" : isRejected ? manualPaymentCopy.adminRejected : manualPaymentCopy.pendingStatus;

  return (
    <section className={styles.requestSentSuccessBlock} data-testid={`manual-payment-${variant}-panel`} aria-labelledby={`manual-payment-${variant}-title`}>
      <div className={styles.manualPaymentStateVisual} aria-hidden="true">
        <UseravaaIcon name={isRejected ? "warning" : isApproved ? "success" : "paymentCard"} size={34} />
      </div>
      <div className={styles.requestSentSuccessCopy}>
        <p className={styles.successEyebrow}>{status}</p>
        <h1 id={`manual-payment-${variant}-title`}>{title}</h1>
        <p>{text}</p>
        {isRejected && conversation.manualPaymentAdminNote ? (
          <p className={styles.errorBox}>
            <UseravaaIcon name="info" size={16} aria-hidden="true" />
            {manualPaymentCopy.rejectionReason}: {conversation.manualPaymentAdminNote}
          </p>
        ) : null}
        {!isRejected ? (
          <p className={isApproved ? styles.infoBox : styles.requestSentStatusRow}>
            <UseravaaIcon name={isApproved ? "privacyLock" : "info"} size={16} aria-hidden="true" />
            {isApproved ? "مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود." : manualPaymentCopy.pendingHelper}
          </p>
        ) : null}
        <div className={styles.requestSentActions}>
          {isRejected ? (
            <>
              <V51LinkButton href="#manual-payment-form" tone="primary">
                {manualPaymentCopy.resubmit}
              </V51LinkButton>
              <V51LinkButton href={SUPPORT_MAILTO}>{manualPaymentCopy.contactSupport}</V51LinkButton>
            </>
          ) : (
            <>
              <V51LinkButton href={`/conversations/${conversation.id}`} tone="primary">
                {isApproved ? "مشاهده درخواست" : manualPaymentCopy.viewStatus}
              </V51LinkButton>
              <V51LinkButton href="/discover">بازگشت به کشف تجربه‌ها</V51LinkButton>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export function CheckoutPage({ initialConversation }: CheckoutPageProps) {
  const [conversation, setConversation] = useState(() => applyExpiration(initialConversation));
  const [submitted, setSubmitted] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [manualReference, setManualReference] = useState(conversation.manualPaymentReferenceNumber ?? "");
  const [manualReceipt, setManualReceipt] = useState<File | null>(null);
  const [manualError, setManualError] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const checkout = calculateCheckout(conversation);
  const routeAccess = getConversationRouteAccess(conversation, "checkout");
  const isExpiredState = conversation.status === "expired" || routeAccess.disabledReason === "REQUEST_EXPIRED";
  const isManualSubmitted = conversation.paymentMethod === "CARD_TO_CARD" && conversation.manualPaymentStatus === "SUBMITTED";
  const isManualApproved = conversation.paymentMethod === "CARD_TO_CARD" && conversation.manualPaymentStatus === "APPROVED";
  const isManualRejected = conversation.paymentMethod === "CARD_TO_CARD" && conversation.manualPaymentStatus === "REJECTED";
  const pageTitle = checkout.isFreeHelp ? "ثبت نهایی درخواست جلسه رایگان" : "پرداخت امن درخواست جلسه";
  const pageDescription = checkout.isFreeHelp
    ? "این درخواست نیازی به پرداخت ندارد. با ثبت نهایی، درخواست جلسه برای تجربه‌آفرین ارسال می‌شود تا سه زمان پیشنهادی اعلام کند."
    : "با پرداخت، درخواست شما برای تجربه‌آفرین ارسال می‌شود. زمان جلسه بعداً از میان سه زمان پیشنهادی او انتخاب خواهد شد.";
  const heldFundsCopy = "مبلغ تا قطعی‌شدن جلسه نزد یوزراوا نگه داشته می‌شود.";
  const processingLabel = checkout.isFreeHelp ? "در حال ارسال درخواست..." : "در حال ثبت برای بررسی...";

  const submitFinalization = () => {
    if (processing) {
      return;
    }

    setProcessing(true);
    const nextConversation = payConversation(conversation);
    setConversation(nextConversation);
    setSubmitted(nextConversation.status === "pending_provider_response");
    if (nextConversation.status !== "pending_provider_response") {
      setProcessing(false);
    }
  };

  const submitManualPayment = () => {
    if (processing) {
      return;
    }

    setManualError("");
    setProcessing(true);
    const result = submitManualPaymentForReview(conversation, {
      referenceNumber: manualReference,
      receipt: buildReceiptInput(manualReceipt)
    });

    setConversation(result.conversation);
    setProcessing(false);

    if (result.success) {
      setSubmitted(true);
      return;
    }

    setManualError(result.message);
  };

  const copyCardNumber = async () => {
    try {
      await navigator.clipboard.writeText(manualPaymentCardDetails.cardNumber);
      setCopyMessage(manualPaymentCopy.copied);
    } catch {
      setCopyMessage("");
    }
  };

  const updateReceipt = (event: ChangeEvent<HTMLInputElement>) => {
    setManualReceipt(event.target.files?.[0] ?? null);
    setManualError("");
  };

  if (submitted && conversation.status === "pending_provider_response") {
    return (
      <div className={styles.shell}>
        <RequestSentSuccessPanel conversation={conversation} isFreeHelp={checkout.isFreeHelp} />
      </div>
    );
  }

  if (isManualApproved) {
    return (
      <div className={styles.shell}>
        <ManualPaymentReviewPanel conversation={conversation} variant="approved" />
      </div>
    );
  }

  if (isManualSubmitted) {
    return (
      <div className={styles.shell}>
        <ManualPaymentReviewPanel conversation={conversation} variant="submitted" />
      </div>
    );
  }

  if (!routeAccess.allowed && !isManualRejected) {
    return (
      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h1>{pageTitle}</h1>
            <p className={styles.lead}>{isExpiredState ? expiredTimeSelectionMessage : "این مسیر با وضعیت فعلی درخواست سازگار نیست."}</p>
          </div>
        </section>
        <section className={styles.panel}>
          <p className={styles.errorBox}>
            <UseravaaIcon name="warning" size={16} aria-hidden="true" />
            {isExpiredState ? expiredTimeSelectionMessage : routeAccess.message}
          </p>
          <div className={styles.actions}>
            {isExpiredState ? (
              <V51LinkButton href={getRepeatRequestHref(conversation)} tone="primary">
                {repeatRequestCtaLabel}
              </V51LinkButton>
            ) : (
              <V51LinkButton href={routeAccess.fallbackHref}>
                <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
                بازگشت
              </V51LinkButton>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>{pageTitle}</h1>
          <p className={styles.lead}>{pageDescription}</p>
        </div>
        <V51LinkButton href={`/conversations/${conversation.id}`}>
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت
        </V51LinkButton>
      </section>

      {isManualRejected ? <ManualPaymentReviewPanel conversation={conversation} variant="rejected" /> : null}

      <div className={styles.checkoutGrid}>
        <div className={styles.content}>
          <CheckoutSummary conversation={conversation} />
          {!checkout.isFreeHelp ? (
            <details className={styles.cancellationDisclosure}>
              <summary>{cancellationPolicyCopy.disclosureTitle}</summary>
              {cancellationPolicyCopy.disclosureBody.split("\n\n").map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </details>
          ) : null}
          {!checkout.isFreeHelp ? (
            <p className={styles.checkoutTrustRow}>
              <UseravaaIcon name="privacyLock" size={16} aria-hidden="true" />
              {heldFundsCopy}
            </p>
          ) : null}
        </div>

        {checkout.isFreeHelp ? (
          <aside className={styles.panel}>
            <h2 className={styles.panelTitleWithIcon}>ثبت نهایی درخواست جلسه رایگان</h2>
            <p className={styles.infoBox}>
              <UseravaaIcon name="info" size={16} aria-hidden="true" />
              {pageDescription}
            </p>
            <div className={styles.summaryRows}>
              <div className={styles.summaryRow}>
                <span>وضعیت درخواست</span>
                <strong>{getConversationStatusLabel(conversation)}</strong>
              </div>
            </div>
            <div className={styles.actions}>
              <V51Button type="button" tone="primary" disabled={!checkout.paymentEnabled || processing} className={!checkout.paymentEnabled || processing ? styles.submitDisabled : undefined} onClick={submitFinalization}>
                {processing ? processingLabel : "ارسال درخواست جلسه رایگان"}
              </V51Button>
            </div>
          </aside>
        ) : (
          <aside className={styles.panel} aria-labelledby="payment-method-title">
            <h2 id="payment-method-title" className={styles.panelTitleWithIcon}>
              <UseravaaIcon name="paymentCard" size={18} aria-hidden="true" />
              {manualPaymentCopy.methodsTitle}
            </h2>
            <div className={styles.paymentMethodList}>
              <article className={`${styles.paymentMethodCard} ${styles.paymentMethodDisabled}`} data-disabled="true">
                <div className={styles.paymentMethodHead}>
                  <h3>{manualPaymentCopy.onlineTitle}</h3>
                  <span className={`${styles.methodBadge} ${styles.methodBadgeMuted}`}>{manualPaymentCopy.onlineDisabledBadge}</span>
                </div>
                <p>{manualPaymentCopy.onlineDescription}</p>
              </article>

              <article className={`${styles.paymentMethodCard} ${styles.paymentMethodActive}`} aria-current="true">
                <div className={styles.paymentMethodHead}>
                  <h3>{manualPaymentCopy.cardToCardTitle}</h3>
                  <span className={`${styles.methodBadge} ${styles.methodBadgeActive}`}>{manualPaymentCopy.cardToCardActiveBadge}</span>
                </div>
                <p>{manualPaymentCopy.cardToCardDescription}</p>
                <div className={styles.manualCardDetails}>
                  <div className={styles.paymentCardRow}>
                    <span>{manualPaymentCopy.cardNumberLabel}</span>
                    <strong className={styles.cardNumber} dir="ltr">
                      {manualPaymentCardDetails.cardNumber}
                    </strong>
                    <V51Button type="button" onClick={copyCardNumber}>
                      {copyMessage || manualPaymentCopy.copy}
                    </V51Button>
                  </div>
                  <div className={styles.paymentCardRow}>
                    <span>{manualPaymentCopy.cardholderLabel}</span>
                    <strong>{manualPaymentCardDetails.cardholderName}</strong>
                  </div>
                </div>
              </article>
            </div>

            <p className={styles.manualPaymentNotice}>
              <UseravaaIcon name="info" size={16} aria-hidden="true" />
              {manualPaymentCopy.instructions}
            </p>
            <p className={styles.manualPaymentNotice}>
              <UseravaaIcon name="privacyLock" size={16} aria-hidden="true" />
              {manualPaymentCopy.adminReviewNote} {manualPaymentCopy.providerHiddenAssurance}
            </p>

            <form id="manual-payment-form" className={styles.manualPaymentForm} onSubmit={(event) => event.preventDefault()}>
              <h3>{manualPaymentCopy.formTitle}</h3>
              <label className={styles.formField}>
                <span>{manualPaymentCopy.referenceLabel}</span>
                <input
                  className={styles.formInput}
                  inputMode="numeric"
                  placeholder={manualPaymentCopy.referencePlaceholder}
                  value={manualReference}
                  onChange={(event) => {
                    setManualReference(event.target.value);
                    setManualError("");
                  }}
                />
                <small>{manualPaymentCopy.referenceHelper}</small>
              </label>
              <label className={styles.formField}>
                <span>{manualPaymentCopy.receiptLabel}</span>
                <input className={styles.fileInput} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={updateReceipt} />
                <small>{manualReceipt ? manualReceipt.name : manualPaymentCopy.receiptHelper}</small>
              </label>
              {manualError ? (
                <p className={styles.errorBox}>
                  <UseravaaIcon name="warning" size={16} aria-hidden="true" />
                  {manualError}
                </p>
              ) : null}
              <div className={styles.manualPaymentActions}>
                <V51Button type="button" tone="primary" disabled={processing} className={processing ? styles.submitDisabled : undefined} onClick={submitManualPayment}>
                  {processing ? processingLabel : manualPaymentCopy.submit}
                </V51Button>
                <V51LinkButton href="#checkout-summary">{manualPaymentCopy.backToSummary}</V51LinkButton>
              </div>
            </form>
          </aside>
        )}
      </div>
    </div>
  );
}
