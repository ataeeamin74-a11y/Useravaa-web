import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  Archive,
  ArrowBendUpRight,
  ArrowCounterClockwise,
  ArrowRight,
  ArrowsLeftRight,
  Bell,
  BookmarkSimple,
  BriefcaseMetal,
  Buildings,
  CalendarBlank,
  CalendarCheck,
  CalendarPlus,
  CaretDown,
  CaretLeft,
  ChatCircle,
  Check,
  CheckCircle,
  Clock,
  CreditCard,
  CurrencyDollar,
  DownloadSimple,
  Eye,
  EyeSlash,
  FileText,
  Funnel,
  IdentificationBadge,
  ImageSquare,
  Info,
  LinkSimple,
  ListBullets,
  LockKey,
  MagnifyingGlass,
  PaperPlaneTilt,
  PencilSimple,
  PlusCircle,
  Question,
  Receipt,
  ShareNetwork,
  SignOut,
  SlidersHorizontal,
  Sparkle,
  Stack,
  Star,
  Trash,
  Tray,
  User,
  UserCheck,
  UserFocus,
  Wallet,
  Warning,
  X
} from "@phosphor-icons/react/ssr";

export const USERAVAA_ICON_DEFAULT_SIZE = 20;

export const useravaaPhosphorIcons = {
  insight: Sparkle,
  discoverExperiences: MagnifyingGlass,
  profile: User,
  notification: Bell,
  settings: SlidersHorizontal,
  logout: SignOut,
  save: BookmarkSimple,
  unsave: BookmarkSimple,
  share: ShareNetwork,
  view: Eye,
  hidden: EyeSlash,
  download: DownloadSimple,
  link: LinkSimple,
  edit: PencilSimple,
  delete: Trash,
  archive: Archive,
  send: PaperPlaneTilt,
  inbox: Tray,
  search: MagnifyingGlass,
  filter: Funnel,
  dropdown: CaretDown,
  close: X,
  arrowBackRtl: ArrowRight,
  openDetailsRtl: CaretLeft,
  check: Check,
  add: PlusCircle,
  reset: ArrowCounterClockwise,
  sessionRequest: CalendarPlus,
  sessionBooking: CalendarCheck,
  sessionTime: Clock,
  calendar: CalendarBlank,
  provider: UserCheck,
  seeker: UserFocus,
  message: ChatCircle,
  reply: ArrowBendUpRight,
  wallet: Wallet,
  cost: CurrencyDollar,
  payoutRequest: Receipt,
  transaction: ArrowsLeftRight,
  paymentCard: CreditCard,
  privacyLock: LockKey,
  success: CheckCircle,
  info: Info,
  warning: Warning,
  star: Star,
  user: User,
  briefcase: BriefcaseMetal,
  company: Buildings,
  jobTitle: BriefcaseMetal,
  orgLevel: Stack,
  description: FileText,
  selfIntro: IdentificationBadge,
  imageUpload: ImageSquare,
  help: Question,
  details: ListBullets
} satisfies Record<string, Icon>;

export type UseravaaIconName = keyof typeof useravaaPhosphorIcons;

export type UseravaaIconProps = Omit<IconProps, "name"> & {
  name: UseravaaIconName;
};

const FILLED_ICON_NAMES = new Set<UseravaaIconName>([
  "check",
  "insight",
  "success",
  "unsave",
  "warning"
]);

function classNames(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export function UseravaaIcon({
  name,
  className,
  size = USERAVAA_ICON_DEFAULT_SIZE,
  color = "currentColor",
  weight,
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  ...props
}: UseravaaIconProps) {
  const IconComponent = useravaaPhosphorIcons[name];
  const resolvedWeight: IconWeight = weight ?? (FILLED_ICON_NAMES.has(name) ? "fill" : "duotone");

  return (
    <IconComponent
      aria-hidden={ariaLabel ? ariaHidden : true}
      aria-label={ariaLabel}
      className={classNames("ua-inline-control-icon", className)}
      color={color}
      focusable="false"
      size={size}
      weight={resolvedWeight}
      {...props}
    />
  );
}
