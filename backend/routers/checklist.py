from fastapi import APIRouter

router = APIRouter()

CHECKLISTS = {
    "udid": {
        "scheme_name": "UDID Card Registration",
        "documents": [
            "Recent passport-size photograph",
            "Aadhaar Card (mandatory)",
            "Disability Certificate from a government hospital (if already issued)",
            "Age proof (Birth Certificate / Aadhaar / School Certificate)",
            "Address proof (Aadhaar / Voter ID / Ration Card)",
        ],
        "steps": [
            "Visit swavlambancard.gov.in and register online",
            "Fill in personal and disability details",
            "Schedule medical examination at your nearest government hospital",
            "Attend medical examination — a government doctor will assess your disability percentage",
            "UDID card will be mailed to your registered address after approval",
        ],
        "time_required": "30-90 days after medical examination",
        "cost": "Free",
        "portal": "https://www.swavlambancard.gov.in",
    },
    "niramaya": {
        "scheme_name": "Niramaya Health Insurance",
        "documents": [
            "UDID Card or Disability Certificate (40% or more)",
            "Aadhaar Card",
            "Income Certificate from Tehsildar / Revenue Authority",
            "Recent passport-size photograph",
            "Bank account passbook (for premium payment)",
        ],
        "steps": [
            "Contact your nearest National Trust implementing organisation",
            "Fill the Niramaya enrollment form",
            "Submit documents and pay annual premium (Rs. 250 for BPL, Rs. 500 for others)",
            "Receive Niramaya insurance card",
            "Use card at empanelled hospitals for cashless treatment",
        ],
        "time_required": "7-14 days after document submission",
        "cost": "Rs. 250/year (BPL) or Rs. 500/year (Non-BPL)",
        "portal": "https://thenationaltrust.gov.in",
    },
    "nhfdc": {
        "scheme_name": "NHFDC Loan",
        "documents": [
            "UDID Card or Disability Certificate (40% or more)",
            "Aadhaar Card and PAN Card",
            "Income Certificate (family income below Rs. 3 lakh)",
            "Bank account passbook (last 6 months statements)",
            "Passport-size photographs (4 copies)",
            "Project report or business plan (for self-employment loans)",
            "Proof of educational qualification (for education loans)",
            "Quotation for equipment/asset to be purchased",
        ],
        "steps": [
            "Contact your State Channelising Agency (SCA) — list at nhfdc.nic.in",
            "Submit application form with all documents to SCA",
            "SCA conducts field verification of your proposal",
            "SCA forwards eligible application to NHFDC",
            "NHFDC sanctions and disburses loan through SCA",
        ],
        "time_required": "30-60 days after complete application",
        "cost": "5-8% interest per annum depending on scheme",
        "portal": "https://www.nhfdc.nic.in",
    },
    "scholarship_post_matric": {
        "scheme_name": "Post-Matric Scholarship",
        "documents": [
            "UDID Card or Disability Certificate (40% or more)",
            "Aadhaar Card",
            "Previous year marksheet and passing certificate",
            "Current year admission proof (fee receipt / bonafide certificate)",
            "Income Certificate (parental income below Rs. 2.5 lakh)",
            "Bank account passbook (in student's name)",
            "Caste certificate (if applicable)",
            "Passport-size photograph",
        ],
        "steps": [
            "Register on National Scholarship Portal at scholarships.gov.in",
            "Fill scholarship application form online",
            "Upload all scanned documents",
            "Submit application before deadline (usually October-November)",
            "Institute verifies your application",
            "State government approves and transfers scholarship to bank account",
        ],
        "time_required": "3-6 months after application deadline",
        "cost": "Free — scholarship amount received",
        "portal": "https://scholarships.gov.in",
    },
    "assistive_devices": {
        "scheme_name": "ADIP Assistive Devices",
        "documents": [
            "UDID Card or Disability Certificate (40% or more)",
            "Aadhaar Card",
            "Income Certificate (income below Rs. 20,000/month for free, Rs. 35,000 for subsidised)",
            "Medical prescription for required device from a government doctor",
            "Passport-size photograph",
            "Bank account passbook",
        ],
        "steps": [
            "Check ALIMCO camp schedule at alimco.in for camps in your district",
            "OR contact District Social Welfare Officer for year-round applications",
            "Submit application with documents at camp or district office",
            "Medical assessment conducted on-site or at referral hospital",
            "Device distributed at camp or delivered after fitting",
        ],
        "time_required": "Immediate at camp, or 30-60 days for district application",
        "cost": "Free (income below Rs. 20,000) or subsidised (up to Rs. 35,000)",
        "portal": "https://www.alimco.in",
    },
}

@router.get("/checklist/{scheme_id}")
def get_checklist(scheme_id: str):
    if scheme_id not in CHECKLISTS:
        return {"error": f"No checklist available for scheme '{scheme_id}'"}
    return CHECKLISTS[scheme_id]

@router.get("/checklists")
def get_all_checklists():
    return {
        "available": list(CHECKLISTS.keys()),
        "total": len(CHECKLISTS),
    }
