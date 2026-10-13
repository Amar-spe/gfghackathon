import React, { useEffect, useState } from 'react';
import { Info, CheckCircle2, AlertTriangle, AlertOctagon, X } from 'lucide-react';

const TYPE_CONFIG = {
  info:    { border: 'border-l-blue-500',   bg: 'bg-white dark:bg-slate-900', icon: Info, color: 'text-blue-500' },
  success: { border: 'border-l-teal',       bg: 'bg-white dark:bg-slate-900', icon: CheckCircle2, color: 'text-teal' },
  warning: { border: 'border-l-amber-500',  bg: 'bg-white dark:bg-slate-900', icon: AlertTriangle, color: 'text-amber-500' },
  danger:  { border: 'border-l-emergency',  bg: 'bg-white dark:bg-slate-900', icon: AlertOctagon, color: 'text-emergency' },
};

function AlertItem({ alert, onRemove }) {
  const [visible, setVisible] = useState(false);
  const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.info;
  const Icon = cfg.icon;

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 10);
    const t2 = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onRemove(alert.id), 250);
    }, 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [alert.id, onRemove]);

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(() => onRemove(alert.id), 250); }}
      className={`p-3 rounded-lg border border-slate-200 dark:border-slate-800 ${cfg.border} border-l-4 shadow-card mb-2 transition-all duration-200 cursor-pointer flex items-start gap-2.5 ${cfg.bg} ${
        visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}
    >
      <Icon size={16} className={`${cfg.color} flex-shrink-0 mt-0.5`} />
      <div className="flex-1 min-w-0">
        <div className="text-xs font-medium text-slate-800 dark:text-slate-100 leading-snug">
          {alert.message}
        </div>
        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
          {alert.time}
        </div>
      </div>
      <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        <X size={12} />
      </button>
    </div>
  );
}

export default function AlertSystem({ alerts = [], onRemove }) {
  return (
    <div className="flex flex-col gap-1 pointer-events-auto">
      {alerts.map(alert => (
        <AlertItem key={alert.id} alert={alert} onRemove={onRemove} />
      ))}
    </div>
  );
}
