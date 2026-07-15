import type { ComponentType } from "react";
import type { Icon, IconProps, IconWeight } from "@phosphor-icons/react";
import {
  ArrowCounterClockwise,
  ArrowRight as PhosphorArrowRight,
  ArrowSquareOut,
  ArrowUpLeft as PhosphorArrowUpLeft,
  ArrowsClockwise,
  ArrowsLeftRight,
  BookOpenText,
  BookmarkSimple,
  BriefcaseMetal,
  Buildings,
  CalendarDots,
  CaretDown,
  CaretLeft,
  ChartBar,
  ChartLineUp,
  CheckCircle,
  ChatCircleDots,
  ClockCounterClockwise,
  Code,
  Compass as PhosphorCompass,
  CurrencyCircleDollar,
  FileText as PhosphorFileText,
  FunnelSimple,
  GraduationCap as PhosphorGraduationCap,
  HandHeart,
  ListChecks as PhosphorListChecks,
  MagnifyingGlass,
  MapPin as PhosphorMapPin,
  Megaphone as PhosphorMegaphone,
  Palette as PhosphorPalette,
  Path,
  PenNib,
  PencilSimple,
  Robot,
  ShareNetwork,
  Sparkle,
  Stack,
  Target,
  Toolbox,
  UserCircleCheck,
  UsersThree,
  Warning,
  WarningCircle,
  ShieldWarning,
  X as PhosphorX
} from "@phosphor-icons/react/ssr";

export type CareerIcon = ComponentType<IconProps>;

function playfulIcon(Source: Icon, defaultWeight: IconWeight = "duotone"): CareerIcon {
  return function CareerPhosphorIcon({ weight = defaultWeight, ...props }: IconProps) {
    return <Source {...props} weight={weight} />;
  };
}

export const ArrowRight = playfulIcon(PhosphorArrowRight, "bold");
export const ArrowUpLeft = playfulIcon(PhosphorArrowUpLeft, "bold");
export const BarChart3 = playfulIcon(ChartBar);
export const Bookmark = playfulIcon(BookmarkSimple);
export const BookmarkPlus = playfulIcon(BookmarkSimple);
export const BookOpen = playfulIcon(BookOpenText);
export const Bot = playfulIcon(Robot);
export const BriefcaseBusiness = playfulIcon(BriefcaseMetal);
export const Building2 = playfulIcon(Buildings);
export const CalendarClock = playfulIcon(CalendarDots);
export const ChartNoAxesCombined = playfulIcon(ChartLineUp);
export const Check = playfulIcon(CheckCircle, "fill");
export const ChevronDown = playfulIcon(CaretDown, "bold");
export const ChevronLeft = playfulIcon(CaretLeft, "bold");
export const CircleAlert = playfulIcon(WarningCircle);
export const CircleDollarSign = playfulIcon(CurrencyCircleDollar);
export const CircleDot = playfulIcon(Target);
export const Code2 = playfulIcon(Code);
export const Compass = playfulIcon(PhosphorCompass);
export const ExternalLink = playfulIcon(ArrowSquareOut, "bold");
export const FileText = playfulIcon(PhosphorFileText);
export const Filter = playfulIcon(FunnelSimple);
export const GitCompareArrows = playfulIcon(ArrowsLeftRight);
export const GraduationCap = playfulIcon(PhosphorGraduationCap);
export const HeartHandshake = playfulIcon(HandHeart);
export const Layers3 = playfulIcon(Stack);
export const ListChecks = playfulIcon(PhosphorListChecks);
export const MapPin = playfulIcon(PhosphorMapPin);
export const Megaphone = playfulIcon(PhosphorMegaphone);
export const MessageCircleQuestion = playfulIcon(ChatCircleDots);
export const Palette = playfulIcon(PhosphorPalette);
export const PenTool = playfulIcon(PenNib);
export const Pencil = playfulIcon(PencilSimple);
export const RefreshCw = playfulIcon(ArrowsClockwise);
export const RotateCcw = playfulIcon(ArrowCounterClockwise);
export const Route = playfulIcon(Path);
export const Search = playfulIcon(MagnifyingGlass);
export const ShieldAlert = playfulIcon(ShieldWarning);
export const Sparkles = playfulIcon(Sparkle, "fill");
export const TimerReset = playfulIcon(ClockCounterClockwise);
export const TriangleAlert = playfulIcon(Warning, "fill");
export const UserRoundCheck = playfulIcon(UserCircleCheck);
export const Users = playfulIcon(UsersThree);
export const Waypoints = playfulIcon(ShareNetwork);
export const Wrench = playfulIcon(Toolbox);
export const X = playfulIcon(PhosphorX, "bold");
