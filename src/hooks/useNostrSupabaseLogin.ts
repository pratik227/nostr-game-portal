
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import type { NostrProfile } from "@/lib/nostr";

// Assumes Supabase project URL/anon key are available as env variables or globally
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const supabase = createClient(supabaseUrl, supabaseKey);

interface SupabaseUser {
  id: string;
  pubkey: string;
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
