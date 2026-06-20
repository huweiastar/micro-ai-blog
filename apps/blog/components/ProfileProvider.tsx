import { getAboutProfile } from "../lib/about";
import { ProfileProvider as ClientProfileProvider } from "./ProfileProvider.client";

interface ProfileProviderProps {
  children: React.ReactNode;
}

export function ProfileProvider({ children }: ProfileProviderProps) {
  const profile = getAboutProfile();
  return (
    <ClientProfileProvider profile={profile}>
      {children}
    </ClientProfileProvider>
  );
}
