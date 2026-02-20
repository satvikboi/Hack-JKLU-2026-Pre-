const API_BASE = 'http://localhost:8000/api/v1';

let currentSessionId: string | null = null;

// ── Session Management ──────────────────────────────────
export async function createSession(): Promise<string> {
    const res = await fetch(`${API_BASE}/session`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to create session');
    const data = await res.json();
    currentSessionId = data.session_id;
    return data.session_id;
}

export function getSessionId(): string | null {
    return currentSessionId;
}

export function setSessionId(id: string) {
    currentSessionId = id;
}

// ── Analysis ────────────────────────────────────────────
export interface RedFlag {
    flag_id: string;
    clause_title: string;
    quoted_text: string;
    violation_type: string;
    law_reference: string;
    severity: 'critical' | 'medium' | 'low';
    plain_explanation: string;
    recommendation: string;
    replacement_clause?: string;
}

export interface MissingClause {
    clause_name: string;
    description: string;
    law_reference: string;
    risk_if_absent: string;
    severity: 'critical' | 'medium' | 'low';
    suggested_clause: string;
}

export interface SafeClause {
    clause_title: string;
    quoted_text: string;
    explanation: string;
}

export interface AnalysisResult {
    analysis_id: string;
    session_id: string;
    contract_type: string;
    risk_score: number;
    risk_level: 'low' | 'medium' | 'high';
    summary: string;
    red_flags: RedFlag[];
    missing_clauses: MissingClause[];
    safe_clauses: SafeClause[];
    contract_text: string;
    pages_analyzed: number;
    chunks_indexed: number;
    processing_time_ms: number;
    language: string;
}

export async function analyzeContract(
    text: string,
    contractType: string,
    language: string = 'en',
    file?: File,
): Promise<AnalysisResult> {
    if (!currentSessionId) {
        await createSession();
    }

    const formData = new FormData();

    if (file) {
        formData.append('file', file);
    } else if (text) {
        formData.append('text', text);
    }

    formData.append('contract_type', contractType.toLowerCase());
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/analyze`, {
        method: 'POST',
        headers: {
            'X-Session-ID': currentSessionId!,
        },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Analysis failed' }));
        throw new Error(err.detail || 'Analysis failed');
    }

    return res.json();
}

// ── Query ───────────────────────────────────────────────
export interface QueryResponse {
    answer: string;
    session_id: string;
    sources: any[];
}

export async function queryContract(question: string, language: string = 'en'): Promise<QueryResponse> {
    if (!currentSessionId) throw new Error('No active session. Please analyze a contract first.');

    const formData = new FormData();
    formData.append('question', question);
    formData.append('language', language);

    const res = await fetch(`${API_BASE}/query`, {
        method: 'POST',
        headers: {
            'X-Session-ID': currentSessionId,
        },
        body: formData,
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: 'Query failed' }));
        throw new Error(err.detail || 'Query failed');
    }

    return res.json();
}

// ── Health ──────────────────────────────────────────────
export async function checkHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
}
