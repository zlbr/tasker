import Link from "next/link";
import { ReactNode } from "react";

export default function Sidebar({ children }: { children: ReactNode }) {
  return (
    <div className="col-span-1 w-full h-screen bg-zinc-950 flex flex-col gap-2 p-2">
      {children}
    </div>
  );
}

export function SidebarLink({
  children,
  to,
  active,
}: {
  children: ReactNode;
  to: string;
  active?: boolean;
}) {
  return (
    <Link
      className={[
        "rounded-sm w-full text-center p-2",
        "duration-100",
        active ? "bg-zinc-800" : "bg-zinc-900",
      ].join(" ")}
      href={to}
    >
      {children}
    </Link>
  );
}
