"use client";

import { useState } from "react";
import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import type { ConversationFixture } from "@/features/v51/data/conversations";
import { ConversationDetailPanel } from "../components/ConversationDetailPanel";
import styles from "../components/ConversationCluster.module.css";

type ConversationDetailPageProps = {
  initialConversation: ConversationFixture;
};

export function ConversationDetailPage({ initialConversation }: ConversationDetailPageProps) {
  const [conversation, setConversation] = useState(initialConversation);

  return (
    <div className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroText}>
          <h1>جزئیات جلسه</h1>
          <p className={styles.lead}>وضعیت درخواست، زمان‌های پیشنهادی و اقدام بعدی را همین‌جا ببین.</p>
        </div>
        <V51LinkButton href="/conversations">
          <UseravaaIcon name="arrowBackRtl" size={16} aria-hidden="true" />
          بازگشت به جلسه‌ها
        </V51LinkButton>
      </section>

      <ConversationDetailPanel conversation={conversation} onConversationChange={setConversation} />
    </div>
  );
}
