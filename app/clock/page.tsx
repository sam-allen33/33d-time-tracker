'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabaseBrowser';

type Option = { id: string; name: string };

export default function ClockPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [customers, setCustomers] = useState<Option[]>([]);
  const [functionsList, setFunctionsList] = useState<Option[]>([]);
  const [customerId, setCustomerId] = useState<string>('');
  const [functionId, setFunctionId] = useState<string>('');
  const [openEntryId, setOpenEntryId] = useState<string | null>(null);
  const [since, setSince] = useState<Date | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (data?.user?.id) setUserId(data.user.id);
      else window.location.href = '/';
    });
  }, []);

  useEffect(() => {
    async function loadMaster() {
      const { data: c } = await supabase.from('customers').select('id,name').eq('active', true).order('name');
      const { data: f } = await supabase.from('functions').select('id,name').eq('active', true).order('name');
      setCustomers(c || []);
      setFunctionsList(f || []);
    }
    loadMaster();
  }, []);

  useEffect(() => {
    async function checkOpen() {
      if (!userId) return;
      const { data } = await supabase.from('time_entries').select('id,start_ts').eq('user_id', userId).is('end_ts', null).maybeSingle();
      if (data) { setOpenEntryId(data.id); setSince(new Date(data.start_ts)); }
      else { setOpenEntryId(null); setSince(null); }
    }
    checkOpen();
  }, [userId]);

  async function startShift() {
    setError('');
    if (!customerId || !functionId) { setError('Choose customer and function first.'); return; }
    const { error } = await supabase.from('time_entries').insert({
      user_id: userId!, customer_id: customerId, function_id: functionId, source: 'pwa'
    });
    if (error) setError(error.message);
    else {
      const { data } = await supabase.from('time_entries').select('id,start_ts').eq('user_id', userId).is('end_ts', null).maybeSingle();
      if (data) { setOpenEntryId(data.id); setSince(new Date(data.start_ts)); }
    }
  }

  async function stopShift() {
    setError('');
    const { error } = await supabase.from('time_entries').update({ end_ts: new Date().toISOString() }).eq('id', openEntryId!);
    if (error) setError(error.message);
    else { setOpenEntryId(null); setSince(null); alert('Stopped. Your time will be rounded to the nearest 15 minutes in reports.'); }
  }

  const runningFor = useMemo(() => {
    if (!since) return '';
    const mins = Math.floor((Date.now() - since.getTime())/60000);
    const h = Math.floor(mins/60), m = mins%60;
    return `${h}h ${m}m`;
  }, [since]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">Clock</h1>
        <a className="tag" href="/history">History</a>
      </div>
      <div className="divider" />

      <div className="row">
        <select className="select" value={customerId} onChange={e=>setCustomerId(e.target.value)} disabled={!!openEntryId}>
          <option value="">Select customer</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <select className="select" value={functionId} onChange={e=>setFunctionId(e.target.value)} disabled={!!openEntryId}>
          <option value="">Select function</option>
          {functionsList.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
        </select>
      </div>

      {!openEntryId ? (
        <button className="button" style={{ marginTop: 16 }} onClick={startShift} disabled={!customerId || !functionId}>Start</button>
      ) : (
        <div style={{ marginTop: 16 }}>
          <div className="small">Running since: {since?.toLocaleString()} • Elapsed: {runningFor}</div>
          <button className="button danger" style={{ marginTop: 8 }} onClick={stopShift}>Stop</button>
        </div>
      )}

      {error && <div className="small" style={{ color: '#ffbebe', marginTop: 8 }}>Error: {error}</div>}

      <div className="divider" />
      <div className="row">
        <a className="button muted" href="/admin">Admin</a>
        <button className="button muted" onClick={async()=>{ await supabase.auth.signOut(); window.location.href='/'}}>Sign out</button>
      </div>
    </div>
  );
}
