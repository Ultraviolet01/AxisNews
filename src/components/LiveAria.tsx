'use client';

import { useRef, useState, useEffect } from 'react';
import { useLiveAria, LiveAriaStatus } from '@/lib/useLiveAria';

interface LiveAriaProps {
  section: string;
  accent: string;
  onClose: () => void;
  initialScript?: string;
}

const STATUS_LABELS: Record<LiveAriaStatus, string> = {
  idle: 'START LIVE SESSION',
  connecting: 'CONNECTING...',
  connected: 'ASK ARIA',
  speaking: 'ARIA IS SPEAKING',
  error: 'RETRY',
};

const SUGGESTED_QUESTIONS = [
  'What does this mean for markets?',
  'Give me more context on this story',
  'What happens next?',
  "What's the biggest takeaway?",
];

export function LiveAria({ section, accent, onClose, initialScript }: LiveAriaProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [question, setQuestion] = useState('');
  const { status, error, startSession, stopSession, askQuestion, interrupt } =
    useLiveAria(videoRef, initialScript);

  useEffect(() => {
    if (initialScript && status === 'idle') {
      startSession();
    }
  }, [initialScript, status, startSession]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || status === 'idle' || status === 'connecting') return;
    setQuestion('');
    await askQuestion(q);
  };

  const isActive = status === 'connected' || status === 'speaking';

  return (
    <div
      className="live-aria-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(5,5,8,.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeUp .2s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) { stopSession(); onClose(); } }}
    >
      <style>{`
        @media (max-width: 800px) {
          .live-aria-overlay { padding: 10px !important; }
          .live-aria-modal { border-radius: 0 !important; height: 100vh !important; }
          .live-aria-grid { grid-template-columns: 1fr !important; }
          .live-aria-side { border-left: none !important; border-top: 1px solid rgba(255,255,255,.05) !important; padding: 12px !important; }
          .live-aria-video { aspect-ratio: 1/1 !important; }
        }
      `}</style>
      <div
        className="live-aria-modal"
        style={{
          width: '100%',
          maxWidth: '860px',
          background: '#08080f',
          border: `1px solid ${accent}28`,
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            borderBottom: `1px solid rgba(255,255,255,.06)`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: isActive ? '#34D399' : status === 'connecting' ? accent : 'rgba(255,255,255,.2)',
                animation: (status === 'connecting' || status === 'speaking') ? 'blink .9s infinite' : 'none',
              }}
            />
            <span
              style={{
                fontFamily: "'Bebas Neue',sans-serif",
                fontSize: '18px',
                letterSpacing: '4px',
                color: accent,
              }}
            >
              ARIA LIVE
            </span>
            <span
              style={{
                fontSize: '9px',
                fontFamily: "'JetBrains Mono',monospace",
                color: 'rgba(255,255,255,.3)',
                letterSpacing: '2px',
              }}
            >
              {section.toUpperCase()} · INTERACTIVE
            </span>
          </div>
          <button
            onClick={() => { stopSession(); onClose(); }}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,.08)',
              borderRadius: '6px',
              color: 'rgba(255,255,255,.4)',
              cursor: 'pointer',
              padding: '4px 12px',
              fontSize: '12px',
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            ✕ Close
          </button>
        </div>

        {/* Video + Controls */}
        <div className="live-aria-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 320px' }}>
          {/* Avatar Video */}
          <div
            className="live-aria-video"
            style={{
              position: 'relative',
              background: '#050508',
              aspectRatio: '16/9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Idle placeholder */}
            {status === 'idle' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '72px',
                    height: '72px',
                    borderRadius: '50%',
                    background: `linear-gradient(135deg,${accent}35,rgba(167,139,250,.2))`,
                    border: `2px solid ${accent}45`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px',
                    margin: '0 auto 12px',
                  }}
                >
                  🎙️
                </div>
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: '10px',
                    color: 'rgba(255,255,255,.3)',
                    letterSpacing: '2px',
                  }}
                >
                  PRESS START TO CONNECT
                </div>
              </div>
            )}

            {/* Connecting spinner */}
            {status === 'connecting' && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    borderRadius: '50%',
                    border: `2px solid ${accent}20`,
                    borderTopColor: accent,
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 12px',
                  }}
                />
                <div
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    fontSize: '10px',
                    color: accent,
                    letterSpacing: '2px',
                  }}
                >
                  INITIALISING ARIA...
                </div>
              </div>
            )}

            {/* Live video stream */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: isActive ? 'block' : 'none',
              }}
            />

            {/* Speaking indicator */}
            {status === 'speaking' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: '12px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  display: 'flex',
                  gap: '3px',
                  alignItems: 'flex-end',
                  height: '18px',
                }}
              >
                {[0.4, 0.8, 1, 0.6, 0.9, 0.5, 0.7].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      width: '3px',
                      background: accent,
                      borderRadius: '2px',
                      height: `${h * 18}px`,
                      animation: `wave ${0.6 + i * 0.1}s ease-in-out ${i * 0.08}s infinite`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Network bug */}
            {isActive && (
              <div
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '3px 8px',
                  background: 'rgba(248,113,113,.85)',
                  borderRadius: '3px',
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono',monospace",
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />
                LIVE
              </div>
            )}
          </div>

          {/* Right panel — Q&A controls */}
          <div
            className="live-aria-side"
            style={{
              borderLeft: '1px solid rgba(255,255,255,.05)',
              display: 'flex',
              flexDirection: 'column',
              padding: '16px',
              gap: '12px',
            }}
          >
            {/* Status */}
            <div
              style={{
                padding: '8px 12px',
                background: `${accent}0e`,
                border: `1px solid ${accent}22`,
                borderRadius: '6px',
                fontSize: '10px',
                fontFamily: "'JetBrains Mono',monospace",
                color: accent,
                letterSpacing: '1.5px',
                textAlign: 'center',
              }}
            >
              {error ? `ERROR: ${error}` : STATUS_LABELS[status]}
            </div>

            {/* Start / Stop button */}
            {!isActive ? (
              <button
                onClick={startSession}
                disabled={status === 'connecting'}
                style={{
                  padding: '10px',
                  background: status === 'connecting' ? `${accent}30` : accent,
                  border: 'none',
                  borderRadius: '8px',
                  color: '#050508',
                  cursor: status === 'connecting' ? 'default' : 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                  fontFamily: "'DM Sans',sans-serif",
                  transition: 'background .2s',
                }}
              >
                {status === 'connecting' ? 'Connecting…' : '▶ Start Live Session'}
              </button>
            ) : (
              <button
                onClick={stopSession}
                style={{
                  padding: '10px',
                  background: 'rgba(248,113,113,.15)',
                  border: '1px solid rgba(248,113,113,.3)',
                  borderRadius: '8px',
                  color: '#F87171',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '13px',
                  fontFamily: "'DM Sans',sans-serif",
                }}
              >
                ■ End Session
              </button>
            )}

            {/* Suggested questions */}
            <div>
              <div
                style={{
                  fontSize: '9px',
                  fontFamily: "'JetBrains Mono',monospace",
                  color: 'rgba(255,255,255,.25)',
                  letterSpacing: '2px',
                  marginBottom: '8px',
                }}
              >
                SUGGESTED
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                {SUGGESTED_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      if (isActive) askQuestion(q);
                      else setQuestion(q);
                    }}
                    style={{
                      padding: '7px 10px',
                      background: 'rgba(255,255,255,.03)',
                      border: '1px solid rgba(255,255,255,.07)',
                      borderRadius: '6px',
                      color: 'rgba(255,255,255,.5)',
                      fontSize: '11px',
                      cursor: 'pointer',
                      fontFamily: "'DM Sans',sans-serif",
                      textAlign: 'left',
                      transition: 'all .15s',
                    }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom question input */}
            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {status === 'speaking' && (
                <button
                  onClick={interrupt}
                  style={{
                    padding: '6px',
                    background: 'rgba(251,191,36,.1)',
                    border: '1px solid rgba(251,191,36,.3)',
                    borderRadius: '6px',
                    color: '#FBBF24',
                    cursor: 'pointer',
                    fontSize: '11px',
                    fontFamily: "'DM Sans',sans-serif",
                  }}
                >
                  ⏸ Interrupt ARIA
                </button>
              )}
              <div
                style={{
                  display: 'flex',
                  gap: '6px',
                }}
              >
                <input
                  ref={inputRef}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAsk(); }}
                  placeholder={isActive ? 'Ask anything…' : 'Start session to ask'}
                  disabled={!isActive}
                  style={{
                    flex: 1,
                    padding: '9px 12px',
                    background: isActive ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.02)',
                    border: `1px solid ${isActive ? accent + '30' : 'rgba(255,255,255,.06)'}`,
                    borderRadius: '6px',
                    color: '#E2E8F0',
                    fontSize: '12px',
                    fontFamily: "'DM Sans',sans-serif",
                    outline: 'none',
                  }}
                />
                <button
                  onClick={handleAsk}
                  disabled={!isActive || !question.trim()}
                  style={{
                    padding: '9px 14px',
                    background: isActive && question.trim() ? accent : 'rgba(255,255,255,.04)',
                    border: 'none',
                    borderRadius: '6px',
                    color: isActive && question.trim() ? '#050508' : 'rgba(255,255,255,.2)',
                    cursor: isActive && question.trim() ? 'pointer' : 'default',
                    fontWeight: 700,
                    fontSize: '13px',
                    fontFamily: "'DM Sans',sans-serif",
                    transition: 'all .2s',
                  }}
                >
                  →
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
