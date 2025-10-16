import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabaseAdmin';

function toCSV(rows: any[]) {
  if (!rows || rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
      return '"' + s.replace(/"/g, '""') + '"';
    }
    return s;
  };
  const lines = [headers.join(',')];
  for (const r of rows) lines.push(headers.map(h => escape(r[h])).join(','));
  return lines.join('\n');
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('v_entries_detailed').select('*').order('start_ts', { ascending: false }).limit(5000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const mapped = (data||[]).map(r => ({
    date: r.start_ts?.slice(0,10),
    start_time: r.start_ts,
    end_time: r.end_ts,
    employee: r.employee,
    employee_id: r.user_id,
    customer: r.customer,
    function: r.function,
    duration_minutes: Math.round((r.duration_seconds || 0)/60),
    rounded_minutes: r.rounded_minutes,
    notes: r.notes,
    source: r.source,
    device_id: r.device_id,
    entry_id: r.id
  }));
  const csv = toCSV(mapped);
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
