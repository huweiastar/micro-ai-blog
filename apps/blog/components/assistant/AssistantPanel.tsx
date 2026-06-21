"use client";

import { AssistantHeader } from "./AssistantHeader";
import { AssistantModeSwitch } from "./AssistantModeSwitch";
import { AssistantMessageList } from "./AssistantMessageList";
import { AssistantInput } from "./AssistantInput";

export function AssistantPanel() {
  return (
    <div className="surface-card flex h-full flex-col overflow-hidden rounded-2xl">
      <AssistantHeader />
      <AssistantModeSwitch />
      <AssistantMessageList />
      <AssistantInput />
    </div>
  );
}
