"use client";

import { createContext, useContext, useRef, type ReactNode } from "react";
import { useAssistant, type UseAssistantReturn } from "../../hooks/useAssistant";

const AssistantContext = createContext<UseAssistantReturn | null>(null);

export function useAssistantContext(): UseAssistantReturn {
  const ctx = useContext(AssistantContext);
  if (!ctx) {
    throw new Error("useAssistantContext must be used within AssistantProvider");
  }
  return ctx;
}

export function AssistantProvider({ children }: { children: ReactNode }) {
  const assistant = useAssistant();
  const assistantRef = useRef(assistant);
  assistantRef.current = assistant;

  return (
    <AssistantContext.Provider value={assistantRef.current}>
      {children}
    </AssistantContext.Provider>
  );
}
