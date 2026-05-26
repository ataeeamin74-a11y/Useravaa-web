import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { networkCategoryFilters, type NetworkFilters, type NetworkSort } from "@/features/v51/data/my-profile";
import styles from "./MyProfile.module.css";

type NetworkToolbarProps = Readonly<{
  filters: NetworkFilters;
  onChange: (filters: NetworkFilters) => void;
}>;

export function NetworkToolbar({ filters, onChange }: NetworkToolbarProps) {
  return (
    <div className={styles.networkToolbar}>
      <span className={styles.networkSearchWrap}>
        <UseravaaIcon name="search" size={18} aria-hidden="true" />
        <input
          aria-label="جستجو در ذخیره‌شده‌ها"
          placeholder="جستجو در ذخیره‌شده‌ها"
          value={filters.query}
          onChange={(event) => onChange({ ...filters, query: event.target.value })}
        />
      </span>
      <span className={styles.networkSelectWrap}>
        <select
          aria-label="فیلتر حوزه شغلی شبکه"
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
        >
          <option value="">همه حوزه‌های شغلی</option>
          {networkCategoryFilters.map((category) => (
            <option key={category}>{category}</option>
          ))}
        </select>
        <span className={styles.networkCaret} aria-hidden="true">
          <UseravaaIcon name="dropdown" size={16} />
        </span>
      </span>
      <span className={styles.networkSelectWrap}>
        <select aria-label="مرتب‌سازی شبکه" value={filters.sort} onChange={(event) => onChange({ ...filters, sort: event.target.value as NetworkSort })}>
          <option value="recent">جدیدترین</option>
          <option value="level">رده سازمانی</option>
          <option value="name">نام</option>
        </select>
        <span className={styles.networkCaret} aria-hidden="true">
          <UseravaaIcon name="dropdown" size={16} />
        </span>
      </span>
    </div>
  );
}
