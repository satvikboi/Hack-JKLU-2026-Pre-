import { useState, useEffect } from 'react';

type Language = 'en' | 'hi' | 'mr' | 'ta';
type Translations = Record<string, string>;

const en: Translations = {
    "nav.home": "Home",
    "nav.newAnalysis": "New Analysis",
    "nav.myAnalyses": "My Analyses",
    "nav.compareDrafts": "Compare Drafts",
    "nav.voiceAssistant": "Voice Assistant",
    "nav.lawHub": "Indian Law Hub",
    "nav.settings": "Settings",
    "hero.title": "Your Contracts. Decoded. Protected.",
    "hero.subtitle": "India's first AI legal guardian. Upload any contract and know your rights in 60 seconds — in Hindi, Marathi, or Tamil."
};

const hi: Translations = {
    "nav.home": "होम",
    "nav.newAnalysis": "नया विश्लेषण",
    "nav.myAnalyses": "मेरे विश्लेषण",
    "nav.compareDrafts": "ड्राफ्ट की तुलना करें",
    "nav.voiceAssistant": "वॉइस असिस्टेंट",
    "nav.lawHub": "भारतीय कानून हब",
    "nav.settings": "सेटिंग्स",
    "hero.title": "आपके अनुबंध। डिकोड किए गए। सुरक्षित।",
    "hero.subtitle": "भारत का पहला AI कानूनी संरक्षक। कोई भी अनुबंध अपलोड करें और 60 सेकंड में अपने अधिकार जानें।"
};

const mr: Translations = {
    "nav.home": "मुख्य पृष्ठ",
    "nav.newAnalysis": "नवीन विश्लेषण",
    "nav.myAnalyses": "माझे विश्लेषण",
    "nav.compareDrafts": "मसुद्यांची तुलना करा",
    "nav.voiceAssistant": "व्हॉइस असिस्टंट",
    "nav.lawHub": "भारतीय कायदा हब",
    "nav.settings": "सेटिंग्ज",
    "hero.title": "तुमचे करार. डिकोड केले. सुरक्षित.",
    "hero.subtitle": "भारताचा पहिला AI कायदेशीर संरक्षक. कोणताही करार अपलोड करा आणि 60 सेकंदात तुमचे हक्क जाणून घ्या."
};

const ta: Translations = {
    "nav.home": "முகப்பு",
    "nav.newAnalysis": "புதிய பகுப்பாய்வு",
    "nav.myAnalyses": "எனது பகுப்பாய்வுகள்",
    "nav.compareDrafts": "வரைவுகளை ஒப்பிடுக",
    "nav.voiceAssistant": "குரல் உதவியாளர்",
    "nav.lawHub": "இந்தியச் சட்ட மையம்",
    "nav.settings": "அமைப்புகள்",
    "hero.title": "உங்கள் ஒப்பந்தங்கள். புரிந்து கொள்ளப்பட்டன. பாதுகாக்கப்பட்டன.",
    "hero.subtitle": "இந்தியாவின் முதல் AI சட்டப் பாதுகாவலர். எந்தவொரு ஒப்பந்தத்தையும் பதிவேற்றி, 60 வினாடிகளில் உங்கள் உரிமைகளை அறியுங்கள்."
};

const translations: Record<Language, Translations> = { en, hi, mr, ta };

export const useLanguage = () => {
    const [language, setLanguage] = useState<Language>(() => {
        return (localStorage.getItem('preferred_language') as Language) || 'en';
    });

    useEffect(() => {
        localStorage.setItem('preferred_language', language);
    }, [language]);

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return { language, setLanguage, t };
};
