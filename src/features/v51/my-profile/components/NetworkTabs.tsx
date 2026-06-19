import { formatter } from "@/features/v51/data/profiles";
import { networkTabs, type NetworkTab } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type NetworkTabsProps = Readonly<{
  activeTab: NetworkTab;
  counts: Record<NetworkTab, number>;
  onChange: (tab: NetworkTab) => void;
}>;

export function NetworkTabs({ activeTab, counts, onChange }: NetworkTabsProps) {
  return (
    <div className={styles.networkTabs} role="tablist" aria-label="بخش‌های ذخیره‌شده‌ها">
      {networkTabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.networkTab} ${activeTab === tab.id ? styles.networkTabActive : ""}`}
          onClick={() => onChange(tab.id)}
        >
          <span className="button-label">{tab.label}</span>
          <b>{formatter.format(counts[tab.id])}</b>
        </button>
      ))}
    </div>
  );
}
