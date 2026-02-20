import { useState, useEffect } from 'react';

export const useSession = () => {
    const [timeLeft, setTimeLeft] = useState(3600); // 1 hour session

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const clearSession = () => {
        setTimeLeft(3600);
        // In a real app, clear all relevant anonymous session user data here
    };

    return {
        timeLeft,
        formattedTime: formatTime(timeLeft),
        isExpired: timeLeft === 0,
        clearSession
    };
};
