import { useState } from 'react';
import { analyzeContract, type AnalysisResult } from '../services/api';

export interface AnalysisState {
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
    progress: number;
    results: AnalysisResult | null;
    error: string | null;
}

export const useAnalysis = () => {
    const [state, setState] = useState<AnalysisState>({
        status: 'idle',
        progress: 0,
        results: null,
        error: null,
    });

    const startAnalysis = async (
        text: string,
        contractType: string,
        language: string = 'en',
        file?: File,
    ) => {
        setState({ status: 'processing', progress: 15, results: null, error: null });

        // Progress simulation while waiting for real API
        const progressTimer = setInterval(() => {
            setState(prev => {
                if (prev.progress < 85) {
                    return { ...prev, progress: prev.progress + Math.random() * 10 };
                }
                return prev;
            });
        }, 2000);

        try {
            const result = await analyzeContract(text, contractType, language, file);

            clearInterval(progressTimer);
            setState({
                status: 'complete',
                progress: 100,
                results: result,
                error: null,
            });

            return result;
        } catch (err: any) {
            clearInterval(progressTimer);
            setState({
                status: 'error',
                progress: 0,
                results: null,
                error: err.message || 'Analysis failed. Please try again.',
            });
            throw err;
        }
    };

    const resetAnalysis = () => {
        setState({ status: 'idle', progress: 0, results: null, error: null });
    };

    return { state, startAnalysis, resetAnalysis };
};
