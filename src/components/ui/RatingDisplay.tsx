import { UseravaaIcon } from "@/components/ui/UseravaaIcon";
import { formatFaNumber, formatFaRating } from "@/lib/fa-format";

type RatingDisplayProps = Readonly<{
  value: number;
  count?: number;
  max?: number;
  size?: "sm" | "md";
  showStars?: boolean;
  showNumeric?: boolean;
  label?: string;
  className?: string;
}>;

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function RatingDisplay({
  value,
  count,
  max = 5,
  size = "sm",
  showStars = false,
  showNumeric = true,
  label,
  className
}: RatingDisplayProps) {
  const ratingText = formatFaRating(value, max);
  const accessibleLabel =
    label ??
    (typeof count === "number"
      ? `${ratingText}، بر اساس ${formatFaNumber(count)} بازخورد`
      : ratingText);
  const iconSize = size === "md" ? 16 : 14;

  return (
    <span
      className={classNames("ua-rating-display", `ua-rating-display-${size}`, className)}
      dir="rtl"
      aria-label={accessibleLabel}
    >
      {showStars ? (
        <UseravaaIcon className="ua-rating-star-filled" name="star" size={iconSize} aria-hidden="true" />
      ) : null}
      {showNumeric ? <span className="ua-rating-text">{ratingText}</span> : null}
      {typeof count === "number" ? <span className="ua-rating-count">{formatFaNumber(count)} بازخورد</span> : null}
    </span>
  );
}
