import React, { useState } from 'react';
import { Shield, Mail, Smartphone, Lock, AlertCircle, CheckCircle, X, KeyRound, Copy, Check } from 'lucide-react';
import { api } from '../services/api';

type SetupStep = 'choose' | 'email-verify' | 'totp-scan' | 'totp-verify' | 'disable';

export function TwoFactorSetup({ onClose }: { onClose: () => void }) {
    const [step, setStep] = useState<SetupStep>('choose');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // 2FA status
    const [enabled, setEnabled] = useState(false);
    const [currentMethod, setCurrentMethod] = useState<string | null>(null);
    const [statusLoaded, setStatusLoaded] = useState(false);

    // TOTP setup
    const [qrCode, setQrCode] = useState('');
    const [manualKey, setManualKey] = useState('');
    const [copied, setCopied] = useState(false);

    // Verification
    const [code, setCode] = useState('');
    const [disablePassword, setDisablePassword] = useState('');

    // Load status on mount
    React.useEffect(() => {
        loadStatus();
    }, []);

    const loadStatus = async () => {
        const res = await api.get2FAStatus();
        if (res.success && res.data) {
            setEnabled(res.data.enabled);
            setCurrentMethod(res.data.method);
        }
        setStatusLoaded(true);
    };

    const handleSetupEmail = async () => {
        setIsLoading(true);
        setError(null);
        const res = await api.setup2FAEmail();
        setIsLoading(false);

        if (res.success) {
            setStep('email-verify');
        } else {
            setError(res.error?.message || 'Failed to send email OTP');
        }
    };

    const handleSetupTOTP = async () => {
        setIsLoading(true);
        setError(null);
        const res = await api.setup2FATOTP();
        setIsLoading(false);

        if (res.success && res.data) {
            setQrCode(res.data.qrCode);
            setManualKey(res.data.manualKey);
            setStep('totp-scan');
        } else {
            setError(res.error?.message || 'Failed to generate QR code');
        }
    };

    const handleVerify = async (method: 'email' | 'totp') => {
        if (code.length !== 6) {
            setError('Please enter a 6-digit code');
            return;
        }
        setIsLoading(true);
        setError(null);
        const res = await api.verifySetup2FA(code, method);
        setIsLoading(false);

        if (res.success) {
            setSuccess('Two-factor authentication has been enabled! 🎉');
            setEnabled(true);
            setCurrentMethod(method);
            setCode('');
            setTimeout(() => onClose(), 2000);
        } else {
            setError(res.error?.message || 'Invalid code');
        }
    };

    const handleDisable = async () => {
        if (!disablePassword) {
            setError('Please enter your password');
            return;
        }
        setIsLoading(true);
        setError(null);
        const res = await api.disable2FA(disablePassword);
        setIsLoading(false);

        if (res.success) {
            setSuccess('Two-factor authentication has been disabled.');
            setEnabled(false);
            setCurrentMethod(null);
            setDisablePassword('');
            setTimeout(() => {
                setSuccess(null);
                setStep('choose');
            }, 2000);
        } else {
            setError(res.error?.message || 'Failed to disable 2FA');
        }
    };

    const handleCopyKey = () => {
        navigator.clipboard.writeText(manualKey);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!statusLoaded) {
        return (
            <div style={overlayStyle}>
                <div style={modalStyle}>
                    <p style={{ textAlign: 'center', color: '#64748b' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={overlayStyle}>
            <div style={modalStyle}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                            width: 40, height: 40, borderRadius: '50%',
                            background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Shield className="size-5 text-white" />
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#1e293b' }}>Two-Factor Authentication</h2>
                            <p style={{ margin: 0, fontSize: 13, color: '#64748b' }}>
                                {enabled ? 'Manage your 2FA settings' : 'Add an extra layer of security'}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} style={closeButtonStyle}>
                        <X className="size-5" />
                    </button>
                </div>

                {/* Success */}
                {success && (
                    <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <CheckCircle className="size-5 text-green-600" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14, color: '#15803d' }}>{success}</p>
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                        <AlertCircle className="size-5 text-red-600" style={{ flexShrink: 0 }} />
                        <p style={{ margin: 0, fontSize: 14, color: '#dc2626' }}>{error}</p>
                    </div>
                )}

                {/* ── Choose Method ─────────────────────────────────── */}
                {step === 'choose' && (
                    <div>
                        {/* Current status */}
                        {enabled && (
                            <div style={{
                                background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 12,
                                padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <CheckCircle className="size-5 text-green-600" />
                                    <div>
                                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#15803d' }}>2FA is enabled</p>
                                        <p style={{ margin: 0, fontSize: 12, color: '#16a34a' }}>
                                            Method: {currentMethod === 'email' ? 'Email OTP' : 'Authenticator App'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setStep('disable')}
                                    style={{
                                        padding: '6px 14px', borderRadius: 8, border: '1px solid #fecaca',
                                        background: '#fff', color: '#dc2626', fontSize: 13, fontWeight: 600,
                                        cursor: 'pointer',
                                    }}
                                >
                                    Disable
                                </button>
                            </div>
                        )}

                        {!enabled && (
                            <>
                                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                                    Choose your preferred verification method:
                                </p>

                                {/* Email Option */}
                                <button onClick={handleSetupEmail} disabled={isLoading} style={methodCardStyle}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Mail className="size-6 text-blue-600" />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>Email OTP</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Receive a code via email each time you log in</p>
                                        </div>
                                    </div>
                                </button>

                                {/* TOTP Option */}
                                <button onClick={handleSetupTOTP} disabled={isLoading} style={{ ...methodCardStyle, marginTop: 12 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                        <div style={{
                                            width: 48, height: 48, borderRadius: 12,
                                            background: '#f5f3ff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        }}>
                                            <Smartphone className="size-6 text-purple-600" />
                                        </div>
                                        <div style={{ textAlign: 'left' }}>
                                            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: '#1e293b' }}>Authenticator App</p>
                                            <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>Use Google Authenticator, Authy, or similar</p>
                                        </div>
                                    </div>
                                </button>
                            </>
                        )}
                    </div>
                )}

                {/* ── Email Verify ──────────────────────────────────── */}
                {step === 'email-verify' && (
                    <div>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                            We've sent a 6-digit code to your email. Enter it below to enable email 2FA:
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            style={codeInputStyle}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button onClick={() => { setStep('choose'); setError(null); setCode(''); }} style={secondaryBtnStyle}>
                                Cancel
                            </button>
                            <button onClick={() => handleVerify('email')} disabled={isLoading} style={primaryBtnStyle}>
                                {isLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── TOTP Scan QR ──────────────────────────────────── */}
                {step === 'totp-scan' && (
                    <div>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                            Scan this QR code with your authenticator app:
                        </p>
                        {qrCode && (
                            <div style={{ textAlign: 'center', marginBottom: 16 }}>
                                <img src={qrCode} alt="TOTP QR Code" style={{ width: 200, height: 200, borderRadius: 12, border: '4px solid #e5e7eb' }} />
                            </div>
                        )}
                        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>
                            Or enter this key manually:
                        </p>
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8, background: '#f8fafc',
                            border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', marginBottom: 16,
                        }}>
                            <code style={{ flex: 1, fontSize: 13, fontWeight: 600, color: '#1e293b', letterSpacing: 1, wordBreak: 'break-all' }}>
                                {manualKey}
                            </code>
                            <button onClick={handleCopyKey} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                                {copied ? <Check className="size-4 text-green-600" /> : <Copy className="size-4 text-gray-400" />}
                            </button>
                        </div>
                        <button onClick={() => setStep('totp-verify')} style={primaryBtnStyle}>
                            Next — Verify Code
                        </button>
                    </div>
                )}

                {/* ── TOTP Verify ──────────────────────────────────── */}
                {step === 'totp-verify' && (
                    <div>
                        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
                            Enter the 6-digit code from your authenticator app:
                        </p>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                            placeholder="000000"
                            style={codeInputStyle}
                        />
                        <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                            <button onClick={() => { setStep('totp-scan'); setError(null); setCode(''); }} style={secondaryBtnStyle}>
                                Back
                            </button>
                            <button onClick={() => handleVerify('totp')} disabled={isLoading} style={primaryBtnStyle}>
                                {isLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Disable 2FA ──────────────────────────────────── */}
                {step === 'disable' && (
                    <div>
                        <div style={{
                            background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12,
                            padding: 14, marginBottom: 16,
                        }}>
                            <p style={{ margin: 0, fontSize: 13, color: '#dc2626', fontWeight: 500 }}>
                                ⚠️ Disabling 2FA will make your account less secure. Please confirm with your password.
                            </p>
                        </div>
                        <div style={{ position: 'relative', marginBottom: 16 }}>
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-5 text-gray-400" />
                            <input
                                type="password"
                                value={disablePassword}
                                onChange={(e) => setDisablePassword(e.target.value)}
                                placeholder="Enter your password"
                                style={{ ...codeInputStyle, textAlign: 'left', paddingLeft: 40, letterSpacing: 'normal' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10 }}>
                            <button onClick={() => { setStep('choose'); setError(null); setDisablePassword(''); }} style={secondaryBtnStyle}>
                                Cancel
                            </button>
                            <button onClick={handleDisable} disabled={isLoading} style={{ ...primaryBtnStyle, background: '#ef4444' }}>
                                {isLoading ? 'Disabling...' : 'Disable 2FA'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─── Shared Styles ──────────────────────────────────────────────── */

const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 16,
};

const modalStyle: React.CSSProperties = {
    background: '#fff', borderRadius: 16, padding: 28,
    width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
    maxHeight: '90vh', overflowY: 'auto',
};

const closeButtonStyle: React.CSSProperties = {
    background: 'none', border: 'none', cursor: 'pointer',
    color: '#94a3b8', padding: 4,
};

const methodCardStyle: React.CSSProperties = {
    width: '100%', padding: 16, borderRadius: 12,
    border: '2px solid #e5e7eb', background: '#fafafa',
    cursor: 'pointer', transition: 'all 0.2s',
};

const codeInputStyle: React.CSSProperties = {
    width: '100%', padding: '14px 16px',
    fontSize: 24, fontWeight: 700, letterSpacing: 8,
    textAlign: 'center', border: '2px solid #e5e7eb',
    borderRadius: 12, outline: 'none',
};

const primaryBtnStyle: React.CSSProperties = {
    flex: 1, padding: '12px 20px', borderRadius: 10, border: 'none',
    background: '#3b82f6', color: '#fff', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
};

const secondaryBtnStyle: React.CSSProperties = {
    flex: 1, padding: '12px 20px', borderRadius: 10,
    border: '1px solid #e5e7eb', background: '#fff',
    color: '#64748b', fontSize: 14, fontWeight: 600,
    cursor: 'pointer',
};
