from fastapi import APIRouter

router = APIRouter()

RIGHTS = [
    {
        "id": "education",
        "title": "Right to Inclusive Education",
        "act_section": "RPWD Act 2016 — Chapter III",
        "summary": "Every child with benchmark disability between 6-18 years has the right to free and inclusive education in a neighbourhood school.",
        "details": [
            "Free education up to Class 12 in government schools",
            "Right to reasonable accommodation and support services",
            "No school can refuse admission solely on basis of disability",
            "Special educators must be provided",
            "Accessible infrastructure is mandatory in all schools",
        ],
        "what_to_do_if_violated": "File complaint with District Education Officer or State Commissioner for Persons with Disabilities.",
    },
    {
        "id": "employment",
        "title": "Right to Employment & Reservation",
        "act_section": "RPWD Act 2016 — Chapter VI",
        "summary": "4% reservation in all central government establishments. No employer can discriminate against differently-abled persons in hiring, promotion, or conditions of service.",
        "details": [
            "4% reservation in all central government jobs",
            "Age relaxation of 10 years in government recruitment",
            "No discrimination in promotion or service conditions",
            "Employers must provide reasonable accommodation",
            "Private sector encouraged to maintain at least 5% differently-abled workforce",
        ],
        "what_to_do_if_violated": "File complaint with Chief Commissioner for Persons with Disabilities at disabilityaffairs.gov.in.",
    },
    {
        "id": "accessibility",
        "title": "Right to Accessibility",
        "act_section": "RPWD Act 2016 — Chapter II",
        "summary": "All public buildings, transport, and digital infrastructure must be accessible to differently-abled persons within mandated timelines.",
        "details": [
            "All government buildings must have ramps, accessible toilets, and lifts",
            "Public transport must accommodate differently-abled passengers",
            "All government websites must comply with accessibility standards",
            "New public constructions must be 100% accessible",
            "Violations are punishable under the Act",
        ],
        "what_to_do_if_violated": "Report at accessibleindia.gov.in or file complaint with State Commissioner.",
    },
    {
        "id": "social_security",
        "title": "Right to Social Security",
        "act_section": "RPWD Act 2016 — Chapter VIII",
        "summary": "Persons with benchmark disability are entitled to insurance schemes, unemployment allowance if they cannot find work, and rehabilitation services.",
        "details": [
            "Insurance schemes for differently-abled persons",
            "Unemployment allowance for those who have completed education but cannot find employment",
            "Rehabilitation services at government cost",
            "Priority in allotment of government housing",
            "Priority in poverty alleviation schemes",
        ],
        "what_to_do_if_violated": "Contact District Social Welfare Officer or State Commissioner for Persons with Disabilities.",
    },
    {
        "id": "legal_capacity",
        "title": "Right to Legal Capacity",
        "act_section": "RPWD Act 2016 — Chapter IV",
        "summary": "Every differently-abled person has the right to make their own decisions. Legal capacity cannot be denied solely on basis of disability.",
        "details": [
            "Right to vote and participate in civic life",
            "Right to own property and enter into contracts",
            "Right to marry and found a family",
            "Supported decision-making framework instead of substituted decision-making",
            "Guardianship only as last resort with safeguards",
        ],
        "what_to_do_if_violated": "Seek legal aid from State Legal Services Authority (SLSA) in your state.",
    },
    {
        "id": "grievance",
        "title": "Grievance Redressal",
        "act_section": "RPWD Act 2016 — Chapter XIV",
        "summary": "Every government establishment must have a designated Grievance Redressal Officer. The State Commissioner has quasi-judicial powers to hear complaints.",
        "details": [
            "Every government establishment must have a Grievance Redressal Officer for disability complaints",
            "State Commissioner can issue orders to remedy violations",
            "Chief Commissioner at central level handles inter-state and central government violations",
            "Complaints can be filed online at disabilityaffairs.gov.in",
            "Time-bound resolution mandated",
        ],
        "what_to_do_if_violated": "File directly with State Commissioner or Chief Commissioner for Persons with Disabilities.",
    },
]

@router.get("/rights")
def get_rights():
    return {
        "rights": RIGHTS,
        "total": len(RIGHTS),
        "act": "Rights of Persons with Disabilities Act, 2016",
        "commissioner_portal": "https://disabilityaffairs.gov.in",
    }

@router.get("/rights/{right_id}")
def get_right(right_id: str):
    for r in RIGHTS:
        if r["id"] == right_id:
            return r
    return {"error": f"Right '{right_id}' not found"}
