import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';
import type { SindoorState } from '../types';

interface Props {
  state: SindoorState;
}

const THREAT_STYLE = {
  low: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'LOW', ring: '#10b981' },
  elevated: { color: '#fbbf24', bg: 'rgba(251,191,36,0.12)', label: 'ELEVATED', ring: '#fbbf24' },
  high: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'HIGH', ring: '#f97316' },
  critical: { color: '#dc2626', bg: 'rgba(220,38,38,0.14)', label: 'CRITICAL', ring: '#dc2626' },
};

// ── SVG semicircle gauge ──────────────────────────────────────────────────────
function SindoorGauge({ probability }: { probability: number }) {
  const cx = 110;
  const cy = 110;
  const r = 82;

  // Arc from 180° to 0° (left to right, going up)
  // angle in standard math coords (y-up): 180 - prob*1.8
  const probAngle = (180 - probability * 1.8) * (Math.PI / 180);
  const needleX = cx + (r - 6) * Math.cos(probAngle);
  const needleY = cy - (r - 6) * Math.sin(probAngle);

  // Outer tick marks
  const ticks = [0, 25, 50, 75, 100].map((p) => {
    const a = (180 - p * 1.8) * (Math.PI / 180);
    return {
      x1: cx + (r - 4) * Math.cos(a),
      y1: cy - (r - 4) * Math.sin(a),
      x2: cx + (r + 6) * Math.cos(a),
      y2: cy - (r + 6) * Math.sin(a),
      label: p === 0 ? 'LOW' : p === 50 ? 'MOD' : p === 100 ? 'HIGH' : '',
      lx: cx + (r + 17) * Math.cos(a),
      ly: cy - (r + 17) * Math.sin(a),
    };
  });

  // Active arc path from 180° to current angle
  const startRad = Math.PI; // 180 degrees
  const endRad = probAngle;

  const arcStartX = cx + r * Math.cos(startRad);
  const arcStartY = cy - r * Math.sin(startRad);
  const arcEndX = cx + r * Math.cos(endRad);
  const arcEndY = cy - r * Math.sin(endRad);

  // Large arc flag: if angle sweep > 180 deg
  const largeArc = probability > 50 ? 1 : 0;

  return (
    <svg
      width="220"
      height="130"
      viewBox="0 0 220 130"
      style={{ display: 'block', margin: '0 auto' }}
    >
      <defs>
        {/* Gradient for the full background arc */}
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="35%" stopColor="#fbbf24" />
          <stop offset="65%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>

        {/* Glow filter for needle */}
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background arc (full semicircle) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="#1a2840"
        strokeWidth="14"
        strokeLinecap="round"
      />

      {/* Full gradient arc (dimmed) */}
      <path
        d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth="14"
        strokeLinecap="round"
        opacity="0.25"
      />

      {/* Active gradient arc up to probability */}
      {probability > 0 && (
        <path
          d={`M ${arcStartX} ${arcStartY} A ${r} ${r} 0 ${largeArc} 1 ${arcEndX} ${arcEndY}`}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="14"
          strokeLinecap="round"
          opacity="0.9"
        />
      )}

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#2d4060" strokeWidth="1.5" />
          {t.label && (
            <text
              x={t.lx}
              y={t.ly}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#2d4060"
              fontSize="8"
              fontFamily="monospace"
            >
              {t.label}
            </text>
          )}
        </g>
      ))}

      {/* Needle */}
      <line
        x1={cx}
        y1={cy}
        x2={needleX}
        y2={needleY}
        stroke="#e2e8f0"
        strokeWidth="2"
        strokeLinecap="round"
        filter="url(#glow)"
      />

      {/* Center hub */}
      <circle cx={cx} cy={cy} r="7" fill="#111827" stroke="#1f3050" strokeWidth="1.5" />
      <circle cx={cx} cy={cy} r="3" fill="#e2e8f0" />

      {/* Probability number */}
      <text
        x={cx}
        y={cy - 38}
        textAnchor="middle"
        fill="#e2e8f0"
        fontSize="26"
        fontFamily="monospace"
        fontWeight="bold"
      >
        {probability}
        <tspan fontSize="12" fill="#64748b">%</tspan>
      </text>
    </svg>
  );
}

