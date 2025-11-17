import React, { useEffect, useRef, useState } from 'react';

const Gauge = ({ value = 0, size = 180, label = '' }) => {
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);

    useEffect(() => {
        const startVal = display;
        const endVal = Math.max(0, Math.min(1, value));
        const start = performance.now();
        const duration = 600;
        const step = (now) => {
            const t = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - t, 3);
            const cur = startVal + (endVal - startVal) * eased;
            setDisplay(cur);
            if (t < 1) rafRef.current = requestAnimationFrame(step);
        };
        rafRef.current = requestAnimationFrame(step);
        return () => rafRef.current && cancelAnimationFrame(rafRef.current);
    }, [value]);

    const clamped = Math.max(0, Math.min(1, display));
    const angle = -90 + clamped * 180;
    const r = size / 2;
    const stroke = Math.max(10, Math.round(size * 0.08));
    const cx = size / 2;
    const cy = size / 2;
    const pathBg = describeArc(cx, cy, r - stroke, 180, 0);
    const needleLen = r - stroke * 1.6;
    const needle = {
        x: cx + needleLen * Math.cos((Math.PI / 180) * angle),
        y: cy + needleLen * Math.sin((Math.PI / 180) * angle)
    };

    return (
        <div style={{ width: size, textAlign: 'center' }}>
            <svg width={size} height={size / 1.2} viewBox={`0 0 ${size} ${size / 1.2}`}>
                <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#6c5ce7" />
                        <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                    <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#6c5ce7" floodOpacity="0.25" />
                    </filter>
                </defs>
                <path d={pathBg} fill="none" stroke="#eceff4" strokeWidth={stroke} strokeLinecap="round" />
                <path d={describeArc(cx, cy, r - stroke, 180, angle + 0.001)} fill="none" stroke="url(#gaugeGradient)" strokeWidth={stroke} strokeLinecap="round" filter="url(#softShadow)" />
                <circle cx={cx} cy={cy} r={6} fill="#6c5ce7" />
                <line x1={cx} y1={cy} x2={needle.x} y2={needle.y} stroke="#6c5ce7" strokeWidth={4} strokeLinecap="round" />
                <text x={cx} y={cy + 20} textAnchor="middle" fill="#1f2937" fontSize="14" fontWeight="700">{Math.round(clamped * 100)}%</text>
            </svg>
            <div style={{ marginTop: 6, fontSize: 14, color: '#4b5563' }}>{label}</div>
        </div>
    );
};

function polarToCartesian(cx, cy, r, angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
        x: cx + r * Math.cos(angleInRadians),
        y: cy + r * Math.sin(angleInRadians)
    };
}

function describeArc(x, y, r, startAngle, endAngle) {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return [
        'M', start.x, start.y,
        'A', r, r, 0, largeArcFlag, 0, end.x, end.y
    ].join(' ');
}

export default Gauge;
