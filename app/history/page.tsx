'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseBrowser';

type Row = { id: string; customer: string; function: string; start_ts: string; end_ts: string | null; rounded_minutes: number };

export default function History() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    async function load() {
      const { data: user } = await supabase.auth.getUser();
      if (!user?.user) { window.location.href='/' ; return; }
      const { data } = await supabase.from('v_entries_detailed').select('id,customer,function,start_ts,end_ts,rounded_minutes').eq('user_id', user.user.id).order('start_ts', { ascending: false }).limit(50);
      setRows(data || []);
    }
    load();
  }, []);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">My History</h1>
        <a className="tag" href="/clock">Back</a>
      </div>
      <div className="divider" />
      {rows.map(r => (
        <div key={r.id} style={{ marginBottom: 12 }}>
          <div><b>{r.customer}</b> — {r.function}</div>
          <div className="small">{new Date(r.start_ts).toLocaleString()} → {r.end_ts ? new Date(r.end_ts).toLocaleString() : 'running'}</div>
          <div className="small">Rounded: {r.rounded_minutes} min</div>
          <div className="divider" />
        </div>
      ))}
      {rows.length === 0 && <div className="small">No entries yet.</div>}
    </div>
  );
}
