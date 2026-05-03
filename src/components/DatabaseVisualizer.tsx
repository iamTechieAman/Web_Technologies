'use client';
import React from 'react';
import { Database, Table2, KeyRound, Braces, Hash, Type, Boxes } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DatabaseVisualizerProps {
  variables: Record<string, { value: unknown; type: string }>;
}

function normalizeEntry(entry: { value: unknown; type: string }): { kind: string; rows: Array<[string, string]> } {
  const value = entry?.value;
  if (Array.isArray(value)) {
    return {
      kind: 'array table',
      rows: value.map((item, index) => [String(index), typeof item === 'object' ? JSON.stringify(item) : String(item)]),
    };
  }
  if (value && typeof value === 'object') {
    return {
      kind: 'object record',
      rows: Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, typeof item === 'object' ? JSON.stringify(item) : String(item)]),
    };
  }
  return { kind: entry?.type || typeof value, rows: [['value', String(value)]] };
}

function iconForType(type: string): React.ReactNode {
  if (type === 'array') return <Table2 size={14} />;
  if (type === 'number') return <Hash size={14} />;
  if (type === 'object') return <Braces size={14} />;
  return <Type size={14} />;
}

export default function DatabaseVisualizer({ variables }: DatabaseVisualizerProps): React.ReactNode {
  const entries = Object.entries(variables || {});
  const structured = entries.filter(([, data]) => Array.isArray(data?.value) || (data?.value && typeof data.value === 'object'));

  if (entries.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-8">
        <Database size={48} className="text-cyan-500/20 mb-4" />
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Data Model Empty</p>
        <p className="text-[10px] text-gray-600 mt-2 max-w-xs leading-relaxed">
          Run code with variables, arrays, maps, objects, or records to see a database-style schema and table view.
        </p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto custom-scrollbar p-1 space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3">
          <div className="flex items-center gap-2 text-cyan-400 mb-1">
            <Database size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Variables</span>
          </div>
          <p className="text-2xl font-black text-white">{entries.length}</p>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <div className="flex items-center gap-2 text-blue-400 mb-1">
            <Table2 size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Tables</span>
          </div>
          <p className="text-2xl font-black text-white">{structured.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
          <div className="flex items-center gap-2 text-emerald-400 mb-1">
            <KeyRound size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Fields</span>
          </div>
          <p className="text-2xl font-black text-white">
            {entries.reduce((sum, [, data]) => sum + normalizeEntry(data).rows.length, 0)}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {entries.map(([name, data]) => {
          const table = normalizeEntry(data);
          return (
            <section key={name} className="rounded-lg border border-white/10 bg-white/[0.03] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.03]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className={cn("w-7 h-7 rounded-md flex items-center justify-center border", data.type === 'array' ? "text-blue-400 border-blue-500/20 bg-blue-500/10" : "text-cyan-400 border-cyan-500/20 bg-cyan-500/10")}>
                    {iconForType(data.type)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-xs font-black text-white truncate">{name}</h3>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-gray-500">{table.kind}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-gray-500 bg-white/5 px-2 py-1 rounded-md">
                  {table.rows.length} rows
                </span>
              </div>
              <div className="grid grid-cols-[120px_1fr] text-[10px]">
                <div className="px-3 py-2 font-black uppercase tracking-widest text-gray-500 border-b border-r border-white/10">Key</div>
                <div className="px-3 py-2 font-black uppercase tracking-widest text-gray-500 border-b border-white/10">Value</div>
                {table.rows.slice(0, 16).map(([key, value]) => (
                  <React.Fragment key={`${name}-${key}`}>
                    <div className="px-3 py-2 font-mono text-cyan-300 border-r border-white/10 truncate">{key}</div>
                    <div className="px-3 py-2 font-mono text-gray-300 break-all">{value}</div>
                  </React.Fragment>
                ))}
              </div>
            </section>
          );
        })}
      </div>

      <div className="rounded-lg border border-white/10 bg-black/20 p-3 flex items-start gap-3">
        <Boxes size={16} className="text-cyan-400 shrink-0 mt-0.5" />
        <p className="text-[10px] leading-relaxed text-gray-400">
          This view translates runtime variables into database-style records so arrays, maps, objects, and primitive values are easier to inspect while stepping through code.
        </p>
      </div>
    </div>
  );
}
