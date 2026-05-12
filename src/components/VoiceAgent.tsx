import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Globe, Volume2 } from 'lucide-react';
import { api } from '../services/api';

type Language = 'en' | 'hi';
type AgentState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

const UI: Record<Language, {
    title: string;
    idle: string;
    listening: string;
    thinking: string;
    speaking: string;
    error: string;
    switchLabel: string;
}> = {
    en: {
        title: 'Ved Voice',
        idle: 'Tap mic to ask anything',
        listening: "Listening...",
        thinking: 'Thinking...',
        speaking: 'Speaking...',
        error: 'Try again',
        switchLabel: 'HI',
    },
    hi: {
        title: 'Ved आवाज़',
        idle: 'माइक दबाकर पूछें',
        listening: 'सुन रहा हूँ...',
        thinking: 'सोच रहा हूँ...',
        speaking: 'बोल रहा हूँ...',
        error: 'फिर से कोशिश करें',
        switchLabel: 'EN',
    },
};

function getSessionId(): string {
    let id = sessionStorage.getItem('safemed_voice_session');
    if (!id) {
        id = 'voice-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('safemed_voice_session', id);
    }
    return id;
}

function pickVoice(lang: Language): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    const locale = lang === 'hi' ? 'hi' : 'en';
    const google = voices.find((v) => v.lang.startsWith(locale) && v.name.toLowerCase().includes('google'));
    if (google) return google;
    return voices.find((v) => v.lang.startsWith(locale)) || null;
}

