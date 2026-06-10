import React, { useState, useEffect } from 'react';
import { useLanguage } from '../LanguageContext';
import axios from 'axios';
import { 
  Building, 
  ShieldAlert, 
  Lock, 
  User as UserIcon, 
  Mail, 
  Phone, 
  MapPin, 
  ArrowLeft,
  KeyRound,
  Eye,
  EyeOff,
  UserPlus
} from 'lucide-react';
import { User } from '../types';

// Dynamic Firebase Auth Imports
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

interface AuthViewProps {
  onLoginSuccess: (token: string, user: User) => void;
  triggerToast: (message: string, type: 'success' | 'error') => void;
}

export default function AuthView({ onLoginSuccess, triggerToast }: AuthViewProps) {
  const { t, language, setLanguage } = useLanguage();
  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login');
  
  // Loading & Error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Password visibility triggers
  const [showPassword, setShowPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // LOGIN STATE
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // REGISTER STATE
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // FORGOT STATE
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');

  // FIREBASE CONFIG STATE
  const [firebaseConfig, setFirebaseConfig] = useState<any>(null);
  const [firebaseEnabled, setFirebaseEnabled] = useState(false);

  // Fetch Firebase config on load
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await axios.get('/api/auth/firebase-config');
        if (res.data && res.data.isEnabled && res.data.config) {
          setFirebaseConfig(res.data.config);
          setFirebaseEnabled(true);
        }
      } catch (err) {
        console.warn('Firebase config endpoint could not be fetched, falling back:', err);
      }
    };
    fetchConfig();
  }, []);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please provide both username and password.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/auth/login', { username, password });
      const { token, user } = response.data;
      onLoginSuccess(token, user);
      triggerToast(`Welcome back, ${user.username}!`, 'success');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Invalid username or credentials.');
      triggerToast(err?.response?.data?.error || 'Failed to authenticate.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regName || !regPhone || !regEmail || !regUsername || !regPassword) {
      setError('All asterisk (*) fields are strictly required.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (regPassword.length < 5) {
      setError('Password must be at least 5 characters long.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/register', {
        name: regName,
        phone: regPhone,
        email: regEmail,
        address: regAddress,
        username: regUsername,
        password: regPassword
      });
      const { token, user } = response.data;
      onLoginSuccess(token, user);
      triggerToast(`Registration successful! Welcome to the Royal Portal, ${user.username}!`, 'success');
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Could not verify guest profile registration.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!forgotUsername || !forgotEmail || !forgotNewPassword) {
      setError('All security criteria fields are required.');
      return;
    }

    if (forgotNewPassword.length < 5) {
      setError('New password must be at least 5 characters.');
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post('/api/auth/forgot-password', {
        username: forgotUsername,
        email: forgotEmail,
        newPassword: forgotNewPassword
      });
      setSuccessMsg(response.data.message || 'Password reset accomplished!');
      triggerToast('Password reset successfully adjusted.', 'success');
      // Auto switch back to login mode after delay
      setTimeout(() => {
        setMode('login');
        setError('');
        setSuccessMsg('');
      }, 3000);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Security credentials verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE AUTH INTEGRATION
  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);

    if (firebaseEnabled && firebaseConfig) {
      try {
        // Initialize Firebase Client
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        
        const result = await signInWithPopup(auth, provider);
        const user = result.user;

        if (!user.email) {
          throw new Error('Google Account has no validated email address.');
        }

        // Post Google Account Profile to local database
        const res = await axios.post('/api/auth/google', {
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          uid: user.uid
        });

        const { token, user: appUser } = res.data;
        onLoginSuccess(token, appUser);
        triggerToast(`Signed in with Google as ${appUser.username}!`, 'success');
      } catch (err: any) {
        console.error('Google Sign-In Error:', err);
        setError(err?.message || 'Authentication with Google failed.');
        triggerToast('Google authentication failed.', 'error');
      } finally {
        setLoading(false);
      }
    } else {
      // Fallback elegant developer Google Account Sign-In
      // This is highly informative, elegant, and avoids locking the user out in non-configured trials
      try {
        const dummyEmail = 'amber.guest_' + Math.floor(Math.random() * 899 + 100) + '@gmail.com';
        const dummyName = 'Amber Guest';
        const dummyUid = 'mock_google_id_' + Date.now();

        const res = await axios.post('/api/auth/google', {
          email: dummyEmail,
          name: dummyName,
          uid: dummyUid
        });

        const { token, user: appUser } = res.data;
        onLoginSuccess(token, appUser);
        triggerToast(`Google Mock Login success: Access granted to portal!`, 'success');
      } catch (err: any) {
        setError('Fallback google authentication failed.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-y-auto" id="auth-main-wrapper">
      {/* Glow Effects */}
      <div className="fixed top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-25%] right-[-10%] w-[50%] h-[50%] bg-violet-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main card box with clean glassmorphic design */}
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-8 space-y-6 animate-fade-in relative z-10 m-auto my-8" id="unified-auth-container">
        
        {/* Language Selection bar */}
        <div className="flex justify-end items-center gap-1.5" id="auth-lang-selector-bar">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Language / भाषा:</span>
          <div className="flex bg-slate-950 rounded-lg p-0.5 border border-slate-800">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider transition-all duration-200 ${
                language === 'en'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider transition-all duration-200 ${
                language === 'hi'
                  ? 'bg-amber-600 text-white'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>

        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center border border-amber-500/30 text-amber-500">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-50 tracking-tight">{t('brand.name', 'THE AMBER ROYALE').toUpperCase()}</h1>
          <p className="text-xs text-slate-400 font-semibold uppercase tracking-widest">
            {mode === 'login' && t('auth.sign_in', 'Portal Authentication')}
            {mode === 'register' && t('auth.create_account', 'Suite Guest Registration')}
            {mode === 'forgot' && t('auth.forgot_password', 'Reset Suite Credentials')}
          </p>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs rounded-lg flex items-start gap-1.5 animate-pulse">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs rounded-lg flex items-start gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MODE 1: LOGIN CARD */}
        {mode === 'login' && (
          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {/* Quick Demo Login Tabs */}
            <div id="auth-role-select-tabs" className="space-y-1.5">
              <span className="block text-[10px] text-slate-500 font-extrabold uppercase tracking-widest text-center">
                Select Your Portal Role
              </span>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setUsername('customer_john');
                    setPassword('john123');
                    triggerToast('Guest John login pre-configured. Click below to sign in.', 'success');
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    username.toLowerCase().includes('john') || username.toLowerCase().includes('customer') || (!username && !password)
                      ? 'bg-amber-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200 font-semibold'
                  }`}
                  id="tab-select-guest"
                >
                  🛎️ Guest Portal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('admin123');
                    triggerToast('Administrator login pre-configured. Click below to sign in.', 'success');
                  }}
                  className={`py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 ${
                    username.toLowerCase() === 'admin'
                      ? 'bg-amber-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-slate-200 font-semibold'
                  }`}
                  id="tab-select-admin"
                >
                  🛡️ System Admin
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Username / Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><UserIcon className="w-4 h-4" /></span>
                <input
                  type="text"
                  required
                  placeholder="Enter username (e.g. admin)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-1">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Secret Password
                </label>
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-[10px] text-amber-500 hover:text-amber-400 font-bold uppercase tracking-wider transition-colors"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><Lock className="w-4 h-4" /></span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-9 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-sm tracking-wide transition-all shadow-md focus:ring-2 focus:ring-amber-500/50 disabled:bg-slate-800 cursor-pointer"
            >
              {loading ? 'Verifying access...' : 'Sign Into Suite Portal'}
            </button>
          </form>
        )}

        {/* MODE 2: REGISTER CARD */}
        {mode === 'register' && (
          <form onSubmit={handleRegisterSubmit} className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500"><UserIcon className="w-4 h-4" /></span>
                  <input
                    type="text"
                    required
                    placeholder="Guest Full Name"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500"><Phone className="w-4 h-4" /></span>
                    <input
                      type="tel"
                      required
                      placeholder="+1 555-0199"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-slate-500"><Mail className="w-4 h-4" /></span>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john@guest.com"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  Residential Address (Optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500"><MapPin className="w-4 h-4" /></span>
                  <input
                    type="text"
                    placeholder="Physical residential / street address"
                    value={regAddress}
                    onChange={(e) => setRegAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="border-t border-slate-800/60 pt-3 mt-1">
                <span className="block text-[10px] font-bold text-amber-500 uppercase tracking-wider mb-2">Portal Security Setup</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Username *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Desired username"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        placeholder="••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
                      >
                        {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                    Confirm Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-sm tracking-wide transition-all shadow-md focus:ring-2 focus:ring-amber-500/50 disabled:bg-slate-800 cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Complete Guest Registration'}
            </button>
          </form>
        )}

        {/* MODE 3: FORGOT PASSWORD */}
        {mode === 'forgot' && (
          <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Your Security Username
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><UserIcon className="w-4 h-4" /></span>
                <input
                  type="text"
                  required
                  placeholder="Enter user log id"
                  value={forgotUsername}
                  onChange={(e) => setForgotUsername(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Associated Registered Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><Mail className="w-4 h-4" /></span>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@guest.com"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                Set New Secret Password
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-500"><KeyRound className="w-4 h-4" /></span>
                <input
                  type="password"
                  required
                  placeholder="Enter complex new key"
                  value={forgotNewPassword}
                  onChange={(e) => setForgotNewPassword(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-lg text-sm tracking-wide transition-all shadow-md focus:ring-2 focus:ring-amber-500/50 disabled:bg-slate-800 cursor-pointer"
            >
              {loading ? 'Verifying criteria...' : 'Complete Security Reset'}
            </button>
          </form>
        )}

        {/* Divider line for OAuth */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-xs text-slate-500 uppercase">
            <span className="bg-slate-900 px-3 font-semibold tracking-wider">Or continue with</span>
          </div>
        </div>

        {/* Google OAuth Button */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          type="button"
          className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-100 font-bold py-2.5 rounded-lg text-sm tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer disabled:bg-slate-950/70"
        >
          {/* Flat beautiful Google SVG Icon */}
          <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
          </svg>
          Google Cloud Connection
        </button>

        {/* Dynamic Mode Switcher Link at bottom */}
        <div className="text-center text-xs text-slate-400">
          {mode === 'login' && (
            <span>
              Don't have a royal suite account yet?{' '}
              <button
                type="button"
                onClick={() => setMode('register')}
                className="text-amber-500 font-bold hover:underline"
              >
                Sign Up Now
              </button>
            </span>
          )}

          {mode === 'register' && (
            <span>
              Already registered as a guest?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-500 font-bold hover:underline"
              >
                Log In Here
              </button>
            </span>
          )}

          {mode === 'forgot' && (
            <span>
              Remembered your credentials?{' '}
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-amber-500 font-bold hover:underline"
              >
                Go to Login
              </button>
            </span>
          )}
        </div>

        {/* DEFAULT CRITICAL SEED SIGNPOSTS (Only shown on Login View) */}
        {mode === 'login' && (
          <div className="bg-slate-950 border border-slate-800/80 p-4 rounded-xl space-y-1.5 text-[11px] text-slate-400 select-none">
            <span className="block font-bold text-slate-300 text-[10px] uppercase tracking-wider mb-1">
              Terminal Default Seed Logins
            </span>
            <div className="flex justify-between items-baseline">
              <span>Admin Profile:</span>
              <span className="font-mono text-amber-500 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                admin / admin123
              </span>
            </div>
            <div className="flex justify-between items-baseline border-t border-slate-800/60 pt-2 mt-1">
              <span>Customer Workspace:</span>
              <span className="font-mono text-violet-400 font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                customer_john / john123
              </span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
