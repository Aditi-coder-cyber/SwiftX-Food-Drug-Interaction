import React, { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles, Mic, MicOff, Volume2, Globe, AudioLines } from 'lucide-react';
import { api } from '../services/api';

type InteractionMode = 'chat' | 'voice';
type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error';

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

type Language = 'en' | 'hi';

/* ─── Constants ──────────────────────────────────────────────────────────── */

const SUGGESTED_QUESTIONS: Record<Language, string[]> = {
    en: [
        'Can I eat banana with metformin?',
        'Is grapefruit safe with statins?',
        'What foods to avoid with warfarin?',
    ],
    hi: [
        'क्या मैं मेटफॉर्मिन के साथ केला खा सकता हूँ?',
        'क्या स्टैटिन के साथ अंगूर सुरक्षित है?',
        'वारफारिन के साथ कौन से खाद्य पदार्थ से बचें?',
    ],
};

const UI_TEXT: Record<Language, {
    title: string;
    subtitle: string;
    welcome: string;
    welcomeSub: string;
    placeholder: string;
    thinking: string;
    listening: string;
}> = {
    en: {
        title: 'Ved',
        subtitle: 'Your Medicine Friend',
        welcome: "Hi! I'm Ved 💊",
        welcomeSub: 'Ask me anything about food-drug interactions',
        placeholder: 'Ask about food-drug interactions...',
        thinking: 'Thinking...',
        listening: 'Listening...',
    },
    hi: {
        title: 'Ved',
        subtitle: 'आपका दवा मित्र',
        welcome: 'नमस्ते! मैं Ved हूँ 💊',
        welcomeSub: 'खाने और दवाइयों से जुड़ा कोई भी सवाल पूछें',
        placeholder: 'अपना सवाल यहाँ लिखें...',
        thinking: 'सोच रहा हूँ...',
        listening: 'सुन रहा हूँ...',
    },
};

/* ─── Helpers ─────────────────────────────────────────────────────────────── */

function getSessionId(): string {
    let id = sessionStorage.getItem('safemed_chat_session');
    if (!id) {
        id = 'session-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8);
        sessionStorage.setItem('safemed_chat_session', id);
    }
    return id;
}

