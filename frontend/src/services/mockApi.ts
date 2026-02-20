export interface RedFlag {
    id: string;
    severity: "critical" | "medium" | "low";
    title: string;
    originalText: string;
    explanation: string;
    lawReference: string;
    suggestedFix: string;
}

export interface MissingClause {
    id: string;
    title: string;
    riskIfAbsent: string;
    suggestedAddition: string;
}

export interface SafeClause {
    id: string;
    title: string;
    originalText: string;
    explanation: string;
}

export interface AnalysisResponse {
    sessionId: string;
    riskScore: number;
    riskLevel: "high" | "medium" | "safe";
    summary: string;
    redFlags: RedFlag[];
    missingClauses: MissingClause[];
    safeClauses: SafeClause[];
}

export const MOCK_MODE = true;

export const mockAnalyzeContract = async (_file: any, _type: string, _lang: string): Promise<AnalysisResponse> => {
    return new Promise(resolve => {
        setTimeout(() => {
            resolve({
                sessionId: "mock-sess-id",
                riskScore: 73,
                riskLevel: "high",
                summary: "This rental agreement has 3 critical violations and 2 missing clauses. You should NOT sign this as-is.",
                redFlags: [
                    {
                        id: "1",
                        severity: "critical",
                        title: "Excessive Security Deposit",
                        originalText: "Tenant shall pay a security deposit equivalent to six (6) months of rent upfront before moving in.",
                        explanation: "Landlords can legally charge a maximum of 2 months rent as security deposit for residential properties.",
                        lawReference: "Model Tenancy Act 2021, Section 11",
                        suggestedFix: "Tenant shall pay a security deposit equivalent to two (2) months of rent."
                    }
                ],
                missingClauses: [],
                safeClauses: []
            });
        }, 2000);
    });
};
