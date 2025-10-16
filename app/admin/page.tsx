'use client';
import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseBrowser';

type Opt = { id: string; name: string; active: boolean };

export default function Admin() {
  const [role, setRole] = useState<'admin'|'employee'|'unknown'>('unknown');
  const [customers, setCustomers] = useState<Opt[]>([]);
  const [functions, setFunctions] = useState<Opt[]>([]);
  const [newCustomer, setNewCustomer] = useState('');
  const [newFunction, setNewFunction] = useState('');

  useEffect(() => {
    async function init() {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) { window.location.href = '/'; return; }
      const { data: prof } = await supabase.from('profiles').select('role').eq('id', u.user.id).maybeSingle();
      if (prof?.role === 'admin') setRole('admin'); else setRole('employee');
      await reload();
    }
    async function reload() {
      const { data: c } = await supabase.from('customers').select('*').order('name'); setCustomers(c||[]);
      const { data: f } = await supabase.from('functions').select('*').order('name'); setFunctions(f||[]);
    }
    init();
  }, []);

  async function addCustomer() {
    if (!newCustomer.trim()) return;
    await supabase.from('customers').insert({ name: newCustomer.trim() });
    setNewCustomer('');
    const { data: c } = await supabase.from('customers').select('*').order('name'); setCustomers(c||[]);
  }

  async function addFunction() {
    if (!newFunction.trim()) return;
    await supabase.from('functions').insert({ name: newFunction.trim() });
    setNewFunction('');
    const { data: f } = await supabase.from('functions').select('*').order('name'); setFunctions(f||[]);
  }

  async function toggle(table: 'customers'|'functions', id: string, active: boolean) {
    await supabase.from(table).update({ active: !active }).eq('id', id);
    const c = await supabase.from('customers').select('*').order('name');
    const f = await supabase.from('functions').select('*').order('name');
    if (c.data) setCustomers(c.data);
    if (f.data) setFunctions(f.data);
  }

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: 'space-between' }}>
        <h1 className="h1">Admin</h1>
        <a className="tag" href="/clock">Back</a>
      </div>
      {role !== 'admin' && <div className="small" style={{ marginTop: 8 }}>You are not an admin. You can view but not modify.</div>}
      <div className="divider" />

      <h2 className="h2">Customers</h2>
      <div className="row">
        <input className="input" placeholder="Add customer..." value={newCustomer} onChange={e=>setNewCustomer(e.target.value)} />
        <button className="button" onClick={addCustomer} disabled={role!=='admin'}>Add</button>
      </div>
      {customers.map(c => (
        <div className="row" key={c.id} style={{ justifyContent: 'space-between' }}>
          <div>{c.name} {c.active ? '' : <span className="tag">inactive</span>}</div>
          <button className="button muted" onClick={()=>toggle('customers', c.id, c.active)} disabled={role!=='admin'}>{c.active?'Deactivate':'Activate'}</button>
        </div>
      ))}

      <div className="divider" />
      <h2 className="h2">Functions</h2>
      <div className="row">
        <input className="input" placeholder="Add function..." value={newFunction} onChange={e=>setNewFunction(e.target.value)} />
        <button className="button" onClick={addFunction} disabled={role!=='admin'}>Add</button>
      </div>
      {functions.map(f => (
        <div className="row" key={f.id} style={{ justifyContent: 'space-between' }}>
          <div>{f.name} {f.active ? '' : <span className="tag">inactive</span>}</div>
          <button className="button muted" onClick={()=>toggle('functions', f.id, f.active)} disabled={role!=='admin'}>{f.active?'Deactivate':'Activate'}</button>
        </div>
      ))}

      <div className="divider" />
      <h2 className="h2">Exports</h2>
      <div className="row">
        <a className="button" href="/api/exports/all">All entries (CSV)</a>
        <a className="button" href="/api/exports/by-customer">Hours by customer (CSV)</a>
        <a className="button" href="/api/exports/by-customer-function">Hours by customer × function (CSV)</a>
      </div>
      <div className="small">Tip: In Excel → Data → From Web, paste one of these URLs for refreshable reports.</div>
    </div>
  );
}
