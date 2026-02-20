import { useState, useMemo } from 'react';
import { BookOpen, Search, ChevronDown, ChevronRight, ExternalLink, Shield, AlertTriangle, Scale, FileText, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

// ── Embedded law data from backend/app/data/indian_laws/ ──────────

interface Clause {
    clause_id: string;
    clause_name: string;
    required: boolean;
    severity_if_missing: 'critical' | 'medium' | 'low';
    law_section: string;
    red_flag_if: string;
    plain_english: string;
    plain_hindi: string;
    template_clause: string;
    keywords_to_detect: string[];
}

interface LawCategory {
    id: string;
    icon: string;
    title: string;
    law_name: string;
    description: string;
    color: string;
    clauses: Clause[];
}

const LAW_CATEGORIES: LawCategory[] = [
    {
        id: 'rental',
        icon: '🏠',
        title: 'Rental Law',
        law_name: 'Model Tenancy Act 2021',
        description: 'Rights and protections for tenants and landlords across India',
        color: 'accent-saffron',
        clauses: [
            { clause_id: 'MTA_001', clause_name: 'Security Deposit Limit', required: true, severity_if_missing: 'critical', law_section: 'Section 11, Model Tenancy Act 2021', red_flag_if: 'security deposit exceeds 2 months rent for residential', plain_english: 'Your landlord cannot ask for more than 2 months rent as security deposit for residential premises.', plain_hindi: 'मकान मालिक आवासीय परिसर के लिए 2 महीने के किराए से अधिक जमानत राशि नहीं मांग सकता।', template_clause: 'The Security Deposit shall not exceed two (2) months\' rent as mandated by Section 11 of the Model Tenancy Act, 2021.', keywords_to_detect: ['security deposit', 'advance', 'caution deposit', 'refundable deposit'] },
            { clause_id: 'MTA_002', clause_name: 'Rent Agreement Registration', required: true, severity_if_missing: 'critical', law_section: 'Section 4, Model Tenancy Act 2021', red_flag_if: 'no mention of registration of tenancy agreement', plain_english: 'Every tenancy agreement must be registered with the Rent Authority.', plain_hindi: 'प्रत्येक किरायेदारी समझौते को किराया प्राधिकरण के साथ पंजीकृत करना अनिवार्य है।', template_clause: 'This Agreement shall be registered with the Rent Authority within two months of execution.', keywords_to_detect: ['registration', 'rent authority', 'registered agreement'] },
            { clause_id: 'MTA_003', clause_name: 'Notice Period for Termination', required: true, severity_if_missing: 'medium', law_section: 'Section 22, Model Tenancy Act 2021', red_flag_if: 'notice period less than 1 month or no notice clause', plain_english: 'Either party must give at least 1 month written notice before termination.', plain_hindi: 'किसी भी पार्टी को समाप्ति से पहले कम से कम 1 महीने की लिखित सूचना देनी होगी।', template_clause: 'Either party may terminate this Agreement by giving not less than one (1) month\'s written notice.', keywords_to_detect: ['notice period', 'termination notice', 'notice to vacate'] },
            { clause_id: 'MTA_004', clause_name: 'Rent Revision Clause', required: true, severity_if_missing: 'medium', law_section: 'Section 9, Model Tenancy Act 2021', red_flag_if: 'rent increase exceeds 10% annually or no cap on increase', plain_english: 'Rent revision terms must be specified and should not be unreasonable.', plain_hindi: 'किराया संशोधन की शर्तें निर्दिष्ट होनी चाहिए और अनुचित नहीं होनी चाहिए।', template_clause: 'Rent shall be revised as mutually agreed, with an annual increase not exceeding 10%.', keywords_to_detect: ['rent revision', 'rent increase', 'annual increase', 'escalation'] },
            { clause_id: 'MTA_005', clause_name: 'Maintenance Responsibility', required: true, severity_if_missing: 'medium', law_section: 'Section 14, Model Tenancy Act 2021', red_flag_if: 'all maintenance pushed to tenant including structural repairs', plain_english: 'Structural repairs are the landlord\'s responsibility. Minor repairs are the tenant\'s.', plain_hindi: 'संरचनात्मक मरम्मत मकान मालिक की जिम्मेदारी है। मामूली मरम्मत किरायेदार की है।', template_clause: 'The Landlord shall be responsible for structural repairs. The Tenant shall maintain the premises and bear costs of minor repairs.', keywords_to_detect: ['maintenance', 'repairs', 'structural repairs', 'minor repairs'] },
            { clause_id: 'MTA_006', clause_name: 'Security Deposit Refund Timeline', required: true, severity_if_missing: 'critical', law_section: 'Section 12, Model Tenancy Act 2021', red_flag_if: 'no refund timeline or timeline exceeds 1 month after vacating', plain_english: 'Security deposit must be refunded within 1 month of vacating the premises.', plain_hindi: 'परिसर खाली करने के 1 महीने के भीतर जमानत राशि वापस करनी होगी।', template_clause: 'The Security Deposit shall be refunded within one (1) month of the Tenant vacating the premises, after deducting legitimate costs.', keywords_to_detect: ['refund', 'deposit refund', 'return of deposit', 'security return'] },
            { clause_id: 'MTA_007', clause_name: 'Subletting Clause', required: false, severity_if_missing: 'low', law_section: 'Section 17, Model Tenancy Act 2021', red_flag_if: 'subletting allowed without landlord consent', plain_english: 'Subletting is not allowed without written consent of the landlord.', plain_hindi: 'मकान मालिक की लिखित सहमति के बिना उपकिराया देना अनुमत नहीं है।', template_clause: 'The Tenant shall not sublet the premises without prior written consent of the Landlord.', keywords_to_detect: ['sublet', 'subletting', 'sub-lease', 'assign'] },
            { clause_id: 'MTA_008', clause_name: 'Essential Services', required: true, severity_if_missing: 'critical', law_section: 'Section 20, Model Tenancy Act 2021', red_flag_if: 'landlord can cut essential services like water and electricity', plain_english: 'Landlord cannot cut off essential services like water, electricity to force eviction.', plain_hindi: 'मकान मालिक बेदखली के लिए पानी, बिजली जैसी आवश्यक सेवाएं बंद नहीं कर सकता।', template_clause: 'The Landlord shall not withhold or cut off essential services including water and electricity supply.', keywords_to_detect: ['essential services', 'water supply', 'electricity', 'utilities'] },
        ],
    },
    {
        id: 'employment',
        icon: '👷',
        title: 'Labour & Employment',
        law_name: 'Indian Labour Codes 2020',
        description: 'Employee rights, PF, gratuity, working hours, and termination protections',
        color: 'accent-teal',
        clauses: [
            { clause_id: 'EMP_001', clause_name: 'Appointment Terms', required: true, severity_if_missing: 'critical', law_section: 'Section 6, Code on Wages 2019', red_flag_if: 'no clear designation, salary, or reporting structure', plain_english: 'Employment contract must clearly state designation, salary, and terms.', plain_hindi: 'रोजगार अनुबंध में पदनाम, वेतन और शर्तें स्पष्ट रूप से बताई जानी चाहिए।', template_clause: 'The Employee is appointed as [Designation] with a monthly CTC of INR [Amount].', keywords_to_detect: ['designation', 'appointment', 'position', 'role'] },
            { clause_id: 'EMP_002', clause_name: 'Provident Fund (PF)', required: true, severity_if_missing: 'critical', law_section: 'EPF Act 1952, Section 6', red_flag_if: 'no PF contribution for establishments with 20+ employees', plain_english: 'Employer must contribute 12% of basic salary to EPF for establishments with 20+ employees.', plain_hindi: '20+ कर्मचारियों वाले प्रतिष्ठानों के लिए नियोक्ता को मूल वेतन का 12% EPF में योगदान करना होगा।', template_clause: 'The Company shall contribute to the Employee\'s Provident Fund as per the EPF Act 1952.', keywords_to_detect: ['provident fund', 'PF', 'EPF', 'retirement fund'] },
            { clause_id: 'EMP_003', clause_name: 'Non-Compete Clause Enforceability', required: false, severity_if_missing: 'low', law_section: 'Section 27, Indian Contract Act 1872', red_flag_if: 'non-compete clause extending beyond employment period', plain_english: 'Post-employment non-compete clauses are generally unenforceable in India.', plain_hindi: 'रोजगार के बाद की गैर-प्रतिस्पर्धा शर्तें भारत में सामान्यतः लागू नहीं होतीं।', template_clause: 'The non-compete obligations shall apply only during the term of employment.', keywords_to_detect: ['non-compete', 'non compete', 'restrictive covenant', 'competition'] },
            { clause_id: 'EMP_004', clause_name: 'Notice Period', required: true, severity_if_missing: 'medium', law_section: 'Section 62, Industrial Relations Code 2020', red_flag_if: 'notice period exceeds 3 months or is asymmetric', plain_english: 'Notice period should be reasonable and symmetric for both parties.', plain_hindi: 'नोटिस अवधि उचित होनी चाहिए और दोनों पक्षों के लिए समान होनी चाहिए।', template_clause: 'Either party may terminate employment by giving [X] months written notice or salary in lieu thereof.', keywords_to_detect: ['notice period', 'termination notice', 'resignation notice'] },
            { clause_id: 'EMP_005', clause_name: 'Gratuity', required: true, severity_if_missing: 'critical', law_section: 'Payment of Gratuity Act 1972', red_flag_if: 'no gratuity provision after 5 years of service', plain_english: 'Employees completing 5 years are entitled to gratuity payment.', plain_hindi: '5 वर्ष पूरे करने वाले कर्मचारी ग्रेच्युटी भुगतान के हकदार हैं।', template_clause: 'Gratuity shall be payable as per the Payment of Gratuity Act 1972 upon completion of 5 years.', keywords_to_detect: ['gratuity', 'terminal benefits', 'retirement benefits'] },
            { clause_id: 'EMP_006', clause_name: 'Working Hours', required: true, severity_if_missing: 'medium', law_section: 'Section 25, Occupational Safety Code 2020', red_flag_if: 'working hours exceed 48 per week or 9 per day', plain_english: 'Maximum working hours: 8 hours/day, 48 hours/week. Overtime must be compensated.', plain_hindi: 'अधिकतम कार्य घंटे: 8 घंटे/दिन, 48 घंटे/सप्ताह। ओवरटाइम का मुआवजा दिया जाना चाहिए।', template_clause: 'Working hours shall not exceed 48 hours per week. Overtime beyond 8 hours/day shall be compensated.', keywords_to_detect: ['working hours', 'work hours', 'overtime', 'shift'] },
            { clause_id: 'EMP_007', clause_name: 'Leave Policy', required: true, severity_if_missing: 'medium', law_section: 'Section 32, Code on Wages 2019', red_flag_if: 'annual leave less than 15 days or no sick leave', plain_english: 'Employees are entitled to minimum annual leave and sick leave as per law.', plain_hindi: 'कर्मचारी कानून के अनुसार न्यूनतम वार्षिक छुट्टी और बीमार छुट्टी के हकदार हैं।', template_clause: 'The Employee shall be entitled to [X] days of paid annual leave and [Y] days of sick leave per year.', keywords_to_detect: ['leave', 'annual leave', 'sick leave', 'paid leave', 'vacation'] },
            { clause_id: 'EMP_008', clause_name: 'ESIC Coverage', required: true, severity_if_missing: 'critical', law_section: 'ESI Act 1948', red_flag_if: 'no ESIC for employees with monthly wages below 21000', plain_english: 'ESIC coverage mandatory for employees earning below Rs 21,000/month in applicable establishments.', plain_hindi: 'लागू प्रतिष्ठानों में 21,000 रुपये/माह से कम कमाने वाले कर्मचारियों के लिए ESIC कवरेज अनिवार्य।', template_clause: 'The Company shall register the Employee under ESIC as per the ESI Act 1948 where applicable.', keywords_to_detect: ['ESIC', 'ESI', 'health insurance', 'medical benefits'] },
            { clause_id: 'EMP_009', clause_name: 'Probation Period', required: false, severity_if_missing: 'low', law_section: 'Industrial Employment (Standing Orders) Act 1946', red_flag_if: 'probation period exceeds 6 months', plain_english: 'Probation period should generally not exceed 6 months.', plain_hindi: 'परिवीक्षा अवधि सामान्यतः 6 महीने से अधिक नहीं होनी चाहिए।', template_clause: 'The Employee shall be on probation for [X] months, not exceeding six (6) months.', keywords_to_detect: ['probation', 'trial period', 'probationary period'] },
            { clause_id: 'EMP_010', clause_name: 'Termination Grounds', required: true, severity_if_missing: 'critical', law_section: 'Section 59, Industrial Relations Code 2020', red_flag_if: 'termination at will without cause or due process', plain_english: 'Termination must follow due process. At-will termination without cause may violate labour laws.', plain_hindi: 'समाप्ति उचित प्रक्रिया का पालन करनी चाहिए। बिना कारण इच्छानुसार समाप्ति श्रम कानूनों का उल्लंघन हो सकता है।', template_clause: 'Employment may be terminated for cause with written notice specifying grounds.', keywords_to_detect: ['termination', 'dismissal', 'at will', 'grounds for termination'] },
        ],
    },
    {
        id: 'consumer',
        icon: '🛡️',
        title: 'Consumer Rights',
        law_name: 'Consumer Protection Act 2019',
        description: 'Refund rights, warranty protections, and product liability safeguards',
        color: 'accent-gold',
        clauses: [
            { clause_id: 'CON_001', clause_name: 'Right to Refund', required: true, severity_if_missing: 'critical', law_section: 'Section 2(9), Consumer Protection Act 2019', red_flag_if: 'no refund policy or non-refundable clause', plain_english: 'Consumers have the right to refund for defective goods or deficient services.', plain_hindi: 'उपभोक्ताओं को दोषपूर्ण वस्तुओं या अपर्याप्त सेवाओं के लिए वापसी का अधिकार है।', template_clause: 'The Consumer shall be entitled to a full refund within [X] days for defective products.', keywords_to_detect: ['refund', 'return policy', 'money back', 'cancellation'] },
            { clause_id: 'CON_002', clause_name: 'Warranty Terms', required: true, severity_if_missing: 'critical', law_section: 'Section 2(11), Consumer Protection Act 2019', red_flag_if: 'no warranty or warranty voiding conditions are unfair', plain_english: 'Product warranty terms must be clearly stated.', plain_hindi: 'उत्पाद वारंटी शर्तें स्पष्ट रूप से बताई जानी चाहिए।', template_clause: 'The product carries a warranty of [X] months from date of purchase.', keywords_to_detect: ['warranty', 'guarantee', 'product warranty'] },
            { clause_id: 'CON_003', clause_name: 'Unfair Trade Practice', required: false, severity_if_missing: 'medium', law_section: 'Section 2(47), Consumer Protection Act 2019', red_flag_if: 'misleading advertising or false claims in contract', plain_english: 'Contract should not contain misleading claims about product/service.', plain_hindi: 'अनुबंध में उत्पाद/सेवा के बारे में भ्रामक दावे नहीं होने चाहिए।', template_clause: 'All product specifications and claims are accurate as stated.', keywords_to_detect: ['unfair trade', 'misleading', 'false claim', 'deceptive'] },
            { clause_id: 'CON_004', clause_name: 'Product Liability', required: true, severity_if_missing: 'critical', law_section: 'Chapter VI, Consumer Protection Act 2019', red_flag_if: 'complete waiver of product liability', plain_english: 'Manufacturer/seller cannot completely waive liability for product defects.', plain_hindi: 'निर्माता/विक्रेता उत्पाद दोषों के लिए पूरी तरह दायित्व छोड़ नहीं सकते।', template_clause: 'The Manufacturer/Seller shall be liable for damages caused by product defects.', keywords_to_detect: ['liability', 'product liability', 'defect', 'damages'] },
        ],
    },
    {
        id: 'loan',
        icon: '💰',
        title: 'Loan & Finance',
        law_name: 'RBI Guidelines & NBFC Regulations',
        description: 'Interest rate disclosures, prepayment rights, and fair recovery practices',
        color: 'accent-red',
        clauses: [
            { clause_id: 'LOAN_001', clause_name: 'Interest Rate Disclosure', required: true, severity_if_missing: 'critical', law_section: 'RBI Master Direction, Fair Practices Code', red_flag_if: 'interest rate not clearly specified or hidden charges', plain_english: 'The annualized interest rate must be clearly disclosed.', plain_hindi: 'वार्षिक ब्याज दर स्पष्ट रूप से बताई जानी चाहिए।', template_clause: 'The annualized rate of interest shall be [X]% p.a.', keywords_to_detect: ['interest rate', 'rate of interest', 'annual rate', 'APR'] },
            { clause_id: 'LOAN_002', clause_name: 'Prepayment/Foreclosure Terms', required: true, severity_if_missing: 'critical', law_section: 'RBI Circular, Prepayment Charges', red_flag_if: 'prepayment penalty on floating rate loans', plain_english: 'No prepayment penalty can be charged on floating rate loans.', plain_hindi: 'फ्लोटिंग रेट ऋणों पर कोई प्रीपेमेंट जुर्माना नहीं लगाया जा सकता।', template_clause: 'Prepayment of the loan may be made without penalty for floating rate loans.', keywords_to_detect: ['prepayment', 'foreclosure', 'early repayment', 'penalty'] },
            { clause_id: 'LOAN_003', clause_name: 'EMI Structure', required: true, severity_if_missing: 'medium', law_section: 'RBI Fair Practices Code', red_flag_if: 'EMI not clearly defined or includes hidden fees', plain_english: 'EMI amount, tenure, and breakup must be clearly specified.', plain_hindi: 'EMI राशि, अवधि और विवरण स्पष्ट रूप से निर्दिष्ट होने चाहिए।', template_clause: 'The EMI shall be INR [amount] for [X] months.', keywords_to_detect: ['EMI', 'monthly installment', 'repayment schedule', 'tenure'] },
            { clause_id: 'LOAN_004', clause_name: 'Cooling-Off Period', required: true, severity_if_missing: 'medium', law_section: 'RBI Master Direction on Loans', red_flag_if: 'no cooling-off or look-up period for borrower', plain_english: 'Borrower should have a look-up period to exit the loan without penalty.', plain_hindi: 'उधारकर्ता को बिना जुर्माने के ऋण से बाहर निकलने के लिए एक लुक-अप अवधि होनी चाहिए।', template_clause: 'The Borrower shall have a look-up period of [X] days from the date of disbursement.', keywords_to_detect: ['cooling off', 'look-up period', 'exit', 'cancellation period'] },
            { clause_id: 'LOAN_005', clause_name: 'Recovery Practices', required: true, severity_if_missing: 'critical', law_section: 'RBI Fair Practices Code', red_flag_if: 'coercive or harassing recovery methods mentioned', plain_english: 'Lender must follow fair recovery practices. Harassment is illegal.', plain_hindi: 'ऋणदाता को उचित वसूली प्रथाओं का पालन करना चाहिए। उत्पीड़न अवैध है।', template_clause: 'Recovery shall be conducted in accordance with RBI Fair Practices Code.', keywords_to_detect: ['recovery', 'collection', 'default', 'enforcement'] },
        ],
    },
    {
        id: 'freelance',
        icon: '💻',
        title: 'Freelance & IT',
        law_name: 'Indian Contract Act 1872 & IT Act 2000',
        description: 'Scope of work, IP rights, payment terms, and dispute resolution',
        color: 'accent-teal',
        clauses: [
            { clause_id: 'FR_001', clause_name: 'Scope of Work', required: true, severity_if_missing: 'critical', law_section: 'Section 10, Indian Contract Act 1872', red_flag_if: 'vague or undefined scope of work', plain_english: 'Contract must clearly define the scope of work and deliverables.', plain_hindi: 'अनुबंध में कार्य का दायरा और डिलीवरेबल्स स्पष्ट रूप से परिभाषित होने चाहिए।', template_clause: 'The Contractor shall deliver the following services: [describe scope].', keywords_to_detect: ['scope of work', 'deliverables', 'services', 'tasks'] },
            { clause_id: 'FR_002', clause_name: 'Payment Terms', required: true, severity_if_missing: 'critical', law_section: 'Section 73, Indian Contract Act 1872', red_flag_if: 'payment timeline exceeds 30 days or no payment terms', plain_english: 'Payment terms including amount, milestones, and timeline must be specified.', plain_hindi: 'भुगतान की शर्तें जिसमें राशि, मील के पत्थर और समय-सीमा शामिल होनी चाहिए।', template_clause: 'The Client shall pay INR [amount] within [X] days of invoice submission.', keywords_to_detect: ['payment', 'invoice', 'compensation', 'fees', 'billing'] },
            { clause_id: 'FR_003', clause_name: 'Intellectual Property Rights', required: true, severity_if_missing: 'critical', law_section: 'Copyright Act 1957', red_flag_if: 'all IP transferred without fair compensation', plain_english: 'IP ownership must be clearly defined — who owns the work product.', plain_hindi: 'बौद्धिक संपदा स्वामित्व स्पष्ट रूप से परिभाषित होना चाहिए।', template_clause: 'IP rights in the deliverables shall vest with [Party] upon full payment.', keywords_to_detect: ['intellectual property', 'IP', 'copyright', 'ownership of work'] },
            { clause_id: 'FR_004', clause_name: 'Confidentiality', required: true, severity_if_missing: 'medium', law_section: 'Section 72, Indian Contract Act 1872', red_flag_if: 'no confidentiality obligations or one-sided NDA', plain_english: 'Both parties should maintain confidentiality of shared information.', plain_hindi: 'दोनों पक्षों को साझा जानकारी की गोपनीयता बनाए रखनी चाहिए।', template_clause: 'Both parties shall maintain confidentiality of proprietary information.', keywords_to_detect: ['confidential', 'NDA', 'non-disclosure', 'proprietary'] },
            { clause_id: 'FR_005', clause_name: 'Termination Clause', required: true, severity_if_missing: 'medium', law_section: 'Section 62-67, Indian Contract Act 1872', red_flag_if: 'termination only by one party or without notice', plain_english: 'Both parties should have the right to terminate with reasonable notice.', plain_hindi: 'दोनों पक्षों को उचित सूचना के साथ समाप्त करने का अधिकार होना चाहिए।', template_clause: 'Either party may terminate with [X] days written notice.', keywords_to_detect: ['termination', 'end of contract', 'cancel', 'exit clause'] },
            { clause_id: 'FR_006', clause_name: 'Dispute Resolution', required: true, severity_if_missing: 'medium', law_section: 'Arbitration and Conciliation Act 1996', red_flag_if: 'no dispute resolution mechanism specified', plain_english: 'Contract should specify how disputes will be resolved.', plain_hindi: 'अनुबंध में विवाद समाधान तंत्र निर्दिष्ट होना चाहिए।', template_clause: 'Disputes shall be resolved through arbitration under the Arbitration Act 1996.', keywords_to_detect: ['dispute', 'arbitration', 'mediation', 'jurisdiction'] },
        ],
    },
    {
        id: 'nda',
        icon: '🔒',
        title: 'NDA & Confidentiality',
        law_name: 'Indian Contract Act 1872',
        description: 'NDA duration, permitted disclosures, and return of information clauses',
        color: 'accent-saffron',
        clauses: [
            { clause_id: 'NDA_001', clause_name: 'Definition of Confidential Information', required: true, severity_if_missing: 'critical', law_section: 'Section 27, Indian Contract Act 1872', red_flag_if: 'overly broad definition covering all information', plain_english: 'Confidential information must be clearly defined and not overly broad.', plain_hindi: 'गोपनीय जानकारी स्पष्ट रूप से परिभाषित होनी चाहिए।', template_clause: 'Confidential Information means information specifically designated as confidential.', keywords_to_detect: ['confidential information', 'definition', 'proprietary', 'trade secret'] },
            { clause_id: 'NDA_002', clause_name: 'Duration of Obligation', required: true, severity_if_missing: 'medium', law_section: 'Section 27, Indian Contract Act 1872', red_flag_if: 'perpetual NDA obligation', plain_english: 'NDA obligations should have a reasonable time limit.', plain_hindi: 'NDA दायित्वों की उचित समय सीमा होनी चाहिए।', template_clause: 'Confidentiality obligations shall survive for [X] years after termination.', keywords_to_detect: ['duration', 'term', 'period', 'survival'] },
            { clause_id: 'NDA_003', clause_name: 'Permitted Disclosures', required: true, severity_if_missing: 'medium', law_section: 'Section 23, Indian Contract Act 1872', red_flag_if: 'no exceptions for legally required disclosures', plain_english: 'NDA must allow disclosure when required by law or court order.', plain_hindi: 'NDA में कानून या अदालत के आदेश से आवश्यक प्रकटीकरण की अनुमति होनी चाहिए।', template_clause: 'Disclosure is permitted when required by applicable law or court order.', keywords_to_detect: ['permitted disclosure', 'exceptions', 'legal requirement', 'court order'] },
            { clause_id: 'NDA_004', clause_name: 'Return of Information', required: true, severity_if_missing: 'low', law_section: 'Indian Contract Act 1872', red_flag_if: 'no provision for return or destruction of confidential materials', plain_english: 'On termination, all confidential materials should be returned or destroyed.', plain_hindi: 'समाप्ति पर सभी गोपनीय सामग्री वापस या नष्ट की जानी चाहिए।', template_clause: 'Upon termination, all confidential materials shall be returned or destroyed.', keywords_to_detect: ['return', 'destruction', 'materials', 'documents'] },
        ],
    },
    {
        id: 'startup',
        icon: '🚀',
        title: 'Startup Agreements',
        law_name: 'Companies Act 2013 & DPIIT Guidelines',
        description: 'Equity vesting, anti-dilution, liquidation preference, and board control',
        color: 'accent-gold',
        clauses: [
            { clause_id: 'ST_001', clause_name: 'Equity Vesting Schedule', required: true, severity_if_missing: 'critical', law_section: 'Companies Act 2013, Section 62', red_flag_if: 'no vesting or cliff period for founder equity', plain_english: 'Founder equity should have a vesting schedule with cliff period.', plain_hindi: 'संस्थापक इक्विटी में क्लिफ अवधि के साथ वेस्टिंग शेड्यूल होना चाहिए।', template_clause: 'Founder shares shall vest over 4 years with a 1-year cliff.', keywords_to_detect: ['vesting', 'cliff', 'equity', 'shares'] },
            { clause_id: 'ST_002', clause_name: 'Anti-Dilution Protection', required: true, severity_if_missing: 'critical', law_section: 'Companies Act 2013', red_flag_if: 'full ratchet anti-dilution unfavorable to founders', plain_english: 'Anti-dilution terms should use weighted average, not full ratchet.', plain_hindi: 'एंटी-डाइल्यूशन शर्तों में भारित औसत का उपयोग होना चाहिए।', template_clause: 'Anti-dilution protection shall be on a weighted average basis.', keywords_to_detect: ['anti-dilution', 'dilution', 'ratchet', 'weighted average'] },
            { clause_id: 'ST_003', clause_name: 'Liquidation Preference', required: true, severity_if_missing: 'medium', law_section: 'Companies Act 2013', red_flag_if: 'participating preferred with more than 1x liquidation preference', plain_english: 'Liquidation preference should be non-participating 1x.', plain_hindi: 'लिक्विडेशन प्रेफरेंस नॉन-पार्टिसिपेटिंग 1x होना चाहिए।', template_clause: 'Investors shall have a non-participating 1x liquidation preference.', keywords_to_detect: ['liquidation preference', 'liquidation', 'preference', 'waterfall'] },
            { clause_id: 'ST_004', clause_name: 'Board Composition', required: true, severity_if_missing: 'medium', law_section: 'Section 149, Companies Act 2013', red_flag_if: 'investors have majority board seats', plain_english: 'Founders should retain board control in early stages.', plain_hindi: 'प्रारंभिक चरणों में संस्थापकों को बोर्ड नियंत्रण बनाए रखना चाहिए।', template_clause: 'The Board shall consist of [X] Founder directors and [Y] Investor directors.', keywords_to_detect: ['board', 'directors', 'board composition', 'governance'] },
            { clause_id: 'ST_005', clause_name: 'Drag Along Rights', required: false, severity_if_missing: 'low', law_section: 'Companies Act 2013', red_flag_if: 'drag along triggered at very low thresholds', plain_english: 'Drag-along should require supermajority approval.', plain_hindi: 'ड्रैग-अलॉन्ग के लिए अधिसंख्य अनुमोदन आवश्यक होना चाहिए।', template_clause: 'Drag-along rights shall require approval of 75% of shareholders.', keywords_to_detect: ['drag along', 'tag along', 'forced sale', 'co-sale'] },
        ],
    },
];

const severityConfig = {
    critical: { label: 'Critical', color: 'text-red-400 bg-red-400/10 border-red-400/30', dot: 'bg-red-400' },
    medium: { label: 'Medium', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30', dot: 'bg-yellow-400' },
    low: { label: 'Low', color: 'text-green-400 bg-green-400/10 border-green-400/30', dot: 'bg-green-400' },
};

export const IndianLawHub = () => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [expandedClause, setExpandedClause] = useState<string | null>(null);
    const [showHindi, setShowHindi] = useState(false);

    const activeCategory = LAW_CATEGORIES.find(c => c.id === selectedCategory);

    const filteredCategories = useMemo(() => {
        if (!searchQuery.trim()) return LAW_CATEGORIES;
        const q = searchQuery.toLowerCase();
        return LAW_CATEGORIES.filter(cat =>
            cat.title.toLowerCase().includes(q) ||
            cat.law_name.toLowerCase().includes(q) ||
            cat.description.toLowerCase().includes(q) ||
            cat.clauses.some(cl =>
                cl.clause_name.toLowerCase().includes(q) ||
                cl.plain_english.toLowerCase().includes(q) ||
                cl.law_section.toLowerCase().includes(q) ||
                cl.keywords_to_detect.some(kw => kw.toLowerCase().includes(q))
            )
        );
    }, [searchQuery]);

    const filteredClauses = useMemo(() => {
        if (!activeCategory) return [];
        if (!searchQuery.trim()) return activeCategory.clauses;
        const q = searchQuery.toLowerCase();
        return activeCategory.clauses.filter(cl =>
            cl.clause_name.toLowerCase().includes(q) ||
            cl.plain_english.toLowerCase().includes(q) ||
            cl.law_section.toLowerCase().includes(q) ||
            cl.keywords_to_detect.some(kw => kw.toLowerCase().includes(q))
        );
    }, [activeCategory, searchQuery]);

    const totalClauses = LAW_CATEGORIES.reduce((sum, c) => sum + c.clauses.length, 0);
    const criticalClauses = LAW_CATEGORIES.reduce((sum, c) => sum + c.clauses.filter(cl => cl.severity_if_missing === 'critical').length, 0);

    return (
        <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
            {/* Header */}
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-10 text-center max-w-3xl mx-auto">
                <div className="flex items-center justify-center gap-3 mb-4">
                    <Scale className="w-8 h-8 text-accent-gold" />
                    <h1 className="font-serif text-3xl md:text-5xl font-bold text-white">Indian Law Hub</h1>
                </div>
                <p className="text-text-secondary text-lg mb-6">
                    A clear, plain-language reference guide to your legal rights in India. Know exactly what every contract clause means — and what's missing.
                </p>
                {/* Stats row */}
                <div className="flex items-center justify-center gap-6 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-teal animate-pulse" />
                        <span className="text-text-muted">{LAW_CATEGORIES.length} Law Categories</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent-saffron animate-pulse" />
                        <span className="text-text-muted">{totalClauses} Legal Clauses</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
                        <span className="text-text-muted">{criticalClauses} Critical Protections</span>
                    </div>
                </div>
            </motion.div>

            {/* Search bar */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col md:flex-row gap-4 mb-10 max-w-4xl mx-auto">
                <div className="relative flex-grow">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                        type="text"
                        placeholder="Search any law, clause, or right... (e.g. 'security deposit', 'gratuity', 'IP rights')"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full bg-bg-secondary border border-border rounded-lg pl-12 pr-4 py-4 text-white placeholder-text-muted focus:outline-none focus:border-accent-saffron focus:ring-1 focus:ring-accent-saffron transition-all"
                    />
                </div>
                <button
                    onClick={() => setShowHindi(!showHindi)}
                    className={clsx(
                        "px-6 py-4 rounded-lg flex items-center justify-center gap-2 transition-all font-medium",
                        showHindi ? "bg-accent-saffron/20 text-accent-saffron border border-accent-saffron/40" : "glass text-white hover:bg-bg-tertiary"
                    )}
                >
                    🇮🇳 {showHindi ? 'हिंदी On' : 'Hindi'}
                </button>
            </motion.div>

            <AnimatePresence mode="wait">
                {/* ── Category Detail View ── */}
                {selectedCategory && activeCategory ? (
                    <motion.div key="detail" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                        {/* Back button & category header */}
                        <button
                            onClick={() => { setSelectedCategory(null); setExpandedClause(null); }}
                            className="flex items-center gap-2 text-text-muted hover:text-white transition-colors mb-6"
                        >
                            <ArrowLeft className="w-4 h-4" /> Back to all categories
                        </button>

                        <div className="glass-panel rounded-2xl p-6 md:p-8 mb-8">
                            <div className="flex items-start gap-4">
                                <div className="text-5xl">{activeCategory.icon}</div>
                                <div className="flex-1">
                                    <h2 className="font-serif text-2xl md:text-3xl font-bold text-white">{activeCategory.title}</h2>
                                    <p className="text-accent-saffron font-medium mt-1">{activeCategory.law_name}</p>
                                    <p className="text-text-muted mt-2">{activeCategory.description}</p>
                                    <div className="flex items-center gap-4 mt-4 text-xs">
                                        <span className="text-text-muted">{activeCategory.clauses.length} clauses</span>
                                        <span className="text-red-400">{activeCategory.clauses.filter(c => c.severity_if_missing === 'critical').length} critical</span>
                                        <span className="text-yellow-400">{activeCategory.clauses.filter(c => c.severity_if_missing === 'medium').length} medium</span>
                                        <span className="text-green-400">{activeCategory.clauses.filter(c => c.severity_if_missing === 'low').length} low</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Clauses list */}
                        <div className="space-y-3">
                            {filteredClauses.map((clause, i) => {
                                const isExpanded = expandedClause === clause.clause_id;
                                const sev = severityConfig[clause.severity_if_missing];
                                return (
                                    <motion.div
                                        key={clause.clause_id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={clsx(
                                            "glass-panel rounded-xl overflow-hidden transition-all cursor-pointer",
                                            isExpanded && "ring-1 ring-accent-saffron/40"
                                        )}
                                        onClick={() => setExpandedClause(isExpanded ? null : clause.clause_id)}
                                    >
                                        {/* Clause header */}
                                        <div className="flex items-center gap-4 p-5">
                                            <div className={clsx("w-2 h-2 rounded-full flex-shrink-0", sev.dot)} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-semibold text-white">{clause.clause_name}</h3>
                                                    <span className={clsx("text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", sev.color)}>
                                                        {sev.label}
                                                    </span>
                                                    {clause.required && (
                                                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-accent-teal/10 text-accent-teal border border-accent-teal/30 uppercase tracking-wider">
                                                            Required
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-text-muted mt-1 truncate">{clause.law_section}</p>
                                            </div>
                                            {isExpanded ? <ChevronDown className="w-5 h-5 text-text-muted flex-shrink-0" /> : <ChevronRight className="w-5 h-5 text-text-muted flex-shrink-0" />}
                                        </div>

                                        {/* Expanded content */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <motion.div
                                                    initial={{ height: 0, opacity: 0 }}
                                                    animate={{ height: 'auto', opacity: 1 }}
                                                    exit={{ height: 0, opacity: 0 }}
                                                    transition={{ duration: 0.2 }}
                                                >
                                                    <div className="px-5 pb-5 border-t border-border/50 pt-4 space-y-4">
                                                        {/* What it means */}
                                                        <div>
                                                            <h4 className="text-xs font-bold text-accent-gold uppercase tracking-wider mb-2 flex items-center gap-2">
                                                                <BookOpen className="w-3 h-3" /> What This Means
                                                            </h4>
                                                            <p className="text-white/90 text-sm leading-relaxed">{clause.plain_english}</p>
                                                            {showHindi && (
                                                                <p className="text-text-muted text-sm mt-2 font-hindi leading-relaxed">{clause.plain_hindi}</p>
                                                            )}
                                                        </div>

                                                        {/* Red flag */}
                                                        <div className="bg-red-400/5 border border-red-400/20 rounded-lg p-4">
                                                            <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-2">
                                                                <AlertTriangle className="w-3 h-3" /> Red Flag If
                                                            </h4>
                                                            <p className="text-red-300/80 text-sm">{clause.red_flag_if}</p>
                                                        </div>

                                                        {/* Template clause */}
                                                        <div className="bg-accent-teal/5 border border-accent-teal/20 rounded-lg p-4">
                                                            <h4 className="text-xs font-bold text-accent-teal uppercase tracking-wider mb-1 flex items-center gap-2">
                                                                <FileText className="w-3 h-3" /> Safe Template Clause
                                                            </h4>
                                                            <p className="text-white/80 text-sm font-mono leading-relaxed">"{clause.template_clause}"</p>
                                                        </div>

                                                        {/* Law reference */}
                                                        <div className="flex items-center justify-between text-xs text-text-muted">
                                                            <span className="flex items-center gap-1.5">
                                                                <Scale className="w-3 h-3" /> {clause.law_section}
                                                            </span>
                                                            <span className="flex flex-wrap gap-1">
                                                                {clause.keywords_to_detect.slice(0, 4).map(kw => (
                                                                    <span key={kw} className="bg-bg-tertiary px-2 py-0.5 rounded text-[10px]">{kw}</span>
                                                                ))}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                );
                            })}
                        </div>

                        {filteredClauses.length === 0 && (
                            <div className="text-center py-16 text-text-muted">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No clauses match "{searchQuery}"</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* ── Category Grid View ── */
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {filteredCategories.map((cat, i) => (
                                <motion.div
                                    key={cat.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    onClick={() => setSelectedCategory(cat.id)}
                                    className="glass-panel p-6 rounded-2xl cursor-pointer hover:border-accent-gold/50 group transition-all hover:-translate-y-1"
                                >
                                    <div className="text-4xl mb-4">{cat.icon}</div>
                                    <h3 className="font-bold text-lg text-white group-hover:text-accent-gold transition-colors">{cat.title}</h3>
                                    <p className="text-sm text-accent-saffron mt-1 flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" /> {cat.law_name}
                                    </p>
                                    <p className="text-xs text-text-muted mt-2 leading-relaxed">{cat.description}</p>

                                    {/* Clause count badge */}
                                    <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border/30">
                                        <span className="text-xs text-text-muted">{cat.clauses.length} clauses</span>
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                            <Shield className="w-3 h-3" />
                                            {cat.clauses.filter(c => c.severity_if_missing === 'critical').length} critical
                                        </span>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {filteredCategories.length === 0 && (
                            <div className="text-center py-16 text-text-muted">
                                <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                <p>No categories match "{searchQuery}"</p>
                            </div>
                        )}

                        {/* Key Acts Reference */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mt-12">
                            <h2 className="font-serif text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Scale className="w-5 h-5 text-accent-gold" /> Key Indian Acts Referenced
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                {[
                                    { name: 'Indian Contract Act, 1872', desc: 'Foundation of all contract law in India', year: '1872', url: 'https://www.indiacode.nic.in/handle/123456789/2187?view_type=browse' },
                                    { name: 'Consumer Protection Act, 2019', desc: 'Modern consumer rights framework with product liability', year: '2019', url: 'https://www.indiacode.nic.in/handle/123456789/15256?view_type=browse' },
                                    { name: 'Model Tenancy Act, 2021', desc: 'Standardized rental rights across India', year: '2021', url: '#' },
                                    { name: 'Code on Wages, 2019', desc: 'Unified wage and salary regulations', year: '2019', url: 'https://www.indiacode.nic.in/handle/123456789/15243?view_type=browse' },
                                    { name: 'Companies Act, 2013', desc: 'Corporate governance and startup framework', year: '2013', url: 'https://www.indiacode.nic.in/handle/123456789/2113?view_type=browse' },
                                    { name: 'Arbitration Act, 1996', desc: 'Dispute resolution outside courts', year: '1996', url: 'https://www.indiacode.nic.in/handle/123456789/1978?view_type=browse' },
                                    { name: 'IT Act, 2000', desc: 'Digital contracts and cyber law', year: '2000', url: 'https://www.indiacode.nic.in/handle/123456789/1999?view_type=browse' },
                                    { name: 'Copyright Act, 1957', desc: 'IP ownership for creative and tech work', year: '1957', url: 'https://www.indiacode.nic.in/handle/123456789/1367?view_type=browse' },
                                    { name: 'EPF Act, 1952', desc: 'Employee provident fund contributions', year: '1952', url: 'https://www.indiacode.nic.in/handle/123456789/1399?view_type=browse' },
                                ].map((act, i) => (
                                    <a
                                        key={i}
                                        href={act.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="glass-panel p-4 rounded-xl flex items-center gap-3 group hover:border-accent-teal/50 transition-all"
                                    >
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-semibold text-white group-hover:text-accent-teal transition-colors truncate">{act.name}</h4>
                                            <p className="text-xs text-text-muted mt-0.5">{act.desc}</p>
                                        </div>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                            <span className="text-[10px] text-text-muted bg-bg-tertiary px-2 py-0.5 rounded">{act.year}</span>
                                            <ExternalLink className="w-3.5 h-3.5 text-text-muted group-hover:text-accent-teal transition-colors" />
                                        </div>
                                    </a>
                                ))}
                            </div>
                        </motion.div>

                        {/* Bottom CTA */}
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="mt-12 bg-gradient-to-r from-accent-saffron/10 to-accent-teal/10 border border-accent-saffron/20 rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h2 className="font-serif text-2xl font-bold text-white mb-2">Have a contract to check?</h2>
                                <p className="text-text-secondary">Upload it now and our AI will automatically flag violations against these laws.</p>
                            </div>
                            <a href="/analyze" className="px-8 py-3.5 bg-gradient-to-r from-accent-saffron to-amber-500 text-black font-semibold rounded-lg hover:shadow-lg hover:shadow-accent-saffron/20 transition-all whitespace-nowrap">
                                Analyze My Contract →
                            </a>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