/** Pick the best available voice for a language */
function pickVoice(lang: Language): SpeechSynthesisVoice | null {
    const voices = speechSynthesis.getVoices();
    const locale = lang === 'hi' ? 'hi' : 'en';

    // Prefer Google voices (most natural), then any matching voice
    const google = voices.find((v) => v.lang.startsWith(locale) && v.name.toLowerCase().includes('google'));
    if (google) return google;

    const any = voices.find((v) => v.lang.startsWith(locale));
    return any || null;
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

/* ─── Component ──────────────────────────────────────────────────────────── */

export function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [mode, setMode] = useState<InteractionMode>('chat');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [language, setLanguage] = useState<Language>('en');
    const [isListening, setIsListening] = useState(false);
    const [speakingIdx, setSpeakingIdx] = useState<number | null>(null);

    // Keep language in a ref to avoid closure bugs in async callbacks
    const languageRef = useRef<Language>(language);
    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    // Voice agent state
    const [voiceState, setVoiceState] = useState<VoiceState>('idle');
    const [voiceTranscript, setVoiceTranscript] = useState('');
    const [voiceResponse, setVoiceResponse] = useState('');
    const [voiceHistory, setVoiceHistory] = useState<{ q: string; a: string }[]>([]);
    const voiceRecRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<any>(null);

    const txt = UI_TEXT[language];

    // Auto-scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Focus input on open
    useEffect(() => {
        if (isOpen) inputRef.current?.focus();
    }, [isOpen]);

    // Load voices (some browsers load async)
    useEffect(() => {
        speechSynthesis.getVoices();
        speechSynthesis.onvoiceschanged = () => speechSynthesis.getVoices();
    }, []);

    /* ── Speech Recognition ──────────────────────────────────────────── */

    const startListening = useCallback(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert(language === 'hi' ? 'आपका ब्राउज़र वॉइस इनपुट सपोर्ट नहीं करता।' : 'Your browser does not support voice input.');
            return;
        }

        // Stop if already listening
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
            recognitionRef.current = null;
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = languageRef.current === 'hi' ? 'hi-IN' : 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onstart = () => setIsListening(true);

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onerror = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognition.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
        };

        recognitionRef.current = recognition;
        recognition.start();
    }, [language]);

    /* ── Speech Synthesis ────────────────────────────────────────────── */

    const speak = useCallback((text: string, index: number) => {
        // Stop if currently speaking
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            setSpeakingIdx(null);
            return;
        }

        // Clean text for speech using robust helper
        const cleanText = cleanTextForSpeech(text);

        const utterance = new SpeechSynthesisUtterance(cleanText);
        const currentLang = languageRef.current;
        utterance.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';

        // Warmer, more natural settings
        if (currentLang === 'hi') {
            utterance.rate = 0.92;
            utterance.pitch = 1.05;
        } else {
            utterance.rate = 0.98;
            utterance.pitch = 1.0;
        }

        const voice = pickVoice(currentLang);
        if (voice) utterance.voice = voice;

        utterance.onstart = () => setSpeakingIdx(index);
        utterance.onend = () => setSpeakingIdx(null);
        utterance.onerror = () => setSpeakingIdx(null);

        speechSynthesis.speak(utterance);
    }, []); // Only the ref is used inside, so technically we can keep dependency array minimal

    /* ── Send Message ────────────────────────────────────────────────── */

    const sendMessage = async (text?: string) => {
        const msgText = text || input.trim();
        if (!msgText || isLoading) return;

        const userMsg: ChatMessage = { role: 'user', text: msgText };
        setMessages((prev) => [...prev, userMsg]);
        setInput('');
        setIsLoading(true);

        try {
            const currentLang = languageRef.current;
            const res = await api.sendChatMessage(getSessionId(), msgText, currentLang);
            const replyText =
                res.success && res.data
                    ? res.data.reply
                    : currentLang === 'hi'
                        ? 'मैं अभी जवाब देने में असमर्थ हूँ। कृपया किसी स्वास्थ्य पेशेवर से मार्गदर्शन लें।'
                        : "I'm unable to answer right now. Please consult a healthcare professional.";
            setMessages((prev) => [...prev, { role: 'ai', text: replyText }]);
        } catch {
            const currentLang = languageRef.current;
            setMessages((prev) => [
                ...prev,
                {
                    role: 'ai',
                    text: currentLang === 'hi'
                        ? 'मैं अभी जवाब देने में असमर्थ हूँ। कृपया किसी स्वास्थ्य पेशेवर से मार्गदर्शन लें।'
                        : "I'm unable to answer right now. Please consult a healthcare professional.",
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'en' ? 'hi' : 'en'));
        // Stop any ongoing speech
        speechSynthesis.cancel();
        setSpeakingIdx(null);
    };

    return (
        <>
            {/* ── Floating Action Button ─────────────────────────────────── */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    id="chatbot-fab"
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 8px 32px rgba(16,185,129,0.4)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        zIndex: 9999,
                    }}
                    onMouseEnter={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.1)';
                    }}
                    onMouseLeave={(e) => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
                    }}
                    aria-label="Open Ved"
                >
                    <MessageCircle size={28} />
                </button>
            )}

            {/* ── Chat Panel ─────────────────────────────────────────────── */}
            {isOpen && (
                <div
                    id="chatbot-panel"
                    style={{
                        position: 'fixed',
                        bottom: '24px',
                        right: '24px',
                        width: '420px',
                        maxWidth: 'calc(100vw - 32px)',
                        height: '600px',
                        maxHeight: 'calc(100vh - 48px)',
                        borderRadius: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        overflow: 'hidden',
                        background: 'rgba(255,255,255,0.97)',
                        backdropFilter: 'blur(20px)',
                        WebkitBackdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 24px 80px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.05)',
                        zIndex: 9999,
                    }}
                >
                    {/* ── Header ──────────────────────────────────────────── */}
                    <div
                        style={{
                            background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                            padding: '14px 18px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            color: '#fff',
                        }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                                style={{
                                    width: '38px',
                                    height: '38px',
                                    borderRadius: '50%',
                                    background: 'rgba(255,255,255,0.2)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '20px',
                                }}
                            >
                                💊
                            </div>
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '16px', letterSpacing: '0.3px' }}>
                                    {txt.title}
                                </div>
                                <div style={{ fontSize: '11px', opacity: 0.9 }}>{txt.subtitle}</div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {/* Language Toggle */}
                            <button
                                onClick={toggleLanguage}
                                title={language === 'en' ? 'Switch to Hindi / हिंदी में बदलें' : 'Switch to English / अंग्रेजी में बदलें'}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: '1px solid rgba(255,255,255,0.3)',
                                    color: '#fff',
                                    height: '32px',
                                    padding: '0 4px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    overflow: 'hidden'
                                }}
                            >
                                <div style={{
                                    padding: '0 8px',
                                    background: language === 'en' ? '#fff' : 'transparent',
                                    color: language === 'en' ? '#3b82f6' : '#fff',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}>EN</div>
                                <div style={{
                                    padding: '0 8px',
                                    background: language === 'hi' ? '#fff' : 'transparent',
                                    color: language === 'hi' ? '#3b82f6' : '#fff',
                                    height: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    transition: 'all 0.2s'
                                }}>HI</div>
                            </button>

                            {/* Close */}
                            <button
                                onClick={() => {
                                    setIsOpen(false);
                                    speechSynthesis.cancel();
                                }}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: '#fff',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'background 0.2s',
                                }}
                                onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.3)';
                                }}
                                onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.2)';
                                }}
                                aria-label="Close chat"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    {/* ── Mode Toggle Tabs ─────────────────────────────── */}
                    <div style={{
                        display: 'flex',
                        borderBottom: '1px solid #e5e7eb',
                        background: '#f8fafc',
                    }}>
                        <button
                            onClick={() => { setMode('chat'); speechSynthesis.cancel(); if (voiceRecRef.current) { voiceRecRef.current.abort(); voiceRecRef.current = null; } setVoiceState('idle'); }}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                border: 'none',
                                background: mode === 'chat' ? '#fff' : 'transparent',
                                color: mode === 'chat' ? '#059669' : '#94a3b8',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderBottom: mode === 'chat' ? '2px solid #059669' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <MessageCircle size={14} />
                            {language === 'hi' ? 'चैट' : 'Chat'}
                        </button>
                        <button
                            onClick={() => setMode('voice')}
                            style={{
                                flex: 1,
                                padding: '8px 0',
                                border: 'none',
                                background: mode === 'voice' ? '#fff' : 'transparent',
                                color: mode === 'voice' ? '#8b5cf6' : '#94a3b8',
                                fontWeight: 600,
                                fontSize: '12px',
                                cursor: 'pointer',
                                borderBottom: mode === 'voice' ? '2px solid #8b5cf6' : '2px solid transparent',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '5px',
                                transition: 'all 0.2s',
                            }}
                        >
                            <AudioLines size={14} />
                            {language === 'hi' ? 'आवाज़' : 'Voice'}
                        </button>
                    </div>

                    {/* ── VOICE MODE ──────────────────────────────────── */}
                    {mode === 'voice' &&
                        (() => {
                            const vsColors: Record<VoiceState, { ring: string; icon: string }> = {
                                idle: { ring: 'rgba(59,130,246,0.1)', icon: '#3b82f6' },
                                listening: { ring: 'rgba(239,68,68,0.1)', icon: '#ef4444' },
                                thinking: { ring: 'rgba(16,185,129,0.1)', icon: '#10b981' },
                                speaking: { ring: 'rgba(139,92,246,0.1)', icon: '#8b5cf6' },
                                error: { ring: 'rgba(239,68,68,0.1)', icon: '#ef4444' },
                            };
                            const vc = vsColors[voiceState];
                            const vsText: Record<VoiceState, string> = {
                                idle: language === 'hi' ? 'माइक दबाकर पूछें' : 'Tap mic to ask anything',
                                listening: language === 'hi' ? 'सुन रहा हूँ...' : 'Listening...',
                                thinking: language === 'hi' ? 'सोच रहा हूँ...' : 'Thinking...',
                                speaking: language === 'hi' ? 'बोल रहा हूँ...' : 'Speaking...',
                                error: language === 'hi' ? 'फिर से कोशिश करें' : 'Try again',
                            };

                            const pickVoice = (lang: Language): SpeechSynthesisVoice | null => {
                                const voices = speechSynthesis.getVoices();
                                const loc = lang === 'hi' ? 'hi' : 'en';
                                return voices.find((v) => v.lang.startsWith(loc) && v.name.toLowerCase().includes('google'))
                                    || voices.find((v) => v.lang.startsWith(loc)) || null;
                            };

                            const speakVoice = (text: string): Promise<void> =>
                                new Promise((resolve) => {
                                    const cleanText = cleanTextForSpeech(text);
                                    const u = new SpeechSynthesisUtterance(cleanText);
                                    const currentLang = languageRef.current;
                                    u.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
                                    if (currentLang === 'hi') { u.rate = 0.9; u.pitch = 1.05; } else { u.rate = 0.95; u.pitch = 1.0; }
                                    const v = pickVoice(currentLang); if (v) u.voice = v;
                                    u.onend = () => resolve(); u.onerror = () => resolve();
                                    speechSynthesis.speak(u);
                                });

                            const startVoice = () => {
                                const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
                                if (!SR) { alert(language === 'hi' ? 'वॉइस सपोर्ट नहीं है' : 'Voice not supported'); return; }
                                if (voiceRecRef.current) { voiceRecRef.current.abort(); voiceRecRef.current = null; setVoiceState('idle'); return; }
                                setVoiceTranscript(''); setVoiceResponse(''); setVoiceState('listening');
                                const rec = new SR();
                                const currentLang = languageRef.current;
                                rec.lang = currentLang === 'hi' ? 'hi-IN' : 'en-US';
                                rec.continuous = false; rec.interimResults = true;
                                rec.onresult = (e: any) => {
                                    let f = '', im = '';
                                    for (let i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) f += e.results[i][0].transcript; else im += e.results[i][0].transcript; }
                                    setVoiceTranscript(f || im);
                                };
                                rec.onend = () => {
                                    voiceRecRef.current = null;
                                    setVoiceTranscript((prevTranscript) => {
                                        const t = prevTranscript.trim();
                                        if (!t) { setVoiceState('idle'); return prevTranscript; }
                                        setVoiceState('thinking');
                                        (async () => {
                                            try {
                                                const currentLangAsync = languageRef.current;
                                                const sessionKey = `safemed_voice_session_${currentLangAsync}`;
                                                const sid = sessionStorage.getItem(sessionKey) || (() => { const id = 'v-' + currentLangAsync + '-' + Date.now(); sessionStorage.setItem(sessionKey, id); return id; })();
                                                const res = await api.sendChatMessage(sid, t, currentLangAsync);
                                                const reply = res.success && res.data ? res.data.reply : (currentLangAsync === 'hi' ? 'जवाब नहीं मिला।' : 'No response.');
                                                setVoiceResponse(reply);
                                                setVoiceHistory((h) => [...h, { q: t, a: reply }]);
                                                setVoiceState('speaking');
                                                await speakVoice(reply);
                                                setVoiceState('idle');
                                            } catch (err) {
                                                console.error('Voice message error:', err);
                                                const currentLangErr = languageRef.current;
                                                setVoiceResponse(currentLangErr === 'hi' ? 'गड़बड़ हो गई।' : 'Error.');
                                                setVoiceState('error');
                                                setTimeout(() => setVoiceState('idle'), 2000);
                                            }
                                        })();
                                        return prevTranscript;
                                    });
                                };
                                rec.onerror = () => { voiceRecRef.current = null; setVoiceState('error'); setTimeout(() => setVoiceState('idle'), 2000); };
                                voiceRecRef.current = rec; rec.start();
                            };

                            return (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '24px 16px', background: '#fafbff' }}>
                                    {/* Animated mic */}
                                    <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                                        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: vc.ring, animation: (voiceState === 'listening' || voiceState === 'speaking') ? 'vaPulse 1.5s ease-in-out infinite' : 'none' }} />
                                        <div style={{ position: 'absolute', inset: '14px', borderRadius: '50%', background: vc.ring, animation: (voiceState === 'listening' || voiceState === 'speaking') ? 'vaPulse 1.5s ease-in-out 0.2s infinite' : 'none' }} />
                                        <button
                                            onClick={startVoice}
                                            disabled={voiceState === 'thinking' || voiceState === 'speaking'}
                                            style={{
                                                position: 'absolute', inset: '28px', borderRadius: '50%', border: 'none',
                                                background: `linear-gradient(135deg, ${vc.icon}, ${vc.icon}cc)`,
                                                color: '#fff', cursor: (voiceState === 'thinking' || voiceState === 'speaking') ? 'default' : 'pointer',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                boxShadow: `0 0 24px ${vc.icon}30`, transition: 'all 0.3s',
                                            }}
                                        >
                                            {voiceState === 'listening' ? <MicOff size={28} /> : voiceState === 'speaking' ? <Volume2 size={28} /> : voiceState === 'thinking' ? (
                                                <div style={{ width: '28px', height: '28px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                                            ) : <Mic size={28} />}
                                        </button>
                                    </div>
                                    <p style={{ color: vc.icon, fontSize: '13px', fontWeight: 600, margin: 0 }}>{vsText[voiceState]}</p>
                                    {voiceTranscript && (voiceState === 'listening' || voiceState === 'thinking') && (
                                        <p style={{ color: '#64748b', fontSize: '13px', margin: 0, fontStyle: 'italic', textAlign: 'center', padding: '0 8px' }}>"{voiceTranscript}"</p>
                                    )}
                                    {voiceResponse && (voiceState === 'speaking' || voiceState === 'idle') && (
                                        <div style={{ background: '#fff', borderRadius: '12px', padding: '12px', maxHeight: '100px', overflowY: 'auto', width: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                                            <p style={{ color: '#334155', fontSize: '13px', lineHeight: 1.5, margin: 0 }}>{voiceResponse}</p>
                                        </div>
                                    )}
                                    {voiceHistory.length > 0 && (
                                        <div style={{ width: '100%', maxHeight: '80px', overflowY: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '8px' }}>
                                            {voiceHistory.slice(-2).map((h, i) => (
                                                <div key={i} style={{ marginBottom: '4px' }}>
                                                    <p style={{ color: '#94a3b8', fontSize: '11px', margin: 0 }}>🎤 {h.q}</p>
                                                    <p style={{ color: '#64748b', fontSize: '11px', margin: 0 }}>💊 {h.a.slice(0, 60)}{h.a.length > 60 ? '…' : ''}</p>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })()}

                    {/* ── CHAT MODE: Messages ────────────────────────────── */}
                    {mode === 'chat' && (
                        <>
                            <div
                                style={{
                                    flex: 1,
                                    overflowY: 'auto',
                                    padding: '16px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                }}
                            >
                                {/* Welcome */}
                                {messages.length === 0 && (
                                    <div style={{ textAlign: 'center', padding: '20px 10px' }}>
                                        <div
                                            style={{
                                                width: '64px',
                                                height: '64px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #ecfdf5, #eff6ff)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                margin: '0 auto 12px',
                                                fontSize: '32px',
                                            }}
                                        >
                                            💊
                                        </div>
                                        <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#1e293b', margin: '0 0 4px' }}>
                                            {txt.welcome}
                                        </h3>
                                        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                                            {txt.welcomeSub}
                                        </p>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {SUGGESTED_QUESTIONS[language].map((q, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => sendMessage(q)}
                                                    style={{
                                                        background: '#f8fafc',
                                                        border: '1px solid #e2e8f0',
                                                        borderRadius: '12px',
                                                        padding: '10px 14px',
                                                        cursor: 'pointer',
                                                        fontSize: '13px',
                                                        color: '#475569',
                                                        textAlign: 'left',
                                                        transition: 'all 0.2s',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#ecfdf5';
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#6ee7b7';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (e.currentTarget as HTMLButtonElement).style.background = '#f8fafc';
                                                        (e.currentTarget as HTMLButtonElement).style.borderColor = '#e2e8f0';
                                                    }}
                                                >
                                                    💬 {q}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Chat bubbles */}
                                {messages.map((msg, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: '8px',
                                            flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                background:
                                                    msg.role === 'user'
                                                        ? '#3b82f6'
                                                        : 'linear-gradient(135deg, #10b981, #3b82f6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {msg.role === 'user' ? (
                                                <User size={16} style={{ color: '#fff' }} />
                                            ) : (
                                                <Bot size={16} style={{ color: '#fff' }} />
                                            )}
                                        </div>
                                        <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                            <div
                                                style={{
                                                    padding: '10px 14px',
                                                    borderRadius:
                                                        msg.role === 'user'
                                                            ? '16px 16px 4px 16px'
                                                            : '16px 16px 16px 4px',
                                                    background: msg.role === 'user' ? '#3b82f6' : '#f1f5f9',
                                                    color: msg.role === 'user' ? '#fff' : '#1e293b',
                                                    fontSize: '14px',
                                                    lineHeight: '1.6',
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word',
                                                }}
                                            >
                                                {msg.text}
                                            </div>
                                            {/* Speaker button for AI messages */}
                                            {msg.role === 'ai' && (
                                                <button
                                                    onClick={() => speak(msg.text, i)}
                                                    title={language === 'hi' ? 'सुनें' : 'Listen'}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        cursor: 'pointer',
                                                        padding: '2px 6px',
                                                        borderRadius: '8px',
                                                        color: speakingIdx === i ? '#10b981' : '#94a3b8',
                                                        fontSize: '12px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '4px',
                                                        transition: 'color 0.2s',
                                                        alignSelf: 'flex-start',
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (speakingIdx !== i) (e.currentTarget as HTMLButtonElement).style.color = '#64748b';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (speakingIdx !== i) (e.currentTarget as HTMLButtonElement).style.color = '#94a3b8';
                                                    }}
                                                >
                                                    <Volume2
                                                        size={14}
                                                        style={speakingIdx === i ? { animation: 'pulseSpeak 1s ease-in-out infinite' } : {}}
                                                    />
                                                    {speakingIdx === i
                                                        ? (language === 'hi' ? 'बोल रहा है...' : 'Speaking...')
                                                        : (language === 'hi' ? '🔊 सुनें' : '🔊 Listen')}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {/* Typing indicator */}
                                {isLoading && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div
                                            style={{
                                                width: '30px',
                                                height: '30px',
                                                borderRadius: '50%',
                                                background: 'linear-gradient(135deg, #10b981, #3b82f6)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            <Bot size={16} style={{ color: '#fff' }} />
                                        </div>
                                        <div
                                            style={{
                                                padding: '10px 14px',
                                                borderRadius: '16px 16px 16px 4px',
                                                background: '#f1f5f9',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '6px',
                                                color: '#64748b',
                                                fontSize: '13px',
                                            }}
                                        >
                                            <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
                                            {txt.thinking}
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* ── Input Area ──────────────────────────────────────── */}
                            <div
                                style={{
                                    padding: '12px 16px',
                                    borderTop: '1px solid #e2e8f0',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    background: '#fff',
                                }}
                            >
                                {/* Mic button */}
                                <button
                                    onClick={startListening}
                                    title={language === 'hi' ? 'बोलकर पूछें' : 'Voice input'}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background: isListening ? '#ef4444' : '#f1f5f9',
                                        color: isListening ? '#fff' : '#64748b',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        flexShrink: 0,
                                        animation: isListening ? 'pulseMic 1.5s ease-in-out infinite' : 'none',
                                    }}
                                    aria-label="Voice input"
                                >
                                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                                </button>

                                {/* Text input */}
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    placeholder={isListening ? txt.listening : txt.placeholder}
                                    disabled={isLoading}
                                    style={{
                                        flex: 1,
                                        padding: '10px 14px',
                                        borderRadius: '12px',
                                        border: `1px solid ${isListening ? '#fca5a5' : '#e2e8f0'}`,
                                        outline: 'none',
                                        fontSize: '14px',
                                        background: isListening ? '#fef2f2' : '#f8fafc',
                                        transition: 'border-color 0.2s, box-shadow 0.2s, background 0.2s',
                                    }}
                                    onFocus={(e) => {
                                        if (!isListening) {
                                            e.currentTarget.style.borderColor = '#6ee7b7';
                                            e.currentTarget.style.boxShadow = '0 0 0 3px rgba(16,185,129,0.1)';
                                        }
                                    }}
                                    onBlur={(e) => {
                                        if (!isListening) {
                                            e.currentTarget.style.borderColor = '#e2e8f0';
                                            e.currentTarget.style.boxShadow = 'none';
                                        }
                                    }}
                                />

                                {/* Send button */}
                                <button
                                    onClick={() => sendMessage()}
                                    disabled={!input.trim() || isLoading}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        background:
                                            input.trim() && !isLoading
                                                ? 'linear-gradient(135deg, #10b981, #3b82f6)'
                                                : '#e2e8f0',
                                        color: input.trim() && !isLoading ? '#fff' : '#94a3b8',
                                        cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.2s',
                                        flexShrink: 0,
                                    }}
                                    aria-label="Send message"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ── Keyframe Animations ────────────────────────────────────── */}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to   { transform: rotate(360deg); }
                }
                @keyframes pulseMic {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.5); }
                    70% { box-shadow: 0 0 0 12px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                @keyframes pulseSpeak {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.4; }
                }
                @keyframes vaPulse {
                    0%   { transform: scale(1);   opacity: 0.6; }
                    50%  { transform: scale(1.12); opacity: 0.25; }
                    100% { transform: scale(1);   opacity: 0.6; }
                }
            `}</style>
        </>
    );
}

export default Chatbot;
