'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseBrowser';

export default function Page() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) window.location.href = '/clock';
    });
  }, []);

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Sending sign-in link...');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin + '/clock' } });
    if (error) setStatus('Error: ' + error.message);
    else setStatus('Check your email for a 6-digit code or link.');
  }

  return (
    <div className="card">
      <h1 className="h1">33° Time Tracker</h1>
      <p className="small">Sign in with your email to continue.</p>
      <form onSubmit={sendMagicLink} className="row" style={{ marginTop: 12 }}>
        <input className="input" type="email" placeholder="you@company.com" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        <button className="button" type="submit">Send Sign-In Code</button>
      </form>
      <div className="small" style={{ marginTop: 8 }}>{status}</div>
    </div>
  );
}
