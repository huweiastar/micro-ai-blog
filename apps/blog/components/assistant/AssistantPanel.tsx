"use client";

import { AssistantHeader } from "./AssistantHeader";
import { AssistantModeSwitch } from "./AssistantModeSwitch";
import { AssistantMessageList } from "./AssistantMessageList";
import { AssistantInput } from "./AssistantInput";

export function AssistantPanel() {
  return (
    <div className="flex flex-col h-full bg-[var(--background)] rounded-xl overflow-hidden border border-[var(--card-border)] shadow-2xl shadow-black/20">
      <AssistantHeader />
      <AssistantModeSwitch />
      <AssistantMessageList />
      <AssistantInput />
    </div>
  );
}
