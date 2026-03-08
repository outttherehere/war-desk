import { useEffect, useRef } from 'react';
import { X, AlertTriangle, TrendingUp, TrendingDown, Minus, Shield, Radio } from 'lucide-react';
import type { Conflict } from '../types';

interface Props {
  conflict: Conflict;
  onClose: () => void;
}

const STATUS_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  active: { bg: 'rgba(220,38,38,0.15)', color: '#ef4444', label: 'ACTIVE' },
  escalating: { bg: 'rgba(239,68,68,0.15)', color: '#f87171', label: 'ESCALATING' },
  'de-escalating': { bg: 'rgba(16,185,129,0.15)', color: '#34d399', label: 'DE-ESCALATING' },
  frozen: { bg: 'rgba(59,130,246,0.15)', color: '#60a5fa', label: 'FROZEN' },
  monitoring: { bg: 'rgba(245,158,11,0.15)', color: '#fbbf24', label: 'MONITORING' },
};

const INTENSITY_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high: '#ef4444',
  moderate: '#f87171',
  low: '#fca5a5',
};

const IMPACT_COLOR: Record<string, string> = {
  direct: '#ef4444',
  indirect: '#f97316',
};

function RiskBar({ score }: { score: number }) {
  const color =
    score >= 80 ? '#dc2626' : score >= 60 ? '#ef4444' : score >= 40 ? '#f97316' : '#fbbf24';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div
        style={{
          flex: 1,
          height: 5,
          background: 'rgba(255,255,255,0.07)',
          borderRadius: 3,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: 3,
            transition: 'width 0.6s ease',
          }}
        />
      </div>
      <span style={{ color, fontFamily: 'monospace', fontSize: 13, fontWeight: 700, minWidth: 32 }}>
        {score}
      </span>
    </div>
  );
}

