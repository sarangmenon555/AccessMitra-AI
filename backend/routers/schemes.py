from fastapi import APIRouter

router = APIRouter()

SCHEMES = [
    {
        "id": "udid",
        "name": "UDID Card — Unique Disability ID",
        "ministry": "Ministry of Social Justice & Empowerment",
        "category": "identity",
        "tags": ["all disabilities", "identity", "mandatory"],
        "summary": "A unique ID card for all differently-abled persons in India. Required to access most government schemes and reservations.",
        "eligibility": "Any person with benchmark disability (40% or more) as certified by a government medical authority.",
        "benefit": "Single unified identity document. Enables access to all central and state government schemes.",
        "how_to_apply": "Apply online at swavlambancard.gov.in or visit the nearest District Hospital or CMO office.",
        "portal": "https://www.swavlambancard.gov.in",
        "portal_label": "Apply Online",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
    {
        "id": "niramaya",
        "name": "Niramaya Health Insurance Scheme",
        "ministry": "Ministry of Social Justice & Empowerment / National Trust",
        "category": "health",
        "tags": ["health insurance", "autism", "cerebral palsy", "intellectual disability"],
        "summary": "Health insurance coverage up to Rs. 1 lakh per annum for persons with autism, cerebral palsy, mental retardation, and multiple disabilities.",
        "eligibility": "Persons with autism, cerebral palsy, intellectual disability, or multiple disabilities. BPL families: Rs. 250/year premium. Non-BPL: Rs. 500/year.",
        "benefit": "Health coverage up to Rs. 1,00,000 per year including OPD, hospitalization, surgery, and alternative therapies.",
        "how_to_apply": "Apply through National Trust regional resource centres or district implementing agencies. Visit the official portal for details.",
        "portal": "https://nationaltrust.nic.in/",
        "portal_label": "View Details on Official Portal",
        "disability_types": ["autism", "cerebral palsy", "intellectual", "multiple"],
    },
    {
        "id": "nhfdc",
        "name": "NHFDC Loan Scheme",
        "ministry": "National Handicapped Finance & Development Corporation",
        "category": "finance",
        "tags": ["loan", "self employment", "business", "education"],
        "summary": "Concessional loans for differently-abled persons for self-employment, education, and livelihood activities at subsidised interest rates.",
        "eligibility": "Differently-abled person with 40% or more disability. Annual family income up to Rs. 3 lakh (general) or Rs. 1.5 lakh (micro credit).",
        "benefit": "Loans from Rs. 50,000 to Rs. 30 lakh at 5-8% interest depending on scheme. Education loans up to Rs. 10 lakh.",
        "how_to_apply": "Apply online through the NHFDC loan account portal. Login or register to submit your application.",
        "portal": "https://admin.ndfdcloanaccount.co.in/user-login",
        "portal_label": "Apply Now",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
    {
        "id": "sipda",
        "name": "SIPDA — Scheme for Implementation of RPWD Act",
        "ministry": "Ministry of Social Justice & Empowerment",
        "category": "welfare",
        "tags": ["accessibility", "infrastructure", "awareness"],
        "summary": "Funds NGOs, state governments, and institutions to implement the Rights of Persons with Disabilities Act 2016 through awareness, accessibility, and support services.",
        "eligibility": "Implemented through government bodies and registered NGOs. Individuals benefit indirectly through improved infrastructure.",
        "benefit": "Improved accessibility in public spaces, transport, schools. Support for assistive devices and awareness campaigns.",
        "how_to_apply": "NGOs and state bodies apply to Department of Empowerment of Persons with Disabilities. Visit the official portal for scheme guidelines.",
        "portal": "https://depwd.gov.in/en/sipda/",
        "portal_label": "View Details",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
    {
        "id": "disha",
        "name": "Disha — Early Intervention & School Readiness",
        "ministry": "National Trust / Ministry of Social Justice & Empowerment",
        "category": "care",
        "tags": ["early intervention", "children", "autism", "cerebral palsy", "school readiness"],
        "summary": "Provides early intervention services and school readiness training for children with autism, cerebral palsy, intellectual disability, and multiple disabilities up to age 10.",
        "eligibility": "Children with autism, cerebral palsy, intellectual disability, or multiple disabilities up to 10 years of age.",
        "benefit": "Early intervention therapy, pre-academic skills, sensory integration, communication training, and school readiness support through National Trust implementing organisations.",
        "how_to_apply": "Contact your nearest National Trust implementing organisation. Visit the official portal for details and to find agencies near you.",
        "portal": "https://nationaltrust.nic.in/disha-scheme/",
        "portal_label": "View Details",
        "disability_types": ["autism", "cerebral palsy", "intellectual", "multiple"],
    },
    {
        "id": "vikaas",
        "name": "Vikaas — Day Care & Vocational Training",
        "ministry": "National Trust / Ministry of Social Justice & Empowerment",
        "category": "care",
        "tags": ["day care", "vocational training", "adults", "autism", "cerebral palsy"],
        "summary": "Provides day care and vocational training for persons with autism, cerebral palsy, intellectual disability, and multiple disabilities above age 10.",
        "eligibility": "Persons above 10 years of age with autism, cerebral palsy, intellectual disability, or multiple disabilities.",
        "benefit": "Day care services, vocational skills training, life skills development, recreational activities, and community participation support.",
        "how_to_apply": "Contact your nearest National Trust implementing organisation. Visit the official portal for details and to find agencies near you.",
        "portal": "https://nationaltrust.nic.in/vikaas-scheme/",
        "portal_label": "View Details",
        "disability_types": ["autism", "cerebral palsy", "intellectual", "multiple"],
    },
    {
        "id": "scholarship_pre_matric",
        "name": "Pre-Matric Scholarship for Students with Disabilities",
        "ministry": "Ministry of Social Justice & Empowerment",
        "category": "education",
        "tags": ["scholarship", "students", "school", "pre-matric"],
        "summary": "Scholarship for differently-abled students studying in Class 9 and 10 to prevent dropout and support education.",
        "eligibility": "Student with 40% or more disability studying in Class 9 or 10. Parental income below Rs. 2.5 lakh per annum.",
        "benefit": "Maintenance allowance, book grant, and disability allowance. Day scholar: Rs. 700/month. Hosteller: Rs. 900/month.",
        "how_to_apply": "Apply through National Scholarship Portal (scholarships.gov.in) before annual deadline.",
        "portal": "https://scholarships.gov.in",
        "portal_label": "Apply Online",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
    {
        "id": "scholarship_post_matric",
        "name": "Post-Matric Scholarship for Students with Disabilities",
        "ministry": "Ministry of Social Justice & Empowerment",
        "category": "education",
        "tags": ["scholarship", "students", "college", "post-matric"],
        "summary": "Scholarship for differently-abled students pursuing education beyond Class 10 including graduation, post-graduation, and professional courses.",
        "eligibility": "Student with 40% or more disability. Studying in Class 11 onwards. Parental income below Rs. 2.5 lakh per annum.",
        "benefit": "Course fee, maintenance allowance, book grant, disability allowance. Varies by course and institution type.",
        "how_to_apply": "Apply through National Scholarship Portal (scholarships.gov.in).",
        "portal": "https://scholarships.gov.in",
        "portal_label": "Apply Online",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
    {
        "id": "assistive_devices",
        "name": "ADIP Scheme — Assistive Devices",
        "ministry": "Ministry of Social Justice & Empowerment / ALIMCO",
        "category": "assistive",
        "tags": ["wheelchair", "hearing aid", "crutches", "assistive devices"],
        "summary": "Provides free or subsidised assistive devices to differently-abled persons of low income through ALIMCO camps and distribution drives.",
        "eligibility": "Differently-abled person with 40% or more disability. Monthly income below Rs. 20,000 (free) or Rs. 35,000 (subsidised).",
        "benefit": "Wheelchairs, crutches, hearing aids, artificial limbs, braille kits, tricycles — free or at subsidised rates.",
        "how_to_apply": "Apply online through the ADIP portal or visit nearest ALIMCO distribution camp. Contact District Social Welfare Officer for offline applications.",
        "portal": "https://adip.depwd.gov.in/",
        "portal_label": "Apply Online",
        "disability_types": ["locomotor", "visual", "hearing", "multiple"],
    },
    {
        "id": "rpwd_reservation",
        "name": "RPWD Act — 4% Job Reservation",
        "ministry": "Ministry of Social Justice & Empowerment",
        "category": "employment",
        "tags": ["job reservation", "government jobs", "central services"],
        "summary": "The RPWD Act 2016 mandates 4% reservation in all central government jobs for differently-abled persons across 21 disability categories.",
        "eligibility": "Differently-abled person with UDID card and 40%+ disability. Applicable to all Group A, B, C, D central government posts.",
        "benefit": "4% horizontal reservation across all central government vacancies. Age relaxation of 10 years (15 for SC/ST).",
        "how_to_apply": "Search for central government job vacancies with disability reservation on the National Career Service portal.",
        "portal": "https://www.ncs.gov.in/",
        "portal_label": "Search Jobs",
        "disability_types": ["locomotor", "visual", "hearing", "intellectual", "mental", "autism", "multiple"],
    },
]

DISABILITY_TYPES = [
    "locomotor", "visual", "hearing", "intellectual",
    "mental", "autism", "cerebral palsy", "multiple", "speech"
]

CATEGORIES = [
    "identity", "health", "finance", "welfare",
    "care", "education", "assistive", "employment"
]

@router.get("/schemes")
def get_all_schemes():
    return {
        "schemes": [
            {
                "id": s["id"],
                "name": s["name"],
                "ministry": s["ministry"],
                "category": s["category"],
                "tags": s["tags"],
                "summary": s["summary"],
                "portal": s["portal"],
                "portal_label": s["portal_label"],
            }
            for s in SCHEMES
        ],
        "total": len(SCHEMES),
        "categories": CATEGORIES,
        "disability_types": DISABILITY_TYPES,
    }

@router.get("/schemes/{scheme_id}")
def get_scheme(scheme_id: str):
    for s in SCHEMES:
        if s["id"] == scheme_id:
            return s
    return {"error": f"Scheme '{scheme_id}' not found"}

@router.get("/schemes/filter/{disability_type}")
def get_schemes_by_disability(disability_type: str):
    filtered = [s for s in SCHEMES if disability_type.lower() in s["disability_types"]]
    return {"schemes": filtered, "total": len(filtered), "disability_type": disability_type}

@router.get("/schemes/category/{category}")
def get_schemes_by_category(category: str):
    filtered = [s for s in SCHEMES if s["category"] == category]
    return {"schemes": filtered, "total": len(filtered), "category": category}