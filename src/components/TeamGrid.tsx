"use client";

import { useState } from "react";
import Image from "next/image";
import { type PortableTextBlock } from "next-sanity";

import Panel from "./Panel";

export type TeamMember = {
  id: string;
  name: string;
  jobTitle?: string;
  bio?: PortableTextBlock[];
  imageUrl: string | null;
  lqip: string | null;
};

export default function TeamGrid({ members }: { members: TeamMember[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = members.find((member) => member.id === activeId) ?? null;

  return (
    <>
      <ul>
        {members.map((member) => (
          <li
            key={member.id}
            role="button"
            tabIndex={0}
            aria-haspopup="dialog"
            onClick={() => setActiveId(member.id)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setActiveId(member.id);
              }
            }}
          >
            {member.imageUrl && (
              <Image
                src={member.imageUrl}
                alt={`${member.name} headshot`}
                width={323}
                height={405}
                placeholder={member.lqip ? "blur" : "empty"}
                blurDataURL={member.lqip ?? undefined}
              />
            )}
            <h3>{member.name}</h3>
            <p>{member.jobTitle}</p>
            <p className="link-text">Read Bio</p>
          </li>
        ))}
      </ul>
      {active && (
        // key: selecting a different member must remount the Panel, otherwise
        // a close already in flight would unmount the freshly-picked one.
        <Panel key={active.id} member={active} onClose={() => setActiveId(null)} />
      )}
    </>
  );
}
