"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, ScrollText, UserRoundPlus } from "lucide-react";

const items = [
  { href: "/community", label: "COMMUNITY", icon: Users },
  { href: "/constitution", label: "CONSTITUTION", icon: ScrollText },
  { href: "/join", label: "MEMBERSHIP", icon: UserRoundPlus },
];

export default function PhaseTwoDock() {
  const pathname = usePathname();
  return <nav className="phase-two-dock" aria-label="SectorX83 network">
    {items.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={pathname === href ? "active" : ""}>
      <Icon size={14} /><span>{label}</span>
    </Link>)}
  </nav>;
}
