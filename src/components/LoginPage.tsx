import React, { useState } from 'react';
import { Lock, CheckCircle2, ArrowRight, Eye, ShieldCheck, ShoppingBag, Filter, FileText } from 'lucide-react';

interface LoginPageProps {
  onLogin: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('admin@restaurant.com');
  const [password, setPassword] = useState('password123');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      onLogin();
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-white">
      {/* Left Column - Branding */}
      <div className="w-full md:w-1/2 bg-[#024628] flex flex-col justify-between relative overflow-hidden text-white p-8 md:p-16">
        
        {/* Background decorative circles */}
        <div className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-black opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-black opacity-10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] bg-[#03331d] bg-opacity-40 rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col h-full items-center justify-center text-center">
          
          <div className="w-20 h-20 bg-[#0a5a35] rounded-2xl flex items-center justify-center mb-8 shadow-lg border border-[#166c43]">
            <Lock className="w-8 h-8 text-white" strokeWidth={2} />
          </div>

          <h1 className="text-4xl font-bold mb-4 tracking-tight leading-tight max-w-md">
            Restaurant Management System
          </h1>
          
          <p className="text-[#a5ccb8] mb-10 max-w-sm text-sm font-medium leading-relaxed">
            Secure, role-based point-of-sale and menu catalog management for premium restaurants.
          </p>

          <div className="flex flex-wrap justify-center gap-3 max-w-md">
            <Badge text="POS Billing" />
            <Badge text="Menu Catalog" />
            <Badge text="Order Tracking" />
            <Badge text="Receipt Generation" />
          </div>
        </div>

        <div className="relative z-10 text-center md:text-left mt-8">
          <p className="text-xs text-[#a5ccb8]">© 2026 Restaurant Management System</p>
          <p className="text-[10px] text-[#6d9e83] mt-1">All rights reserved · Official Portal</p>
        </div>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16 relative">
        <div className="w-full max-w-md">
          
          <h2 className="text-3xl font-bold text-[#1a1a1a] mb-2 tracking-tight">Welcome back</h2>
          <p className="text-sm text-[#73706B] mb-8 font-medium">Sign in to access the Restaurant portal</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#f0f4f8] border border-[#d1d5db] rounded outline-none focus:border-[#024628] focus:ring-1 focus:ring-[#024628] transition-colors text-sm"
                placeholder="Enter your email"
              />
            </div>

            <div className="relative">
              <label className="block text-xs font-bold text-[#1a1a1a] uppercase tracking-wider mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 bg-[#f0f4f8] border border-[#d1d5db] rounded outline-none focus:border-[#024628] focus:ring-1 focus:ring-[#024628] transition-colors text-sm pr-10"
                placeholder="••••••••"
              />
              <button type="button" className="absolute right-3 top-[34px] text-gray-500 hover:text-gray-700">
                <Eye className="w-5 h-5" />
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-[#024628] hover:bg-[#03331d] text-white font-semibold py-3 px-4 rounded transition-colors flex items-center justify-center gap-2"
            >
              <ArrowRight className="w-4 h-4" /> Sign In
            </button>
          </form>

          <div className="mt-6 bg-[#eef8f2] border border-[#c4e6d3] rounded-lg p-4 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-[#0a5a35] shrink-0 mt-0.5" />
            <p className="text-xs text-[#0a5a35] font-medium leading-relaxed">
              This system is for authorized restaurant personnel only. Unauthorized access attempts are logged and may be prosecuted.
            </p>
          </div>

          <div className="mt-8 flex items-center justify-between text-xs font-medium">
            <p className="text-[#73706B]">For access issues, contact your System Administrator.</p>
            <a href="#" className="text-[#024628] hover:underline font-bold">Forgot password?</a>
          </div>

        </div>
      </div>
    </div>
  );
};

const Badge = ({ text }: { text: string }) => (
  <span className="px-4 py-1.5 bg-[#0a5a35] text-white text-xs font-bold rounded-full shadow-sm">
    {text}
  </span>
);
