// exam entity schema and orchestrator

export type ExamType = 'central' | 'state' | 'private'

export interface ImportantDate {
    label: string
    date: string
}

export interface ExamUpdate {
    title: string
    summary: string
    timestamp: string
}

export interface ExamEntity {
    name: string
    slug: string
    conductingBody: string
    examType: ExamType
    domains: string[]
    states: string[] // empty = all India
    eligibility: string
    syllabus: string[]
    importantDates: ImportantDate[]
    updates: ExamUpdate[]
    relatedExams: string[]
    sources: { name: string; url?: string }[]
    ttl: number
}

// central exams
const examStore: Record<string, ExamEntity> = {
    'ssc-cgl': {
        name: 'SSC CGL 2026',
        slug: 'ssc-cgl',
        conductingBody: 'Staff Selection Commission',
        examType: 'central',
        domains: ['ssc', 'government'],
        states: [],
        eligibility: 'Graduate from recognized university. Age 18-32 years (relaxation for reserved categories).',
        syllabus: [
            'General Intelligence & Reasoning',
            'General Awareness',
            'Quantitative Aptitude',
            'English Comprehension',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-01-15' },
            { label: 'Application Deadline', date: '2026-03-15' },
            { label: 'Tier 1 Exam', date: '2026-06-01' },
            { label: 'Tier 2 Exam', date: '2026-09-01' },
        ],
        updates: [
            { title: 'Notification Released', summary: 'Official notification published on SSC website', timestamp: '2d ago' },
        ],
        relatedExams: ['ssc-chsl', 'upsc-cse'],
        sources: [{ name: 'SSC Official', url: 'https://ssc.nic.in' }],
        ttl: 24,
    },
    'ssc-chsl': {
        name: 'SSC CHSL 2026',
        slug: 'ssc-chsl',
        conductingBody: 'Staff Selection Commission',
        examType: 'central',
        domains: ['ssc', 'government'],
        states: [],
        eligibility: '12th pass from recognized board. Age 18-27 years.',
        syllabus: [
            'English Language',
            'General Intelligence',
            'Quantitative Aptitude',
            'General Awareness',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-02-01' },
            { label: 'Application Deadline', date: '2026-04-01' },
            { label: 'Tier 1 Exam', date: '2026-07-15' },
        ],
        updates: [],
        relatedExams: ['ssc-cgl', 'ssc-mts'],
        sources: [{ name: 'SSC Official', url: 'https://ssc.nic.in' }],
        ttl: 24,
    },
    'upsc-cse': {
        name: 'UPSC Civil Services 2026',
        slug: 'upsc-cse',
        conductingBody: 'Union Public Service Commission',
        examType: 'central',
        domains: ['upsc', 'government', 'ias'],
        states: [],
        eligibility: 'Graduate from recognized university. Age 21-32 years. Maximum 6 attempts for General category.',
        syllabus: [
            'Prelims: General Studies, CSAT',
            'Mains: Essay, GS I-IV, Optional',
            'Interview/Personality Test',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-02-15' },
            { label: 'Application Deadline', date: '2026-03-15' },
            { label: 'Prelims', date: '2026-05-26' },
            { label: 'Mains', date: '2026-09-20' },
        ],
        updates: [
            { title: 'Prelims Results', summary: 'Results expected next week. Over 5 lakh candidates appeared.', timestamp: '1w ago' },
        ],
        relatedExams: ['upsc-nda', 'ssc-cgl'],
        sources: [{ name: 'UPSC Official', url: 'https://upsc.gov.in' }],
        ttl: 24,
    },
    'ibps-po': {
        name: 'IBPS PO 2026',
        slug: 'ibps-po',
        conductingBody: 'Institute of Banking Personnel Selection',
        examType: 'central',
        domains: ['banking', 'government'],
        states: [],
        eligibility: 'Graduate from recognized university. Age 20-30 years.',
        syllabus: [
            'English Language',
            'Quantitative Aptitude',
            'Reasoning Ability',
            'Computer Aptitude',
            'General/Economy/Banking Awareness',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-08-01' },
            { label: 'Prelims', date: '2026-10-05' },
            { label: 'Mains', date: '2026-11-20' },
        ],
        updates: [
            { title: 'Exam Date Announced', summary: 'IBPS confirms exam schedule for probationary officers.', timestamp: '3d ago' },
        ],
        relatedExams: ['ibps-clerk', 'sbi-po'],
        sources: [{ name: 'IBPS Official', url: 'https://ibps.in' }],
        ttl: 24,
    },
    'rbi-grade-b': {
        name: 'RBI Grade B 2026',
        slug: 'rbi-grade-b',
        conductingBody: 'Reserve Bank of India',
        examType: 'central',
        domains: ['banking', 'government', 'rbi'],
        states: [],
        eligibility: 'Graduate with minimum 60% marks. Age 21-30 years.',
        syllabus: [
            'Phase 1: General Awareness, Quantitative Aptitude, English, Reasoning',
            'Phase 2: Economic & Social Issues, Finance & Management, English Writing',
            'Interview',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-03-01' },
            { label: 'Application Deadline', date: '2026-04-01' },
            { label: 'Phase 1', date: '2026-05-15' },
        ],
        updates: [
            { title: 'Recruitment Open', summary: 'RBI invites applications for 300+ Grade B officer positions.', timestamp: '1d ago' },
        ],
        relatedExams: ['ibps-po', 'sebi-grade-a'],
        sources: [{ name: 'RBI Careers', url: 'https://rbi.org.in/scripts/Careers.aspx' }],
        ttl: 24,
    },
    // state exams
    'uppsc-pcs': {
        name: 'UPPSC PCS 2026',
        slug: 'uppsc-pcs',
        conductingBody: 'Uttar Pradesh Public Service Commission',
        examType: 'state',
        domains: ['psc', 'government'],
        states: ['Uttar Pradesh'],
        eligibility: 'Graduate from recognized university. Domicile of UP required for some posts.',
        syllabus: [
            'Prelims: General Studies I & II',
            'Mains: General Hindi, Essay, GS I-IV, Optional',
            'Interview',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-04-01' },
            { label: 'Prelims', date: '2026-07-15' },
        ],
        updates: [],
        relatedExams: ['upsc-cse', 'mppsc'],
        sources: [{ name: 'UPPSC Official', url: 'https://uppsc.up.nic.in' }],
        ttl: 24,
    },
    'mpsc': {
        name: 'MPSC State Services 2026',
        slug: 'mpsc',
        conductingBody: 'Maharashtra Public Service Commission',
        examType: 'state',
        domains: ['psc', 'government'],
        states: ['Maharashtra'],
        eligibility: 'Graduate from recognized university. Domicile of Maharashtra.',
        syllabus: [
            'Prelims: GS & CSAT',
            'Mains: Marathi, English, Essay, GS I-IV',
            'Interview',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-03-15' },
            { label: 'Prelims', date: '2026-06-20' },
        ],
        updates: [],
        relatedExams: ['upsc-cse', 'uppsc-pcs'],
        sources: [{ name: 'MPSC Official', url: 'https://mpsc.gov.in' }],
        ttl: 24,
    },
    'kpsc': {
        name: 'KPSC KAS 2026',
        slug: 'kpsc',
        conductingBody: 'Karnataka Public Service Commission',
        examType: 'state',
        domains: ['psc', 'government'],
        states: ['Karnataka'],
        eligibility: 'Graduate from recognized university. Domicile of Karnataka.',
        syllabus: [
            'Prelims: GS & Mental Ability',
            'Mains: Kannada, English, GS I-IV, Optional',
            'Interview',
        ],
        importantDates: [
            { label: 'Notification', date: '2026-05-01' },
            { label: 'Prelims', date: '2026-08-10' },
        ],
        updates: [],
        relatedExams: ['upsc-cse', 'mpsc'],
        sources: [{ name: 'KPSC Official', url: 'https://kpsc.kar.nic.in' }],
        ttl: 24,
    },
}

// get exam by slug
export function getExam(slug: string): ExamEntity | null {
    return examStore[slug] || null
}

// get all exams
export function getAllExams(): ExamEntity[] {
    return Object.values(examStore)
}

// filter by state (includes central exams)
export function getExamsByState(state: string): ExamEntity[] {
    return getAllExams().filter(
        (exam) => exam.states.length === 0 || exam.states.includes(state)
    )
}

// filter by domain
export function getExamsByDomain(domain: string): ExamEntity[] {
    return getAllExams().filter((exam) => exam.domains.includes(domain))
}

// filter by exam type
export function getExamsByType(type: ExamType): ExamEntity[] {
    return getAllExams().filter((exam) => exam.examType === type)
}

// combined filter using user context
export function getExamsForContext(state?: string, domains?: string[]): ExamEntity[] {
    let exams = getAllExams()

    // filter by state if provided
    if (state) {
        exams = exams.filter(
            (exam) => exam.states.length === 0 || exam.states.includes(state)
        )
    }

    // filter by domains if provided
    if (domains && domains.length > 0) {
        exams = exams.filter((exam) =>
            exam.domains.some((d) => domains.includes(d))
        )
    }

    return exams
}

// exam slug helper
export function examToSlug(name: string): string {
    return name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
