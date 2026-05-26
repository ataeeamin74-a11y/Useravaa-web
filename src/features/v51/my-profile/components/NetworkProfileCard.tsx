import { V51Button, V51LinkButton } from "@/features/v51/components/V51Button";
import { type NetworkProfile, type NetworkTab } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type NetworkProfileCardProps = Readonly<{
  profile: NetworkProfile;
  activeTab: NetworkTab;
  onRemoveSaved: (profileId: string) => void;
}>;

export function NetworkProfileCard({ profile, activeTab, onRemoveSaved }: NetworkProfileCardProps) {
  const isSaved = activeTab === "saved";

  return (
    <article className={styles.networkCard}>
      <div className={styles.networkPerson}>
        <div className={styles.networkAvatar}>{profile.initials || "؟"}</div>
        <div>
          <b>{profile.name}</b>
          <span>
            {profile.roleFa}
            {profile.orgLevel ? ` · ${profile.orgLevel}` : ""}
          </span>
        </div>
      </div>
      <p>{profile.reason}</p>
      <div className={styles.networkActions}>
        <V51LinkButton href={`/profiles/${profile.id}`} tone="primary">
          مشاهده تجربه
        </V51LinkButton>
        {isSaved ? (
          <V51Button type="button" onClick={() => onRemoveSaved(profile.id)}>
            حذف از ذخیره‌شده‌ها
          </V51Button>
        ) : null}
      </div>
    </article>
  );
}