export default function ConflictPanel({ conflict, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const statusStyle = STATUS_STYLE[conflict.status] || STATUS_STYLE.monitoring;
  const intensityColor = INTENSITY_COLOR[conflict.intensity];

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => window.addEventListener('mousedown', handler), 50);
    return () => window.removeEventListener('mousedown', handler);
  }, [onClose]);

  const TrendIcon = conflict.status === 'escalating' ? TrendingUp :
                    conflict.status === 'de-escalating' ? TrendingDown : Minus;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 200,
          backdropFilter: 'blur(2px)',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'min(820px, 96vw)',
          maxHeight: '82vh',
          background: '#0d1421',
          border: `1px solid ${intensityColor}44`,
          borderBottom: 'none',
          borderRadius: '12px 12px 0 0',
          zIndex: 201,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: `0 -8px 40px ${intensityColor}22, 0 -2px 0 ${intensityColor}`,
          animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '14px 20px 12px',
            borderBottom: '1px solid #1f3050',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            flexShrink: 0,
          }}
        >
          {/* Pulsing indicator */}
          <div
            style={{
              width: 12, height: 12,
              borderRadius: '50%',
              background: intensityColor,
              boxShadow: `0 0 8px ${intensityColor}`,
              marginTop: 4,
              flexShrink: 0,
              animation: conflict.intensity === 'critical' ? 'pulse-dot 1.2s ease-in-out infinite' : 'none',
            }}
          />

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <h2
                style={{
                  color: '#e2e8f0',
                  fontFamily: 'monospace',
                  fontSize: 15,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  margin: 0,
                }}
              >
                {conflict.title.toUpperCase()}
              </h2>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  background: statusStyle.bg,
                  color: statusStyle.color,
                  border: `1px solid ${statusStyle.color}40`,
                }}
              >
                {statusStyle.label}
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  fontWeight: 600,
                  background: `${IMPACT_COLOR[conflict.impact]}15`,
                  color: IMPACT_COLOR[conflict.impact],
                  border: `1px solid ${IMPACT_COLOR[conflict.impact]}40`,
                }}
              >
                {conflict.impact.toUpperCase()} IMPACT
              </span>
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: 3,
                  fontSize: 10,
                  fontFamily: 'monospace',
                  letterSpacing: '0.1em',
                  color: '#64748b',
                  border: '1px solid #1f3050',
                }}
              >
                {conflict.type.toUpperCase().replace(/-/g, ' ')}
              </span>
            </div>
            <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 11, marginTop: 4, letterSpacing: '0.06em' }}>
              {conflict.region}
            </div>
          </div>

          {/* Country flags */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {conflict.countries.map((c) => (
              <div
                key={c.code}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}
                title={c.name}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{c.flag}</span>
                <span style={{ color: '#64748b', fontSize: 9, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                  {c.code}
                </span>
              </div>
            ))}
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid #1f3050',
              borderRadius: 4,
              padding: 6,
              cursor: 'pointer',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.1)')}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)')}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Left — Highlights */}
          <div
            style={{
              flex: 1,
              padding: '16px 20px',
              overflowY: 'auto',
              borderRight: '1px solid #1f3050',
            }}
          >
            {/* Risk score */}
            <div
              style={{
                marginBottom: 14,
                padding: '10px 12px',
                background: 'rgba(220,38,38,0.06)',
                border: '1px solid rgba(220,38,38,0.18)',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  display: 'flex', justifyContent: 'space-between',
                  marginBottom: 8, alignItems: 'center',
                }}
              >
                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 10, letterSpacing: '0.1em' }}>
                  THREAT INDEX
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <TrendIcon size={12} color={statusStyle.color} />
                  <span style={{ color: statusStyle.color, fontFamily: 'monospace', fontSize: 10 }}>
                    {conflict.status.toUpperCase()}
                  </span>
                </div>
              </div>
              <RiskBar score={conflict.riskScore} />
            </div>

            {/* Highlights */}
            <div style={{ marginBottom: 4 }}>
              <div
                style={{
                  color: '#dc2626', fontFamily: 'monospace', fontSize: 10,
                  letterSpacing: '0.12em', marginBottom: 10,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <AlertTriangle size={11} />
                INTELLIGENCE HIGHLIGHTS
              </div>
              <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 7 }}>
                {conflict.highlights.map((h, i) => (
                  <li
                    key={i}
                    style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
                  >
                    <span
                      style={{
                        color: intensityColor,
                        fontFamily: 'monospace',
                        fontSize: 12,
                        flexShrink: 0,
                        marginTop: 1,
                      }}
                    >
                      ›
                    </span>
                    <span style={{ color: '#cbd5e1', fontSize: 12.5, lineHeight: 1.5 }}>
                      {h}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right — Summary + India Risk */}
          <div
            style={{
              width: 280,
              flexShrink: 0,
              padding: '16px 18px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            {/* Brief write-up */}
            <div>
              <div
                style={{
                  color: '#64748b', fontFamily: 'monospace', fontSize: 10,
                  letterSpacing: '0.12em', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Radio size={11} />
                SITUATION BRIEF
              </div>
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: 12,
                  lineHeight: 1.7,
                  margin: 0,
                }}
              >
                {conflict.summary}
              </p>
            </div>

            {/* India risk */}
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.22)',
                borderRadius: 6,
              }}
            >
              <div
                style={{
                  color: '#dc2626', fontFamily: 'monospace', fontSize: 10,
                  letterSpacing: '0.12em', marginBottom: 8,
                  display: 'flex', alignItems: 'center', gap: 6,
                }}
              >
                <Shield size={11} />
                INDIA RISK ASSESSMENT
              </div>
              <p style={{ color: '#e2e8f0', fontSize: 12, lineHeight: 1.6, margin: 0 }}>
                {conflict.indiaRisk}
              </p>
            </div>

            {/* Conflict type / intensity label */}
            <div
              style={{
                padding: '8px 12px',
                background: '#111827',
                border: '1px solid #1f3050',
                borderRadius: 6,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ color: '#4a6080', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 3 }}>
                  INTENSITY
                </div>
                <div style={{ color: intensityColor, fontFamily: 'monospace', fontSize: 11, fontWeight: 700, letterSpacing: '0.08em' }}>
                  {conflict.intensity.toUpperCase()}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#4a6080', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 3 }}>
                  RISK SCORE
                </div>
                <div style={{ color: intensityColor, fontFamily: 'monospace', fontSize: 18, fontWeight: 700 }}>
                  {conflict.riskScore}
                  <span style={{ fontSize: 10, fontWeight: 400, color: '#4a6080' }}>/100</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
