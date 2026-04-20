import { ReactNode } from "react";
import { Trash } from "../icons/Trash";

export function MessageTable({ children }: { children: ReactNode }) {
  return (
    <table className="w-full border-collapse border border-zinc-50/5">
      <thead>
        <tr className="bg-zinc-50/5">
          <th className="border border-zinc-50/5 p-2 text-left w-16"></th>
          <th className="border border-zinc-50/5 p-2 text-left">Role</th>
          <th className="border border-zinc-50/5 p-2 text-left">Message</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td className="border border-zinc-50/5 p-2">no</td>
          <td className="border border-zinc-50/5 p-2">no</td>
        </tr>
      </tbody>
    </table>
  );
}

export function DeleteButton() {
  return (
    <button className="bg-zinc-50/10">
      <Trash className="w-8 h-8" />
    </button>
  );
}
