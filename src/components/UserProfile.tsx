import React from 'react';
import { User, Mail, Shield, Key } from 'lucide-react';

interface UserProfileProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    initials: string;
  };
}

export const UserProfile: React.FC<UserProfileProps> = ({ user }) => {
  const getMaskedEmail = (email: string) => {
    const [username, domain] = email.split('@');
    if (!username || !domain) return email;
    if (username.length <= 5) return email;
    const visiblePart = username.substring(0, 5);
    return `${visiblePart}${'•'.repeat(Math.min(10, username.length - 5))}@${domain}`;
  };

  return (
    <div className="max-w-2xl mx-auto w-full h-full animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="glass-card p-6 md:p-10 flex flex-col items-center relative overflow-hidden">
        {/* Background Accent */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-energy-cyan/20 to-energy-amber/20" />
        
        <div className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-tr from-energy-cyan to-energy-amber flex items-center justify-center shadow-xl border-4 border-panel-bg mb-6">
          <span className="font-display font-bold text-app-bg text-3xl">{user.initials}</span>
        </div>

        <h2 className="font-display font-bold text-2xl text-text-main mb-1">{user.firstName} {user.lastName}</h2>
        <span className="text-xs text-text-sub font-mono mb-8 px-3 py-1 bg-panel-hover rounded-full border border-border-custom">
          User Account
        </span>

        <div className="w-full space-y-4">
          <div className="flex items-center gap-4 p-4 bg-app-bg rounded-xl border border-border-custom/50">
            <div className="w-10 h-10 rounded-lg bg-panel-hover flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-energy-cyan" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-sub font-bold uppercase tracking-widest">Full Name</span>
              <span className="font-display font-medium text-text-main">{user.firstName} {user.lastName}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-app-bg rounded-xl border border-border-custom/50">
            <div className="w-10 h-10 rounded-lg bg-panel-hover flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5 text-energy-amber" />
            </div>
            <div className="flex flex-col overflow-hidden w-full">
              <span className="text-[10px] text-text-sub font-bold uppercase tracking-widest">Email Address</span>
              <span className="font-mono text-text-main truncate">{getMaskedEmail(user.email)}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 p-4 bg-app-bg rounded-xl border border-border-custom/50 opacity-70">
            <div className="w-10 h-10 rounded-lg bg-panel-hover flex items-center justify-center shrink-0">
              <Key className="w-5 h-5 text-text-dim" />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-text-sub font-bold uppercase tracking-widest">Password</span>
              <span className="font-mono text-text-main">••••••••••••</span>
            </div>
            <button className="ml-auto text-[10px] bg-panel-hover px-3 py-1.5 rounded font-bold uppercase hover:bg-border-custom text-text-sub hover:text-text-main transition-colors cursor-pointer">
              Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
