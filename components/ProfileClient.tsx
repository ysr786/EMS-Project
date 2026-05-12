"use client";
import { useState } from "react";
import { useSession } from "next-auth/react";

type User = { id: string; name: string; email: string; role: string; createdAt: string };

const roleMeta: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  superadmin: { label: "Superadmin", color: "text-purple-700", bg: "bg-purple-100", dot: "bg-purple-500" },
  admin:      { label: "Admin",      color: "text-blue-700",   bg: "bg-blue-100",   dot: "bg-blue-500"   },
  hr_manager: { label: "HR Manager", color: "text-amber-700",  bg: "bg-amber-100",  dot: "bg-amber-500"  },
  employee:   { label: "Employee",   color: "text-green-700",  bg: "bg-green-100",  dot: "bg-green-500"  },
};

const avatarGradients: Record<string, string> = {
  superadmin: "from-purple-500 to-indigo-600",
  admin:      "from-blue-500 to-blue-700",
  hr_manager: "from-amber-400 to-orange-500",
  employee:   "from-green-400 to-teal-600",
};

const inputClass = "w-full border border-gray-200 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all";

function PasswordInput({ value, onChange, placeholder, show, onToggle }: {
  value: string; onChange: (v: string) => void; placeholder: string; show: boolean; onToggle: () => void;
}) {
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder} className={inputClass + " pr-10"} />
      <button type="button" onClick={onToggle}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
        {show
          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
      </button>
    </div>
  );
}

function Alert({ msg }: { msg: { type: "success" | "error"; text: string } }) {
  return (
    <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm ${
      msg.type === "success" ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-600"
    }`}>
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        {msg.type === "success"
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />}
      </svg>
      {msg.text}
    </div>
  );
}

export default function ProfileClient({ user }: { user: User }) {
  const { update } = useSession();
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [infoMsg, setInfoMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [pwdMsg, setPwdMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const meta = roleMeta[user.role] || roleMeta.employee;
  const gradient = avatarGradients[user.role] || avatarGradients.employee;
  const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" });

  async function handleInfoSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setInfoMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setInfoMsg({ type: "error", text: data.error });
    await update({ name: data.user.name, email: data.user.email });
    setInfoMsg({ type: "success", text: "Profile updated successfully." });
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword !== confirmPassword)
      return setPwdMsg({ type: "error", text: "New passwords do not match." });
    setSavingPwd(true);
    setPwdMsg(null);
    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, currentPassword, newPassword }),
    });
    const data = await res.json();
    setSavingPwd(false);
    if (!res.ok) return setPwdMsg({ type: "error", text: data.error });
    setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    setPwdMsg({ type: "success", text: "Password changed successfully." });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

      {/* Profile card */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`bg-gradient-to-br ${gradient} p-8 flex flex-col items-center text-white relative`}>
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -top-8 -right-8 w-32 h-32 bg-white rounded-full" />
              <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-white rounded-full" />
            </div>
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center text-3xl font-bold mb-3 border-2 border-white/30">
                {initials}
              </div>
              <p className="text-lg font-bold">{name}</p>
              <p className="text-white/70 text-sm mt-0.5">{email}</p>
            </div>
          </div>
          <div className="p-5 space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500 font-medium">Role</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${meta.bg} ${meta.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                {meta.label}
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-50">
              <span className="text-xs text-gray-500 font-medium">Member since</span>
              <span className="text-xs text-gray-700 font-medium">{memberSince}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-xs text-gray-500 font-medium">Account ID</span>
              <span className="text-xs text-gray-400 font-mono">{user.id.slice(-8)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forms */}
      <div className="lg:col-span-2 space-y-5">

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Personal Information</h3>
              <p className="text-xs text-gray-400">Update your name and email address</p>
            </div>
          </div>
          <form onSubmit={handleInfoSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Full Name</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </span>
                  <input value={name} onChange={(e) => setName(e.target.value)} required
                    className={inputClass + " pl-10"} placeholder="John Doe" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Email Address</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </span>
                  <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
                    className={inputClass + " pl-10"} placeholder="you@company.com" />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Role</label>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
                <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                <span className="text-sm text-gray-600">{meta.label}</span>
                <span className="text-xs text-gray-400 ml-auto">Managed by administrator</span>
              </div>
            </div>
            {infoMsg && <Alert msg={infoMsg} />}
            <div className="flex justify-end">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">
                {saving
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Saving...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg> Save Changes</>}
              </button>
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">Change Password</h3>
              <p className="text-xs text-gray-400">Use a strong password of at least 6 characters</p>
            </div>
          </div>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Current Password</label>
              <PasswordInput value={currentPassword} onChange={setCurrentPassword} placeholder="Enter current password" show={showCurrent} onToggle={() => setShowCurrent(!showCurrent)} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">New Password</label>
                <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Min. 6 characters" show={showNew} onToggle={() => setShowNew(!showNew)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5">Confirm New Password</label>
                <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" show={showConfirm} onToggle={() => setShowConfirm(!showConfirm)} />
              </div>
            </div>
            {newPassword && confirmPassword && newPassword !== confirmPassword && (
              <p className="text-xs text-red-500">Passwords do not match</p>
            )}
            {pwdMsg && <Alert msg={pwdMsg} />}
            <div className="flex justify-end">
              <button type="submit" disabled={savingPwd || !currentPassword || !newPassword || !confirmPassword}
                className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white rounded-xl text-sm font-semibold transition-all cursor-pointer">
                {savingPwd
                  ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" /></svg> Updating...</>
                  : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg> Update Password</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
