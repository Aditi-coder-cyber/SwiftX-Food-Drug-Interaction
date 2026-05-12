import React, { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

/* ─── Indian Languages ──────────────────────────────────────────────────── */

const LANGUAGES = [
    { code: 'en', name: 'English', native: 'English' },
    { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
    { code: 'bn', name: 'Bengali', native: 'বাংলা' },
    { code: 'te', name: 'Telugu', native: 'తెలుగు' },
    { code: 'mr', name: 'Marathi', native: 'मराठी' },
    { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
    { code: 'ur', name: 'Urdu', native: 'اردو' },
    { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
    { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
    { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
    { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
    { code: 'as', name: 'Assamese', native: 'অসমীয়া' },
    { code: 'mai', name: 'Maithili', native: 'मैथिली' },
    { code: 'sd', name: 'Sindhi', native: 'سنڌي' },
    { code: 'ks', name: 'Kashmiri', native: 'कॉशुर' },
    { code: 'kok', name: 'Konkani', native: 'कोंकणी' },
    { code: 'doi', name: 'Dogri', native: 'डोगरी' },
    { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্' },
    { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ' },
    { code: 'ne', name: 'Nepali', native: 'नेपाली' },
];

/* ─── Trigger Google Translate ──────────────────────────────────────────── */

function changeLanguage(langCode: string) {
    if (langCode === 'en') {
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.' + window.location.hostname;
        window.location.reload();
        return;
    }
    document.cookie = `googtrans=/en/${langCode}; path=/;`;
    document.cookie = `googtrans=/en/${langCode}; path=/; domain=.${window.location.hostname}`;
    window.location.reload();
}

/* ─── Inline Language Switcher (goes inside any navbar) ─────────────────── */

export function LanguageSwitcher() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState('en');
    const [searchQuery, setSearchQuery] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const match = document.cookie.match(/googtrans=\/en\/(\w+)/);
        if (match && match[1]) setCurrentLang(match[1]);
    }, []);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearchQuery('');
            }
        };
        if (isOpen) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const currentLanguage = LANGUAGES.find(l => l.code === currentLang) || LANGUAGES[0];
    const filteredLanguages = LANGUAGES.filter(
        l => l.name.toLowerCase().includes(searchQuery.toLowerCase()) || l.native.includes(searchQuery)
    );

    const handleSelect = (code: string) => {
        setCurrentLang(code);
        setIsOpen(false);
        setSearchQuery('');
        changeLanguage(code);
    };

    return (
        <div ref={dropdownRef} className="relative notranslate" translate="no">
            {/* Toggle — matches navbar styling */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${isOpen
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    }`}
            >
                <Globe className="size-4" />
                <span className="hidden sm:inline max-w-[70px] truncate">{currentLanguage.native}</span>
                <ChevronDown className="size-3.5" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div
                    className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    style={{ zIndex: 9999, animation: 'langFadeIn 0.15s ease-out' }}
                >
                    {/* Header + Search */}
                    <div className="p-2.5 border-b border-gray-100">
                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2 px-1">🇮🇳 Indian Languages</p>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search languages..."
                            autoFocus
                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100"
                        />
                    </div>

                    {/* Language list */}
                    <div className="max-h-72 overflow-y-auto py-1">
                        {filteredLanguages.map(lang => (
                            <button
                                key={lang.code}
                                onClick={() => handleSelect(lang.code)}
                                className={`flex items-center gap-3 w-full px-4 py-2.5 text-left transition-colors ${currentLang === lang.code
                                    ? 'bg-blue-50 text-blue-700'
                                    : 'text-gray-700 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex-1 min-w-0">
                                    <span className={`text-sm ${currentLang === lang.code ? 'font-semibold' : ''}`}>
                                        {lang.native}
                                    </span>
                                    <span className="text-xs text-gray-400 ml-2">{lang.name}</span>
                                </div>
                                {currentLang === lang.code && (
                                    <Check className="size-4 text-blue-600 flex-shrink-0" />
                                )}
                            </button>
                        ))}
                        {filteredLanguages.length === 0 && (
                            <p className="text-center text-gray-400 text-sm py-4">No languages found</p>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes langFadeIn {
                    from { opacity: 0; transform: translateY(-4px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
