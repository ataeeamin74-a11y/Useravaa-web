"use client";

import { useMemo, useState } from "react";
import { V51LinkButton } from "@/features/v51/components/V51Button";
import {
  filterNetworkItems,
  getNetworkItems,
  initialSavedProfileIds,
  networkTabs,
  type NetworkFilters,
  type NetworkTab
} from "@/features/v51/data/my-profile";
import { NetworkProfileCard } from "../components/NetworkProfileCard";
import { NetworkTabs } from "../components/NetworkTabs";
import { NetworkToolbar } from "../components/NetworkToolbar";
import styles from "../components/MyProfile.module.css";

type ProfileNetworkPageProps = Readonly<{
  initialTab?: NetworkTab;
}>;

const initialFilters: NetworkFilters = {
  query: "",
  category: "",
  sort: "recent"
};

export function ProfileNetworkPage({ initialTab = "saved" }: ProfileNetworkPageProps) {
  const [activeTab, setActiveTab] = useState<NetworkTab>(initialTab);
  const [filters, setFilters] = useState(initialFilters);
  const [savedIds, setSavedIds] = useState(initialSavedProfileIds);

  const counts = useMemo(
    () => ({
      saved: getNetworkItems("saved", [], savedIds).length
    }),
    [savedIds]
  );

  const visibleItems = useMemo(() => {
    return filterNetworkItems(getNetworkItems(activeTab, [], savedIds), filters);
  }, [activeTab, filters, savedIds]);

  const intro = networkTabs.find((tab) => tab.id === activeTab)?.intro ?? networkTabs[0].intro;

  return (
    <div className={styles.networkShell}>
      <div className={styles.networkHero}>
        <V51LinkButton href="/profile">بازگشت</V51LinkButton>
        <div>
          <h1>ذخیره‌شده‌ها</h1>
          <p className={styles.lead}>پروفایل‌هایی که برای مرور بعدی ذخیره کرده‌ای.</p>
        </div>
      </div>

      <NetworkTabs activeTab={activeTab} counts={counts} onChange={setActiveTab} />
      <NetworkToolbar filters={filters} onChange={setFilters} />

      <div className={styles.networkIntro}>{intro}</div>

      <div className={styles.networkList}>
        {visibleItems.length ? (
          visibleItems.map((profile) => (
            <NetworkProfileCard
              key={profile.id}
              profile={profile}
              activeTab={activeTab}
              onRemoveSaved={(profileId) => setSavedIds((current) => current.filter((id) => id !== profileId))}
            />
          ))
        ) : (
          <div className={styles.empty}>موردی پیدا نشد.</div>
        )}
      </div>
    </div>
  );
}
