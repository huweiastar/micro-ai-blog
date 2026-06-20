"use client";

import { createContext, useContext } from "react";
import type { AboutProfile } from "../types/about";

const ProfileContext = createContext<AboutProfile | null>(null);

export function ProfileProvider({
  profile,
  children,
}: {
  profile: AboutProfile;
  children: React.ReactNode;
}) {
  return (
    <ProfileContext.Provider value={profile}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile(): AboutProfile | null {
  return useContext(ProfileContext);
}
