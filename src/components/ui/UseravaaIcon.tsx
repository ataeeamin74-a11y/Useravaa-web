import {
  Archive,
  ArrowLeftRight,
  ArrowRight,
  BadgeDollarSign,
  BadgeInfo,
  Bell,
  Bookmark,
  BookmarkX,
  BriefcaseBusiness,
  Building2,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  ChevronDown,
  ChevronLeft,
  CircleCheck,
  CircleHelp,
  CirclePlus,
  Clock3,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  ImagePlus,
  Info,
  Layers3,
  Link2,
  List,
  ListFilter,
  LockKeyhole,
  LogOut,
  MessageCircle,
  Pencil,
  ReceiptText,
  Reply,
  RotateCcw,
  Search,
  Send,
  Settings2,
  Share2,
  Sparkles,
  Star,
  Trash2,
  TriangleAlert,
  User,
  UserCheck,
  UserSearch,
  Wallet,
  X,
  type LucideProps
} from "lucide-react";

export const USERAVAA_ICON_DEFAULT_SIZE = 20;
export const USERAVAA_ICON_DEFAULT_STROKE = 1.75;

export const useravaaLucideIcons = {
  insight: Sparkles,
  discoverExperiences: Search,
  profile: User,
  notification: Bell,
  settings: Settings2,
  logout: LogOut,
  save: Bookmark,
  unsave: BookmarkX,
  share: Share2,
  view: Eye,
  hidden: EyeOff,
  download: Download,
  link: Link2,
  edit: Pencil,
  delete: Trash2,
  archive: Archive,
  send: Send,
  search: Search,
  filter: ListFilter,
  dropdown: ChevronDown,
  close: X,
  arrowBackRtl: ArrowRight,
  openDetailsRtl: ChevronLeft,
  check: Check,
  add: CirclePlus,
  reset: RotateCcw,
  sessionRequest: CalendarPlus,
  sessionBooking: CalendarCheck,
  sessionTime: Clock3,
  calendar: CalendarDays,
  provider: UserCheck,
  seeker: UserSearch,
  message: MessageCircle,
  reply: Reply,
  wallet: Wallet,
  cost: BadgeDollarSign,
  payoutRequest: ReceiptText,
  transaction: ArrowLeftRight,
  paymentCard: CreditCard,
  privacyLock: LockKeyhole,
  success: CircleCheck,
  info: Info,
  warning: TriangleAlert,
  star: Star,
  user: User,
  briefcase: BriefcaseBusiness,
  company: Building2,
  jobTitle: BriefcaseBusiness,
  orgLevel: Layers3,
  description: FileText,
  selfIntro: BadgeInfo,
  imageUpload: ImagePlus,
  help: CircleHelp,
  details: List
} as const;

export type UseravaaIconName = keyof typeof useravaaLucideIcons;

export type UseravaaIconProps = Omit<LucideProps, "name"> & {
  name: UseravaaIconName;
};

export function UseravaaIcon({
  name,
  size = USERAVAA_ICON_DEFAULT_SIZE,
  strokeWidth = USERAVAA_ICON_DEFAULT_STROKE,
  color = "currentColor",
  "aria-hidden": ariaHidden,
  "aria-label": ariaLabel,
  ...props
}: UseravaaIconProps) {
  const Icon = useravaaLucideIcons[name];

  return (
    <Icon
      aria-hidden={ariaLabel ? ariaHidden : true}
      aria-label={ariaLabel}
      color={color}
      focusable="false"
      size={size}
      strokeWidth={strokeWidth}
      {...props}
    />
  );
}
