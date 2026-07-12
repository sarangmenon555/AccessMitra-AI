from fastapi import APIRouter
from pydantic import BaseModel
from routers.schemes import SCHEMES

router = APIRouter()

class EligibilityRequest(BaseModel):
    disability_type: str
    age: int
    income_lakh: float
    employment_status: str
    education_level: str
    state: str

class SchemeMatch(BaseModel):
    id: str
    name: str
    summary: str
    reason: str
    priority: str
    portal: str

@router.post("/eligibility")
def check_eligibility(req: EligibilityRequest) -> dict:
    matches = []

    for scheme in SCHEMES:
        if req.disability_type.lower() not in scheme["disability_types"] and "multiple" not in scheme["disability_types"]:
            continue

        reason = ""
        priority = "medium"

        if scheme["id"] == "udid":
            reason = "Every differently-abled person should have a UDID card — it unlocks all other schemes."
            priority = "high"

        elif scheme["id"] == "niramaya":
            if req.disability_type in ["autism", "cerebral palsy", "intellectual", "multiple"]:
                reason = f"As a person with {req.disability_type}, you qualify for health insurance up to Rs. 1 lakh/year."
                priority = "high"
            else:
                continue

        elif scheme["id"] == "nhfdc":
            if req.income_lakh <= 3.0 and req.employment_status in ["unemployed", "self-employed"]:
                reason = f"With income below Rs. 3 lakh and {req.employment_status} status, you may qualify for concessional loans."
                priority = "high"
            else:
                continue

        elif scheme["id"] == "scholarship_pre_matric":
            if req.age <= 16 and req.income_lakh <= 2.5 and req.education_level in ["class 9", "class 10"]:
                reason = "You qualify for pre-matric scholarship as a student in Class 9/10."
                priority = "high"
            else:
                continue

        elif scheme["id"] == "scholarship_post_matric":
            if req.age <= 30 and req.income_lakh <= 2.5 and req.education_level in ["class 11", "class 12", "graduate", "post-graduate"]:
                reason = "You qualify for post-matric scholarship for your current education level."
                priority = "high"
            else:
                continue

        elif scheme["id"] == "assistive_devices":
            if req.disability_type in ["locomotor", "visual", "hearing", "multiple"] and req.income_lakh <= 2.0:
                reason = f"You may receive free assistive devices such as wheelchairs, hearing aids, or crutches based on your disability type."
                priority = "high"
            elif req.disability_type in ["locomotor", "visual", "hearing", "multiple"] and req.income_lakh <= 3.5:
                reason = f"You may receive subsidised assistive devices based on your income level."
                priority = "medium"
            else:
                continue

        elif scheme["id"] == "rpwd_reservation":
            if req.employment_status in ["unemployed", "job-seeking"]:
                reason = "You can apply for central government jobs under 4% disability reservation."
                priority = "high"
            else:
                reason = "You are entitled to 4% reservation in central government employment."
                priority = "medium"

        elif scheme["id"] == "sipda":
            reason = "You benefit from improved accessibility infrastructure funded under SIPDA."
            priority = "low"

        elif scheme["id"] == "aasra":
            if req.disability_type in ["autism", "cerebral palsy", "intellectual", "multiple"]:
                reason = "You may receive home-based care and rehabilitation support."
                priority = "medium"
            else:
                continue

        elif scheme["id"] == "accessible_india":
            reason = "You are entitled to accessible public infrastructure under the Accessible India Campaign."
            priority = "low"

        else:
            reason = "This scheme may be relevant to your profile."
            priority = "low"

        matches.append({
            "id": scheme["id"],
            "name": scheme["name"],
            "summary": scheme["summary"],
            "reason": reason,
            "priority": priority,
            "portal": scheme["portal"],
        })

    priority_order = {"high": 0, "medium": 1, "low": 2}
    matches.sort(key=lambda x: priority_order.get(x["priority"], 3))

    return {
        "matches": matches,
        "total": len(matches),
        "profile": {
            "disability_type": req.disability_type,
            "age": req.age,
            "income_lakh": req.income_lakh,
            "employment_status": req.employment_status,
        },
    }
