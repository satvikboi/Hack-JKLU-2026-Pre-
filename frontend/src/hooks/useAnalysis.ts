import { useState } from 'react';

export interface AnalysisState {
    status: 'idle' | 'uploading' | 'processing' | 'complete' | 'error';
    progress: number;
    results: any | null;
}

export const useAnalysis = () => {
    const [state, setState] = useState<AnalysisState>({
        status: 'idle',
        progress: 0,
        results: null
    });

    const startAnalysis = async (_fileOrText: any) => {
        setState({ status: 'processing', progress: 0, results: null });

        const stages = [15, 45, 75, 100];
        for (const p of stages) {
            await new Promise(r => setTimeout(r, 1500));
            setState(prev => ({ ...prev, progress: p }));
        }

        setState({
            status: 'complete',
            progress: 100,
            results: {
                riskScore: 73,
                // More mock fields will be populated as needed
            }
        });
    };

    const resetAnalysis = () => {
        setState({ status: 'idle', progress: 0, results: null });
    };

    return { state, startAnalysis, resetAnalysis };
};
