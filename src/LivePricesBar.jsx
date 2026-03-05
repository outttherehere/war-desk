// LivePricesBar.jsx — INR/USD, Brent crude, Gold — direct browser fetch
import { useState, useEffect } from 'react';

function PriceTile({ label, value, unit, change, color, subtitle }) {
  const isPos = change > 0;
  const isNeg = change < 0;
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 12px', borderRight: '1px solid #1a1a1a',
      minWidth: 90
    }}>
      <div style={{ color: '#555', fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>{label}</div>
      <div style={{ color: color || '#fff', fontSize: 14, fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: 1 }}>
        {value ? `${unit}${value}` : '—'}
      </div>
      {change !== undefined && change !== null && (
        <div style={{ fontSize: 9, color: isPos ? '#ff4444' : isNeg ? '#00ff88' : '#555', letterSpacing: 1 }}>
          {isPos ? '▲' : isNeg ? '▼' : '●'} {Math.abs(change).toFixed(2)}%
        </div>
      )}
      {subtitle && <div style={{ color: '#444', fontSize: 8 }}>{subtitle}</div>}
    </div>
  );
}

export default function LivePricesBar({ prices }) {
  const { inr, brent, gold, lastUpdate } = prices || {};

  // INR weakening = geopolitical stress indicator
  const inrStress = inr && parseFloat(inr.rate) > 85;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', background: '#080810',
      borderBottom: '1px solid #1a1a1a', overflowX: 'auto',
      scrollbarWidth: 'none'
    }}>
      <div style={{ color: '#333', fontSize: 8, padding: '0 8px', letterSpacing: 2, whiteSpace: 'nowrap' }}>MARKETS</div>

      <PriceTile
        label="INR/USD"
        value={inr?.rate}
        unit="₹"
        change={inr ? parseFloat(inr.change) : null}
        color={inrStress ? '#ff8c00' : '#00ff88'}
        subtitle={inrStress ? 'STRESS' : 'STABLE'}
      />
      <PriceTile
        label="BRENT CRUDE"
        value={brent?.price}
        unit="$"
        color={brent && parseFloat(brent.price) > 90 ? '#ff4444' : '#ffd700'}
        subtitle="per barrel"
      />
      <PriceTile
        label="GOLD"
        value={gold?.price}
        unit="$"
        color="#ffd700"
        subtitle="per oz"
      />

      {/* Static but important context */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 12px', borderRight: '1px solid #1a1a1a', minWidth: 80 }}>
        <div style={{ color: '#555', fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>PAK FOREX</div>
        <div style={{ color: '#ff4444', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }}>$9.2B</div>
        <div style={{ color: '#ff444488', fontSize: 8 }}>CRITICAL LOW</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '4px 12px', minWidth: 80 }}>
        <div style={{ color: '#555', fontSize: 8, letterSpacing: 2, marginBottom: 2 }}>INDIA FOREX</div>
        <div style={{ color: '#00ff88', fontSize: 12, fontFamily: 'monospace', fontWeight: 'bold' }}>$625B</div>
        <div style={{ color: '#00ff8888', fontSize: 8 }}>RESILIENT</div>
      </div>

      {lastUpdate && (
        <div style={{ marginLeft: 'auto', color: '#333', fontSize: 8, padding: '0 8px', whiteSpace: 'nowrap' }}>
          UPD {lastUpdate}
        </div>
      )}
    </div>
  );
}
