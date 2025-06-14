
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import * as nip19 from 'nostr-tools/nip19'
import type { NostrProfile } from "@/lib/nostr";

// TODO: Replace this with your actual Supabase project URL (found in your Supabase > Project Settings > API)
const supabaseUrl = "https://nqzkfiiyjtzsykdcaigv.supabase.co"; // e.g. https://xxxxx.supabase.co
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5xemtmaWl5anR6c3lrZGNhaWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5MjExODMsImV4cCI6MjA2NTQ5NzE4M30.a4zieWCgxE-_Yyy8J2d482EK-gD50SLzglrfH9_zRg0";
const supabase = createClient(supabaseUrl, supabaseKey);

export interface SupabaseUser {
  id: string;
  pubkey: string;
  npub?: string;
  name?: string;
  display_name?: string;
  about?: string;
  picture?: string;
  banner?: string;
  nip05?: string;
  lud16?: string;
  website?: string;
  created_at: string;
  updated_at: string;
}

export function useNostrSupabaseLogin() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Call this after getting pubkey + profile
  const loginOrSignup = async (pubkey: string, profile: NostrProfile) => {
    setIsProcessing(true);
    setError(null);

    // Encode pubkey to npub format
    const npub = nip19.npubEncode(pubkey);

    // 1. Try to fetch by pubkey
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("pubkey", pubkey)
      .limit(1);

    if (fetchError) {
      setError("Failed to read Supabase users table.");
      setIsProcessing(false);
      return null;
    }

    // 2. Found existing user? Use it.
    if (users && users.length > 0) {
      setUser(users[0]);
      setIsProcessing(false);
      return users[0];
    }

    // 3. Otherwise, insert new user data from Nostr
    const { data: newUser, error: createError } = await supabase
      .from("users")
      .insert([
        {
          pubkey,
          npub,
          name: profile.name,
          display_name: profile.display_name,
          about: profile.about,
          picture: profile.picture,
          banner: profile.banner,
          nip05: profile.nip05,
          lud16: profile.lud16,
          website: profile.website,
        },
      ])
      .select()
      .single();

    if (createError || !newUser) {
      setError("Failed to create user in Supabase.");
      setIsProcessing(false);
      return null;
    }

    setUser(newUser);
    setIsProcessing(false);
    return newUser;
  };

  return {
    loginOrSignup,
    user,
    isProcessing,
    error,
  };
}