export default function SindoorPanel({ state }: Props) {
  const { probability, trend, trendDelta, threatLevel, factors, lastCalculated } = state;
  const ts = THREAT_STYLE[threatLevel];

  const TrendIcon = trend === 'rising' ? TrendingUp : trend === 'falling' ? TrendingDown : Minus;
  const trendColor = trend === 'rising' ? '#ef4444' : trend === 'falling' ? '#10b981' : '#64748b';

  const escFactors = useMemo(
    () => factors.filter((f) => f.direction === 'escalate' && f.active).slice(0, 5),
    [factors]
  );
  const deEscFactors = useMemo(
    () => factors.filter((f) => f.direction === 'de-escalate' && f.active).slice(0, 5),
    [factors]
  );

  const lastCalcStr = lastCalculated
    ? lastCalculated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <div
      style={{
        width: 300,
        flexShrink: 0,
        background: '#0d1421',
        borderLeft: '1px solid #1f3050',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '10px 14px 8px',
          borderBottom: '1px solid #1f3050',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%',
              background: ts.color,
              boxShadow: `0 0 6px ${ts.color}`,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              color: '#e2e8f0',
              fontFamily: 'monospace',
              fontSize: 11,
              letterSpacing: '0.12em',
              fontWeight: 700,
            }}
          >
            OP SINDOOR RESUME
          </span>
        </div>
        <div style={{ color: '#64748b', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.08em' }}>
          PROBABILITY INDEX · LIVE INTELLIGENCE MODEL
        </div>
        <div style={{ color: '#2d4060', fontFamily: 'monospace', fontSize: 9, marginTop: 2, letterSpacing: '0.06em' }}>
          RECALCULATED {lastCalcStr} IST
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#1f3050 transparent',
        }}
      >
        {/* Gauge */}
        <div style={{ padding: '16px 10px 8px' }}>
          <SindoorGauge probability={probability} />

          {/* Threat level badge */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 4, gap: 10, alignItems: 'center' }}>
            <span
              style={{
                padding: '4px 16px',
                borderRadius: 4,
                background: ts.bg,
                color: ts.color,
                border: `1px solid ${ts.color}40`,
                fontFamily: 'monospace',
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {ts.label}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <TrendIcon size={12} color={trendColor} />
              <span style={{ color: trendColor, fontFamily: 'monospace', fontSize: 10 }}>
                {trend === 'stable' ? 'STABLE' : `${trend === 'rising' ? '+' : ''}${trendDelta}pts`}
              </span>
            </div>
          </div>

          {/* Disclaimer */}
          <div
            style={{
              marginTop: 10,
              padding: '6px 8px',
              background: 'rgba(59,130,246,0.06)',
              border: '1px solid rgba(59,130,246,0.15)',
              borderRadius: 4,
              display: 'flex',
              gap: 6,
              alignItems: 'flex-start',
            }}
          >
            <Info size={10} color="#3b82f6" style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ color: '#4a6080', fontSize: 9, margin: 0, lineHeight: 1.5, fontFamily: 'monospace' }}>
              Index is keyword-weighted from live OSINT feeds. For analytical reference only.
            </p>
          </div>
        </div>

        <div style={{ height: 1, background: '#1f3050' }} />

        {/* Escalation factors */}
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              color: '#ef4444',
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.12em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <TrendingUp size={10} />
            ESCALATORY SIGNALS ({escFactors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {escFactors.length === 0 ? (
              <div style={{ color: '#2d4060', fontFamily: 'monospace', fontSize: 10 }}>
                No active escalatory signals
              </div>
            ) : (
              escFactors.map((f) => (
                <div
                  key={f.id}
                  style={{
                    padding: '6px 8px',
                    background: f.fromLiveNews ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                    border: `1px solid rgba(239,68,68,${f.fromLiveNews ? '0.25' : '0.12'})`,
                    borderRadius: 4,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ color: '#ef4444', fontFamily: 'monospace', fontSize: 10, fontWeight: 600 }}>
                      +{f.weight}
                    </span>
                    {f.fromLiveNews && (
                      <span
                        style={{
                          fontSize: 7, fontFamily: 'monospace',
                          color: '#ef4444', letterSpacing: '0.08em',
                          background: 'rgba(239,68,68,0.15)', padding: '1px 4px', borderRadius: 2,
                        }}
                      >
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ color: '#cbd5e1', fontSize: 10, lineHeight: 1.4 }}>{f.label}</div>
                  <div style={{ color: '#4a6080', fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>{f.description}</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ height: 1, background: '#1f3050' }} />

        {/* De-escalation factors */}
        <div style={{ padding: '12px 14px' }}>
          <div
            style={{
              color: '#10b981',
              fontFamily: 'monospace',
              fontSize: 9,
              letterSpacing: '0.12em',
              marginBottom: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <TrendingDown size={10} />
            DE-ESCALATORY FACTORS ({deEscFactors.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {deEscFactors.map((f) => (
              <div
                key={f.id}
                style={{
                  padding: '6px 8px',
                  background: 'rgba(16,185,129,0.05)',
                  border: '1px solid rgba(16,185,129,0.12)',
                  borderRadius: 4,
                }}
              >
                <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: 10, fontWeight: 600, marginBottom: 2 }}>
                  {f.weight}
                </div>
                <div style={{ color: '#94a3b8', fontSize: 10, lineHeight: 1.4 }}>{f.label}</div>
                <div style={{ color: '#4a6080', fontSize: 9, lineHeight: 1.4, marginTop: 1 }}>{f.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Pakistan threat summary */}
        <div style={{ margin: '0 14px 14px', padding: '10px 12px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.18)', borderRadius: 6 }}>
          <div style={{ color: '#dc2626', fontFamily: 'monospace', fontSize: 9, letterSpacing: '0.1em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
            <AlertTriangle size={10} />
            THREAT POSTURE — PAKISTAN
          </div>
          {[
            { label: 'Nuclear readiness', val: 'AMBIGUOUS', color: '#f97316' },
            { label: 'Conventional forces', val: 'HEIGHTENED', color: '#ef4444' },
            { label: 'Proxy activity', val: 'ACTIVE', color: '#ef4444' },
            { label: 'Diplomatic channel', val: 'STRAINED', color: '#fbbf24' },
          ].map((row) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: '#64748b', fontSize: 10 }}>{row.label}</span>
              <span style={{ color: row.color, fontFamily: 'monospace', fontSize: 9, fontWeight: 600 }}>{row.val}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
