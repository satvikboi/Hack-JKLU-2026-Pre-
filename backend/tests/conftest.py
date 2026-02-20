"""Shared test fixtures."""

import pytest
import pytest_asyncio
from pathlib import Path


@pytest.fixture
def sample_rental_text():
    return """
RENTAL AGREEMENT

This Rental Agreement is made on 1st January 2025 between:
Landlord: Mr. Sharma
Tenant: Mr. Verma

1. PREMISES: The landlord agrees to let the premises at 301, ABC Apartments, Mumbai.

2. RENT: The monthly rent shall be INR 25,000 payable on the 1st of every month.

3. SECURITY DEPOSIT: The tenant shall pay a security deposit of INR 1,50,000
   (equivalent to 6 months rent) which shall be refundable at the end of tenancy.

4. LOCK-IN PERIOD: The tenant cannot vacate the premises for the first 11 months.

5. TERMINATION: The landlord may terminate this agreement with immediate effect.
   The tenant must give 3 months notice.

6. MAINTENANCE: All repairs including structural repairs shall be borne by the tenant.

7. The landlord reserves the right to cut water and electricity supply in case of
   non-payment of rent.
"""


@pytest.fixture
def sample_employment_text():
    return """
EMPLOYMENT AGREEMENT

Date: 1st January 2025
Employee: Mr. Patel
Company: XYZ Tech Pvt Ltd (500 employees)

1. DESIGNATION: Software Engineer, CTC INR 12,00,000 per annum

2. PROBATION: 12 months probation period with no benefits

3. NON-COMPETE: Employee agrees not to work for any competitor for 2 years
   after leaving the company, in any part of India.

4. WORKING HOURS: Employee must be available 24/7 for project emergencies.

5. TERMINATION: Company may terminate employment at will without cause.
   Employee must serve 6 months notice period.
"""


@pytest.fixture
def tmp_pdf(tmp_path):
    """Create a minimal test file."""
    p = tmp_path / "test.txt"
    p.write_text("This is a test contract document.")
    return p
