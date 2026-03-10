"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { SettingsSection } from "@/components/app/settings/SettingsSection";
import { SettingsItem } from "@/components/app/settings/SettingsItem";
import { ToggleSetting } from "@/components/app/settings/ToggleSetting";
import { DropdownSetting } from "@/components/app/settings/DropdownSetting";
import { useSettings } from "@/components/app/settings/useSettings";
import type { ExportFormat, ThemePreference } from "@/lib/settings";

function getEmailInitial(email: string | undefined): string {
  if (!email) return "?";
  const first = email.trim().charAt(0);
  return first ? first.toUpperCase() : "?";
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteMessage, setDeleteMessage] = useState<string | null>(null);
  const { settings, update } = useSettings();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (u) {
        setUser(u);
        const name = u.user_metadata?.full_name ?? u.user_metadata?.name ?? "";
        setDisplayName(name);
      }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setDisplayName(u.user_metadata?.full_name ?? u.user_metadata?.name ?? "");
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingProfile(true);
    setProfileMessage(null);
    const { error } = await supabase.auth.updateUser({
      data: { full_name: displayName.trim() || undefined },
    });
    setSavingProfile(false);
    if (error) {
      setProfileMessage({ type: "error", text: error.message });
      return;
    }
    setProfileMessage({ type: "success", text: "Profile updated." });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);
    const p1 = newPassword.trim();
    const p2 = confirmPassword.trim();
    if (!p1 || p1.length < 8) {
      setPasswordMessage({ type: "error", text: "Password must be at least 8 characters." });
      return;
    }
    if (p1 !== p2) {
      setPasswordMessage({ type: "error", text: "Passwords do not match." });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: p1 });
    setChangingPassword(false);
    if (error) {
      setPasswordMessage({ type: "error", text: error.message });
      return;
    }
    setNewPassword("");
    setConfirmPassword("");
    setPasswordMessage({ type: "success", text: "Password updated." });
  };

  const handleDeleteAccount = async () => {
    setDeleteMessage(null);
    setDeleteBusy(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setDeleteMessage("You are not signed in.");
        setDeleteBusy(false);
        return;
      }
      const res = await fetch("/api/account/delete", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setDeleteMessage(data.error || "Delete failed.");
        setDeleteBusy(false);
        return;
      }
      await supabase.auth.signOut();
      window.location.href = "/";
    } catch {
      setDeleteMessage("Delete failed.");
    } finally {
      setDeleteBusy(false);
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <header className="flex-shrink-0 px-6 py-4 border-b border-border">
        <h1 className="text-lg font-semibold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted mt-0.5">
          Manage your account and preferences
        </p>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        <div className="max-w-2xl space-y-8">
          <SettingsSection title="Account" description="Your identity and security">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-primary/20 border border-green-primary/30 flex items-center justify-center flex-shrink-0">
                <span className="text-green-primary text-lg font-semibold">
                  {getEmailInitial(user?.email)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {displayName.trim() || user?.user_metadata?.full_name || user?.user_metadata?.name || "—"}
                </p>
                <p className="text-xs text-text-muted mt-0.5 truncate">{user?.email ?? "—"}</p>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
              <div>
                <label htmlFor="displayName" className="block text-xs font-medium text-text-muted mb-1.5">
                  Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/30 text-sm"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-xs font-medium text-text-muted mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={user?.email ?? ""}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary text-sm cursor-not-allowed"
                />
              </div>
              {profileMessage && (
                <p className={cn("text-sm", profileMessage.type === "success" ? "text-green-primary" : "text-red-400")}>
                  {profileMessage.text}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-4 py-2.5 rounded-xl bg-green-primary hover:bg-green-dark text-white text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {savingProfile ? "Saving…" : "Save"}
                </button>
              </div>
            </form>

            <div className="pt-2 border-t border-border/30">
              <form onSubmit={handleChangePassword} className="space-y-3">
                <SettingsItem
                  label="Change password"
                  description="Update the password for this account."
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/30 text-sm"
                  />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full px-4 py-2.5 rounded-xl bg-background-elevated/50 border border-border text-text-primary placeholder-text-dim focus:outline-none focus:ring-2 focus:ring-green-primary/50 focus:border-green-primary/30 text-sm"
                  />
                </div>
                {passwordMessage && (
                  <p className={cn("text-sm", passwordMessage.type === "success" ? "text-green-primary" : "text-red-400")}>
                    {passwordMessage.text}
                  </p>
                )}
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changingPassword}
                    className="px-4 py-2.5 rounded-xl bg-background-surface/60 border border-border/50 text-text-primary text-sm font-medium hover:bg-background-surface transition-colors disabled:opacity-50"
                  >
                    {changingPassword ? "Updating…" : "Update password"}
                  </button>
                </div>
              </form>
            </div>

          </SettingsSection>

          <SettingsSection title="Billing" description="Plan and subscription management">
            <SettingsItem
              label="Current plan"
              description="Your plan is managed through pricing."
              control={<span className="text-xs font-medium text-text-primary">Free</span>}
            />
            <SettingsItem
              label="Manage subscription"
              description="Upgrade, downgrade, or view plan details."
              control={
                <a
                  href="/pricing"
                  className="px-3 py-2 rounded-xl bg-background-surface/60 border border-border/50 text-text-primary text-xs font-semibold hover:bg-background-surface transition-colors"
                >
                  Manage
                </a>
              }
            />
          </SettingsSection>

          <SettingsSection title="Preferences" description="Personalize the app experience">
            <DropdownSetting<ThemePreference>
              label="Theme"
              description="Choose Light, Dark, or match your system setting."
              value={settings.theme}
              onChange={(v) => update("theme", v)}
              options={[
                { value: "system", label: "System" },
                { value: "dark", label: "Dark" },
                { value: "light", label: "Light" },
              ]}
            />
          </SettingsSection>

          <SettingsSection title="App settings" description="Defaults that affect the product">
            <ToggleSetting
              label="Auto-save notes draft"
              description="Save your current notes draft locally while you type."
              checked={settings.autoSaveEnabled}
              onChange={(v) => update("autoSaveEnabled", v)}
            />
            <DropdownSetting<ExportFormat>
              label="Default export format"
              description="Used when you save a transcript."
              value={settings.defaultExportFormat}
              onChange={(v) => update("defaultExportFormat", v)}
              options={[
                { value: "txt", label: "Text (.txt)" },
                { value: "md", label: "Markdown (.md)" },
              ]}
            />
          </SettingsSection>

          <SettingsSection title="Support" description="Get help or report issues">
            <SettingsItem
              label="Contact support"
              description="Email support."
              control={
                <a
                  href="mailto:support@persuaid.ai?subject=Persuaid%20Support"
                  className="text-xs font-semibold text-green-accent hover:underline"
                >
                  Email
                </a>
              }
            />
            <SettingsItem
              label="Report a bug"
              description="Send a bug report with details."
              control={
                <a
                  href="mailto:support@persuaid.ai?subject=Bug%20report&body=Steps%20to%20reproduce%3A%0A%0AExpected%3A%0A%0AActual%3A%0A%0AEnvironment%3A"
                  className="text-xs font-semibold text-green-accent hover:underline"
                >
                  Report
                </a>
              }
            />
          </SettingsSection>

          {/* Danger zone — last so it's at the very bottom */}
          <div className="rounded-2xl border border-red-500/40 bg-red-500/5 p-6">
            <h2 className="text-base font-semibold text-red-400">Danger zone</h2>
            <p className="text-sm text-text-muted mt-1">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => { setDeleteMessage(null); setDeleteOpen(true); }}
              className="mt-4 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-background-near-black"
            >
              Delete account
            </button>
          </div>
        </div>
      </div>

      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
          <div className="bg-background-elevated border border-red-500/30 rounded-2xl shadow-xl w-full max-w-sm p-6">
            <p className="text-lg font-semibold text-red-400">Delete account?</p>
            <p className="text-sm text-text-muted mt-2">
              This permanently deletes your account and all data. This cannot be undone.
            </p>
            {deleteMessage ? (
              <p className="text-sm text-red-400 mt-3">{deleteMessage}</p>
            ) : null}
            <div className="flex justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2.5 rounded-xl text-text-muted hover:bg-background-surface/50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteBusy}
                className="px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50 transition-colors"
              >
                {deleteBusy ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
