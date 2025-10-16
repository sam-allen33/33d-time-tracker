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
  const { data, error } = await supabaseAdmin.from('v_hours_by_customer_function').select('*').order('customer').order('function');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const mapped = (data||[]).map(r => ({
    customer: r.customer,
    function: r.function,
    hours: r.hours,
    entries: r.entries
  }));
  const csv = toCSV(mapped);
  return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8' } });
}
