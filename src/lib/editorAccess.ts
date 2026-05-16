import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const allowedEmails = (import.meta.env.VITE_EDITOR_ALLOWED_EMAILS as string | undefined)
  ?.split(",")
  .map((item) => item.trim().toLowerCase())
  .filter(Boolean) ?? [];

export const supabaseClient: SupabaseClient | null =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const isSupabaseEditorAuthEnabled = Boolean(supabaseClient);

function hasRole(user: User, role: string): boolean {
  const lowerRole = role.toLowerCase();
  const appRole = typeof user.app_metadata?.role === "string" ? user.app_metadata.role.toLowerCase() : "";
  if (appRole === lowerRole) return true;

  const appRoles = Array.isArray(user.app_metadata?.roles)
    ? user.app_metadata.roles.map((item: unknown) => String(item).toLowerCase())
    : [];
  return appRoles.includes(lowerRole);
}

export function canUserEdit(user: User | null): boolean {
  if (!user) return false;
  if (hasRole(user, "admin") || hasRole(user, "editor")) return true;
  if (!user.email) return false;
  return allowedEmails.includes(user.email.toLowerCase());
}

export function getEditorAllowedEmails(): string[] {
  return [...allowedEmails];
}
