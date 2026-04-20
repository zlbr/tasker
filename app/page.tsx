"use client";
import Sidebar, { SidebarLink } from "@/components/Sidebar";
import { testData } from "../lib/test-data";
import { useSearchParams } from "next/navigation";
import ChatView from "@/components/ChatView/ChatView";
import { Suspense } from "react";

function HomeContent() {
  const search = useSearchParams();
  const currentId = search.get("id");

  return (
    <div className="grid grid-cols-6 w-screen h-screen">
      <Sidebar>
        {Object.keys(testData).map((testid) => (
          <SidebarLink
            to={`?id=${testid}`}
            key={testid}
            active={testid == currentId}
          >
            {testData[testid].title}
          </SidebarLink>
        ))}
      </Sidebar>
      <div className="col-span-5 w-full h-screen p-6 bg-zinc-900">
        <ChatView key={currentId || ""} />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
