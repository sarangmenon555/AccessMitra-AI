from fastapi import APIRouter

router = APIRouter()

JOB_RESOURCES = [
    {
        "id": "ncs",
        "name": "National Career Service Portal",
        "type": "portal",
        "description": "Central government job portal with dedicated section for differently-abled job seekers. Lists government and private vacancies with disability filters.",
        "url": "https://www.ncs.gov.in",
        "disability_filter": True,
    },
    {
        "id": "rpwd_reservation",
        "name": "4% Central Government Reservation",
        "type": "entitlement",
        "description": "Under RPWD Act 2016, 4% of all central government posts are reserved for differently-abled persons. Applies to SSC, UPSC, Railways, Banks, and all central recruitments.",
        "url": "https://disabilityaffairs.gov.in",
        "disability_filter": False,
    },
    {
        "id": "ssc",
        "name": "Staff Selection Commission (SSC)",
        "type": "recruitment",
        "description": "Conducts recruitment for Group B and C central government posts. Differently-abled candidates get age relaxation and fee exemption in most exams.",
        "url": "https://ssc.nic.in",
        "disability_filter": False,
    },
    {
        "id": "upsc",
        "name": "UPSC Civil Services",
        "type": "recruitment",
        "description": "UPSC provides 4% horizontal reservation for differently-abled candidates across all services. Age relaxation of 10 years applicable.",
        "url": "https://upsc.gov.in",
        "disability_filter": False,
    },
    {
        "id": "railways",
        "name": "Indian Railways Recruitment",
        "type": "recruitment",
        "description": "Railway Recruitment Boards provide disability reservation across all recruitment categories. Many posts suitable for differently-abled candidates.",
        "url": "https://indianrailways.gov.in",
        "disability_filter": False,
    },
    {
        "id": "nehru_emp",
        "name": "National Apprenticeship Promotion Scheme",
        "type": "training",
        "description": "Provides apprenticeship training with stipend. Differently-abled apprentices receive priority placement support.",
        "url": "https://apprenticeshipindia.gov.in",
        "disability_filter": False,
    },
    {
        "id": "skill_india",
        "name": "Skill India — PMKVY for Differently-Abled",
        "type": "training",
        "description": "Pradhan Mantri Kaushal Vikas Yojana has dedicated skill training programs for differently-abled persons with stipend and placement support.",
        "url": "https://skillindiadigital.gov.in",
        "disability_filter": False,
    },
]

@router.get("/jobs")
def get_job_resources():
    return {
        "resources": JOB_RESOURCES,
        "total": len(JOB_RESOURCES),
        "note": "Central government positions carry 4% horizontal reservation for differently-abled persons under RPWD Act 2016.",
    }
