import React from "react";
import {
  Award,
  ShieldCheck,
  Sparkles,
  Star,
  Crown,
  Leaf,
  Zap,
  Trophy,
  Medal,
  LucideProps,
} from "lucide-react";

export const AVAILABLE_BADGE_ICONS: Array<{
  name: string;
  label: string;
  icon: React.ComponentType<LucideProps>;
}> = [
  { name: "Award", label: "Award Ribbon", icon: Award },
  { name: "Leaf", label: "Green Leaf / Eco Sprout", icon: Leaf },
  { name: "ShieldCheck", label: "Shield of Protection", icon: ShieldCheck },
  { name: "Sparkles", label: "Sparkles / Champion", icon: Sparkles },
  { name: "Star", label: "Excellence Star", icon: Star },
  { name: "Crown", label: "Guardian Crown", icon: Crown },
  { name: "Trophy", label: "Recycling Trophy", icon: Trophy },
  { name: "Medal", label: "Honor Medal", icon: Medal },
  { name: "Zap", label: "Energy / Dynamic Action", icon: Zap },
];

interface BadgeIconHelperProps {
  iconName?: string;
  className?: string;
  size?: number;
}

export function BadgeIconHelper({
  iconName,
  className = "h-4 w-4",
  size,
}: BadgeIconHelperProps) {
  switch (iconName?.toLowerCase()) {
    case "leaf":
      return <Leaf className={className} size={size} />;
    case "shieldcheck":
    case "shield":
      return <ShieldCheck className={className} size={size} />;
    case "sparkles":
      return <Sparkles className={className} size={size} />;
    case "star":
      return <Star className={className} size={size} />;
    case "crown":
      return <Crown className={className} size={size} />;
    case "trophy":
      return <Trophy className={className} size={size} />;
    case "medal":
      return <Medal className={className} size={size} />;
    case "zap":
      return <Zap className={className} size={size} />;
    case "award":
    default:
      return <Award className={className} size={size} />;
  }
}

export default BadgeIconHelper;
