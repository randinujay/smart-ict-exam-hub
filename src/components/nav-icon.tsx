import {
  BadgeDollarSign,
  ChartNoAxesCombined,
  ClipboardCheck,
  Files,
  GraduationCap,
  Landmark,
  Layers3,
  LayoutDashboard,
  LifeBuoy,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
  UserRound,
  UserRoundCheck,
  UsersRound,
  Video,
} from "lucide-react";

const icons = {
  LayoutDashboard,
  Layers3,
  Files,
  ClipboardCheck,
  ChartNoAxesCombined,
  Landmark,
  UserRound,
  LifeBuoy,
  GraduationCap,
  UsersRound,
  Video,
  UserRoundCheck,
  BadgeDollarSign,
  MessageSquareQuote,
  PanelsTopLeft,
  Settings,
};

export function NavIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = icons[name as keyof typeof icons] ?? LayoutDashboard;
  return <Icon size={size} strokeWidth={1.9} />;
}