/** Robustly clean text for speech synthesis */
function cleanTextForSpeech(text: string): string {
    return text
        .replace(/[*_~`#]/g, '') // Remove all common Markdown artifacts
        .replace(/[💊🎤🔊]/g, '') // Remove specific decorative emojis
        .replace(/^[-+]\s+/gm, '') // Remove leading list markers
        .replace(/\s+/g, ' ')      // Normalize whitespace
        .trim();
}

export function VoiceAgent() {
    const [isOpen, setIsOpen] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const [state, setState] = useState<AgentState>('idle');
    const [transcript, setTranscript] = useState('');
    const [response, setResponse] = useState('');
    const [history, setHistory] = useState<{ q: string; a: string }[]>([]);
    const recognitionRef = useRef<any>(null);

    // Keep language in a ref to avoid closure bugs in async callbacks
    const languageRef = useRef<Language>(language);
    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    const txt = UI[language];

    useEffect(() => {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
        return () => {
            speechSynthesis.cancel();
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    const speak = useCallback(
        (text: string): Promise<void> =>
            new Promise((resolve) => {
                // Clean text for speech using robust helper
                const cleanText = cleanTextForSpeech(text);

                const utterance = new SpeechSynthesisUtterance(cleanText);
                const currentLang = languageRef.current;
                utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
                if (currentLang === 'hi') { utterance.rate = 0.9; utterance.pitch = 1.05; }
                else { utterance.rate = 0.95; utterance.pitch = 1.0; }
                const voice = pickVoice(currentLang);
                if (voice) utterance.voice = voice;
                utterance.onend = () => resolve();
                utterance.onerror = () => resolve();
                speechSynthesis.speak(utterance);
            }),
        []
    );

    const startConversation = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(language === 'hi' ? 'वॉइस सपोर्ट नहीं है।' : 'Voice not supported.');
            return;
        }
        if (recognitionRef.current) {
            recognitionRef.current.abort();
            recognitionRef.current = null;
            setState('idle');
            return;
        }

        setTranscript('');
        setResponse('');
        setState('listening');

        const recognition = new SpeechRecognition();
        const currentLang = languageRef.current;
        recognition.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
            let interim = '', final = '';
            for (let i = 0; i < event.results.length; i++) {
                if (event.results[i].isFinal) final += event.results[i][0].transcript;
                else interim += event.results[i][0].transcript;
            }
            setTranscript(final || interim);
        };

        recognition.onend = () => {
            recognitionRef.current = null;
            setTranscript((prev) => {
                const finalText = prev.trim();
                if (!finalText) { setState('idle'); return prev; }
                setState('thinking');
                (async () => {
                    try {
                        const currentLangAsync = languageRef.current;
                        const msgText = finalText;
                        const res = await api.sendChatMessage(getSessionId(), msgText, currentLangAsync);
                        const replyText = res.success && res.data ? res.data.reply
                            : currentLangAsync === 'hi' ? 'जवाब नहीं मिला।' : 'No response.';
                        setResponse(replyText);
                        setHistory((h) => [...h, { q: msgText, a: replyText }]);
                        setState('speaking');
                        await speak(replyText);
                        setState('idle');
                    } catch {
                        const currentLangErr = languageRef.current;
                        setResponse(currentLangErr === 'hi' ? 'गड़बड़ हो गई।' : 'Something went wrong.');
                        setState('error');
                        setTimeout(() => setState('idle'), 2000);
                    }
                })();
                return prev;
            });
        };

        recognition.onerror = () => {
            recognitionRef.current = null;
            setState('error');
            setTimeout(() => setState('idle'), 2000);
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [speak]);

    const stateColors: Record<AgentState, { ring: string; icon: string; glow: string }> = {
        idle: { ring: 'rgba(16,185,129,0.12)', icon: '#10b981', glow: 'rgba(16,185,129,0.3)' },
        listening: { ring: 'rgba(239,68,68,0.15)', icon: '#ef4444', glow: 'rgba(239,68,68,0.4)' },
        thinking: { ring: 'rgba(59,130,246,0.15)', icon: '#3b82f6', glow: 'rgba(59,130,246,0.3)' },
        speaking: { ring: 'rgba(16,185,129,0.18)', icon: '#10b981', glow: 'rgba(16,185,129,0.4)' },
        error: { ring: 'rgba(239,68,68,0.1)', icon: '#ef4444', glow: 'rgba(239,68,68,0.2)' },
    };
    const colors = stateColors[state];

    return (
        <>
            {/* ── FAB ─────────────────────────────────────────────── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '96px',
                        width: '56px',
                        height: '56px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 28px rgba(139,92,246,0.45)',
                        transition: 'transform 0.2s',
                        zIndex: 9998,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
                    aria-label="Open Voice Agent"
                >
                    <Mic size={24} />
                </button>
            )}

            {/* ── Compact Panel ───────────────────────────────────── */}
            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '96px',
                        width: '340px',
                        maxWidth: 'calc(100vw - 120px)',
                        borderRadius: '20px',
                        overflow: 'hidden',
                        background: '#111827',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.08)',
                        zIndex: 9998,
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    {/* Header */}
                    <div
                        style={{
                            padding: '12px 16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: '1px solid rgba(255,255,255,0.08)',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '18px' }}>💊</span>
                            <span style={{ color: '#fff', fontWeight: 700, fontSize: '14px' }}>{txt.title}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                                onClick={() => setLanguage((l) => (l === 'en' ? 'hi' : 'en'))}
                                title={language === 'en' ? 'Switch to Hindi / हिंदी में बदलें' : 'Switch to English / अंग्रेजी में बदलें'}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: '1px solid rgba(255,255,255,0.2)',
                                    color: '#fff',
                                    height: '26px',
                                    borderRadius: '6px',
                                    cursor: 'pointer',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    display: 'flex',
                                    alignItems: 'center',
                                    overflow: 'hidden',
                                    padding: '0 2px'
                                }}
                            >
                                <div style={{
                                    padding: '0 6px',
                                    background: language === 'en' ? '#fff' : 'transparent',
                                    color: language === 'en' ? '#111827' : '#fff',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}>EN</div>
                                <div style={{
                                    padding: '0 6px',
                                    background: language === 'hi' ? '#fff' : 'transparent',
                                    color: language === 'hi' ? '#111827' : '#fff',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}>HI</div>
                            </button>
                            <button
                                onClick={() => {
                                    speechSynthesis.cancel();
                                    if (recognitionRef.current) recognitionRef.current.abort();
                                    setIsOpen(false);
                                    setState('idle');
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.1)',
                                    border: 'none',
                                    color: '#fff',
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                                aria-label="Close"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '24px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        {/* Animated mic */}
                        <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                            <div style={{
                                position: 'absolute', inset: 0, borderRadius: '50%',
                                background: colors.ring,
                                animation: (state === 'listening' || state === 'speaking') ? 'vaPulse 1.5s ease-in-out infinite' : 'none',
                            }} />
                            <div style={{
                                position: 'absolute', inset: '14px', borderRadius: '50%',
                                background: colors.ring,
                                animation: (state === 'listening' || state === 'speaking') ? 'vaPulse 1.5s ease-in-out 0.2s infinite' : 'none',
                            }} />
                            <button
                                onClick={startConversation}
                                disabled={state === 'thinking' || state === 'speaking'}
                                style={{
                                    position: 'absolute', inset: '28px', borderRadius: '50%',
                                    border: 'none',
                                    background: `linear-gradient(135deg, ${colors.icon}, ${colors.icon}cc)`,
                                    color: '#fff',
                                    cursor: (state === 'thinking' || state === 'speaking') ? 'default' : 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: `0 0 24px ${colors.glow}`,
                                    transition: 'all 0.3s',
                                }}
                            >
                                {state === 'listening' ? <MicOff size={28} />
                                    : state === 'speaking' ? <Volume2 size={28} />
                                        : state === 'thinking' ? (
                                            <div style={{
                                                width: '28px', height: '28px',
                                                border: '3px solid rgba(255,255,255,0.3)',
                                                borderTopColor: '#fff', borderRadius: '50%',
                                                animation: 'vaSpin 0.8s linear infinite',
                                            }} />
                                        ) : <Mic size={28} />}
                            </button>
                        </div>

                        {/* Status */}
                        <p style={{ color: colors.icon, fontSize: '13px', fontWeight: 600, margin: 0, transition: 'color 0.3s' }}>
                            {UI[language][state]}
                        </p>

                        {/* Transcript */}
                        {transcript && (state === 'listening' || state === 'thinking') && (
                            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '13px', margin: 0, fontStyle: 'italic', textAlign: 'center' }}>
                                "{transcript}"
                            </p>
                        )}

                        {/* Response */}
                        {response && (state === 'speaking' || state === 'idle') && (
                            <p style={{
                                color: 'rgba(255,255,255,0.8)', fontSize: '13px', lineHeight: 1.5,
                                margin: 0, textAlign: 'center', maxHeight: '80px', overflowY: 'auto',
                                padding: '0 8px',
                            }}>
                                {response}
                            </p>
                        )}
                    </div>

                    {/* History (last 2) */}
                    {history.length > 0 && (
                        <div style={{
                            padding: '8px 16px 14px',
                            borderTop: '1px solid rgba(255,255,255,0.06)',
                            maxHeight: '100px', overflowY: 'auto',
                        }}>
                            {history.slice(-2).map((h, i) => (
                                <div key={i} style={{ marginBottom: '6px' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: '0 0 1px' }}>
                                        🎤 {h.q}
                                    </p>
                                    <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: '11px', margin: 0 }}>
                                        💊 {h.a.slice(0, 80)}{h.a.length > 80 ? '...' : ''}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <style>{`
                @keyframes vaPulse {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    50%  { transform: scale(1.12); opacity: 0.25; }
                    100% { transform: scale(1);   opacity: 0.6; }
                }
                @keyframes vaSpin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}

export default VoiceAgent;
