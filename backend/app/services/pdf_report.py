"""PDF report generation via Jinja2 + WeasyPrint."""

from __future__ import annotations

from pathlib import Path
from typing import Optional

from app.models.responses import AnalysisResponse
from app.utils.helpers import ensure_dir, generate_id
from app.utils.logger import get_logger

log = get_logger("pdf_report")

_REPORT_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
<style>
  body { font-family: 'Segoe UI', sans-serif; margin: 40px; color: #333; }
  h1 { color: #0A0E1A; border-bottom: 3px solid #FF9933; padding-bottom: 10px; }
  h2 { color: #FF9933; margin-top: 30px; }
  .score { font-size: 48px; font-weight: bold; text-align: center; padding: 20px; }
  .high { color: #EF4444; }
  .medium { color: #F59E0B; }
  .low { color: #0D9488; }
  .flag { border-left: 4px solid #EF4444; padding: 10px 15px; margin: 10px 0; background: #FEF2F2; }
  .missing { border-left: 4px solid #F59E0B; padding: 10px 15px; margin: 10px 0; background: #FFFBEB; }
  .safe { border-left: 4px solid #0D9488; padding: 10px 15px; margin: 10px 0; background: #F0FDFA; }
  .law-ref { font-style: italic; color: #666; font-size: 0.9em; }
  .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; font-size: 0.8em; color: #999; }
</style>
</head>
<body>
<h1>⚖️ LegalSaathi — Contract Analysis Report</h1>

<div class="score {{ result.risk_level }}">
  {{ result.risk_score }} / 100 — {{ result.risk_level | upper }}
</div>

<p><strong>Contract Type:</strong> {{ result.contract_type | title }}</p>
<p><strong>Summary:</strong> {{ result.summary }}</p>

{% if result.red_flags %}
<h2>🚨 Red Flags ({{ result.red_flags | length }})</h2>
{% for flag in result.red_flags %}
<div class="flag">
  <strong>{{ flag.clause_title }}</strong> ({{ flag.severity | upper }})<br>
  <em>"{{ flag.quoted_text }}"</em><br>
  {{ flag.plain_explanation }}<br>
  <span class="law-ref">📋 {{ flag.law_reference }}</span>
</div>
{% endfor %}
{% endif %}

{% if result.missing_clauses %}
<h2>⚠️ Missing Clauses ({{ result.missing_clauses | length }})</h2>
{% for mc in result.missing_clauses %}
<div class="missing">
  <strong>{{ mc.clause_name }}</strong><br>
  {{ mc.description }}<br>
  <span class="law-ref">📋 {{ mc.law_reference }}</span>
</div>
{% endfor %}
{% endif %}

{% if result.safe_clauses %}
<h2>✅ Safe Clauses ({{ result.safe_clauses | length }})</h2>
{% for sc in result.safe_clauses %}
<div class="safe">
  <strong>{{ sc.clause_title }}</strong><br>
  {{ sc.explanation }}
</div>
{% endfor %}
{% endif %}

<div class="footer">
  Analyzed by LegalSaathi. This is AI analysis, not legal advice.
  Consult a qualified lawyer for complex legal matters.
</div>
</body>
</html>
"""


class PDFReportGenerator:
    """Generate branded PDF reports from analysis results."""

    async def generate(self, result: AnalysisResponse, output_dir: Path | None = None) -> Path:
        """Generate a PDF report from an AnalysisResponse."""
        from jinja2 import Template

        template = Template(_REPORT_TEMPLATE)
        html = template.render(result=result)

        output_dir = output_dir or ensure_dir(Path("/tmp/legalsaathi/reports"))
        pdf_path = output_dir / f"report_{generate_id()}.pdf"

        try:
            from weasyprint import HTML
            HTML(string=html).write_pdf(str(pdf_path))
            log.info("pdf_report_generated", path=str(pdf_path))
        except ImportError:
            # Fallback: save HTML if WeasyPrint not available
            html_path = pdf_path.with_suffix(".html")
            html_path.write_text(html, encoding="utf-8")
            log.warning("weasyprint_not_available_html_saved", path=str(html_path))
            return html_path

        return pdf_path
