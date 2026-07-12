from fastapi import APIRouter
from services.rag import embedder, get_index
import hashlib
import re
import requests
from bs4 import BeautifulSoup
import time

router = APIRouter()

CHUNK_SIZE = 400
CHUNK_OVERLAP = 50

SCHEME_TEXTS = [
    {
        "source": "UDID Scheme — Ministry of Social Justice & Empowerment",
        "category": "identity",
        "text": "The Unique Disability ID (UDID) project was launched by the Ministry of Social Justice and Empowerment to create a national database for differently-abled persons and to issue a Unique Disability Identity Card. The UDID card serves as a single document of identity and disability for differently-abled persons across the country. It eliminates the need to produce multiple documents for availing various benefits and schemes. Any person with benchmark disability of 40 percent or more as assessed by a government medical authority is eligible to apply. Applications can be submitted online at swavlambancard.gov.in or at the nearest District Hospital or Chief Medical Officer office. Documents required include Aadhaar card, a recent passport photograph, age proof, address proof, and any existing disability certificate. The medical examination is conducted free of cost by a government-appointed medical board. After assessment, the UDID card is issued and mailed to the applicant registered address.",
    },
    {
        "source": "Niramaya Health Insurance Scheme — National Trust",
        "category": "health",
        "text": "Niramaya is a health insurance scheme launched by the National Trust under the Ministry of Social Justice and Empowerment for persons with autism, cerebral palsy, mental retardation, and multiple disabilities. The scheme provides health coverage of up to Rs. 1,00,000 per annum per beneficiary. For families below the poverty line, the annual premium is Rs. 250. For non-BPL families, the premium is Rs. 500 per year. Coverage includes OPD treatment up to Rs. 15,000, hospitalisation up to Rs. 75,000, corrective surgeries, alternative therapies, transportation charges for medical treatment, and non-surgical dental and vision treatment. Enrollment is done through National Trust implementing organisations and local level committees.",
    },
    {
        "source": "NHFDC Loan Schemes — National Handicapped Finance and Development Corporation",
        "category": "finance",
        "text": "The National Handicapped Finance and Development Corporation provides financial assistance to differently-abled persons for self-employment, education, and livelihood activities at concessional interest rates. Loan schemes include General Loan Scheme with loans from Rs. 50,000 to Rs. 30 lakh at 5 to 8 percent interest per annum. Micro Credit Finance Scheme provides loans up to Rs. 50,000 at 5 percent interest for micro enterprises. Education Loan provides loans up to Rs. 10 lakh for professional and technical education. Eligibility requires 40 percent or more disability, annual family income below Rs. 3,00,000 for general scheme. Applications are submitted through State Channelising Agencies in each state.",
    },
    {
        "source": "RPWD Act 2016 — Rights of Persons with Disabilities Act",
        "category": "rights",
        "text": "The Rights of Persons with Disabilities Act 2016 is the primary legislation governing rights of differently-abled persons in India. It expanded the number of recognised disabilities from 7 to 21 categories. Key provisions include 4 percent reservation in all central government establishments for persons with benchmark disability. Free inclusive education for children with benchmark disability between 6 and 18 years of age. Right to live independently in the community. Mandatory accessibility in all public buildings, transport, and digital infrastructure. Legal capacity for all differently-abled persons. Social security including insurance and unemployment allowance. The 21 recognised disability categories include locomotor disability, visual impairment, hearing impairment, speech and language disability, intellectual disability, specific learning disabilities, mental illness, autism spectrum disorder, cerebral palsy, muscular dystrophy, acid attack victims, Parkinson disease, multiple sclerosis, chronic neurological conditions, dwarfism, blood disorders, and multiple disabilities. Benchmark disability refers to 40 percent or more disability as certified by the designated medical authority.",
    },
    {
        "source": "Pre-Matric and Post-Matric Scholarship — Ministry of Social Justice & Empowerment",
        "category": "education",
        "text": "The Ministry of Social Justice and Empowerment operates Pre-Matric and Post-Matric Scholarship schemes for differently-abled students. Pre-Matric Scholarship covers students studying in Class 9 and Class 10. Eligibility requires 40 percent or more disability and parental annual income below Rs. 2,50,000. Benefits include maintenance allowance of Rs. 700 per month for day scholars and Rs. 900 per month for hostellers, book grant of Rs. 1,000 per annum, and disability allowance of Rs. 160 per month. Post-Matric Scholarship covers students studying from Class 11 onwards including graduation, post-graduation, and professional courses. Applications are submitted through the National Scholarship Portal at scholarships.gov.in.",
    },
    {
        "source": "ADIP Scheme — Assistance to Disabled Persons for Purchase of Aids and Appliances",
        "category": "assistive",
        "text": "The ADIP scheme is implemented by the Ministry of Social Justice and Empowerment through ALIMCO and NGOs. The scheme provides free or subsidised assistive devices to differently-abled persons of low income. Persons with monthly income below Rs. 20,000 receive devices free of cost. Persons with income between Rs. 20,001 and Rs. 35,000 receive devices at 50 percent cost. Devices available include tricycles, wheelchairs, crutches, walking sticks, artificial limbs, calipers, hearing aids, cochlear implants, braille kits, smart canes for visually impaired, and low vision aids. ALIMCO conducts regular distribution camps across districts. Required documents include UDID card or disability certificate, Aadhaar card, income certificate, and passport photograph.",
    },
    {
        "source": "Employment Reservation and NCS Portal — Central Government",
        "category": "employment",
        "text": "Under the RPWD Act 2016, 4 percent of vacancies in every central government establishment must be reserved for persons with benchmark disability. This horizontal reservation is distributed as 1 percent each for blindness and low vision, deaf and hard of hearing, locomotor disability and cerebral palsy, and autism intellectual disability specific learning disability and mental illness. Age relaxation of 10 years is provided to differently-abled candidates in central government recruitment, and 15 years for SC/ST differently-abled candidates. Application fees are waived for differently-abled candidates in most central government recruitment including SSC, UPSC, Railways, Banking, and defence civilian posts. The National Career Service Portal at ncs.gov.in has a dedicated section for differently-abled job seekers.",
    },
    {
        "source": "Accessible India Campaign — Sugamya Bharat Abhiyan",
        "category": "accessibility",
        "text": "The Accessible India Campaign was launched by the Ministry of Social Justice and Empowerment to create a barrier-free and accessible environment for differently-abled persons. Three focus areas are the built environment, transport ecosystem, and information and communication technology ecosystem. For built environment, 50 percent of all government buildings in each state capital must be fully accessible. Railway stations in A1 and A category must have accessible features including ramps, accessible toilets, tactile paths, and audio announcements. All government websites must comply with Web Content Accessibility Guidelines 2.0. Citizens can report inaccessible public infrastructure at accessibleindia.gov.in.",
    },
    {
        "source": "AASRA Scheme — Home Based Care by National Trust",
        "category": "care",
        "text": "AASRA is a scheme by the National Trust under the Ministry of Social Justice and Empowerment that provides home-based rehabilitation support for persons with autism, cerebral palsy, intellectual disability, and multiple disabilities who are unable to attend rehabilitation centres. The scheme trains and deploys home-based caregivers who visit beneficiaries regularly. Services include life skills training, communication support, sensory stimulation, physiotherapy guidance, and family counselling. Enrollment is done through registered implementing organisations of the National Trust in your district.",
    },
    {
        "source": "SIPDA Scheme — Scheme for Implementation of RPWD Act",
        "category": "welfare",
        "text": "SIPDA is a Central Sector Scheme under the Ministry of Social Justice and Empowerment. It funds activities related to implementation of the RPWD Act 2016 including awareness generation, training of stakeholders, accessibility audits, support to State Commissioners offices, capacity building of NGOs, and infrastructure development for differently-abled persons. Funds are provided to state governments, district authorities, NGOs, and institutions. The scheme also supports resource centres for differently-abled persons at district level and State Disability Welfare Boards.",
    },
]

WIKIPEDIA_ARTICLES = [
    ("Rights of Persons with Disabilities Act, 2016", "rights"),
    ("Disability in India", "general"),
    ("National Handicapped Finance and Development Corporation", "finance"),
    ("Unique Disability ID", "identity"),
    ("Accessible India Campaign", "accessibility"),
    ("National Scholarship Portal", "education"),
    ("Skill India", "employment"),
    ("National Career Service", "employment"),
    ("Staff Selection Commission (India)", "employment"),
    ("Cerebral palsy", "health"),
    ("Autism spectrum", "health"),
    ("Intellectual disability", "health"),
    ("Special education in India", "education"),
    ("Assistive technology", "accessibility"),
    ("Ministry of Social Justice and Empowerment", "general"),
]

def clean_text(text):
    text = re.sub(r'\[[\d,\s]+\]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def chunk_text(text):
    words = text.split()
    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i + CHUNK_SIZE]
        if len(chunk) >= 30:
            chunks.append(' '.join(chunk))
        i += CHUNK_SIZE - CHUNK_OVERLAP
    return chunks

def embed_and_upsert(chunks, source, category):
    index = get_index()
    vectors = []
    for chunk in chunks:
        chunk_id = hashlib.md5((source + chunk).encode()).hexdigest()
        embedding = embedder.encode(chunk).tolist()
        vectors.append({
            "id": chunk_id,
            "values": embedding,
            "metadata": {"text": chunk, "source": source, "category": category},
        })
    for i in range(0, len(vectors), 100):
        index.upsert(vectors=vectors[i:i + 100])
    return len(vectors)

def scrape_wikipedia(title):
    url = "https://en.wikipedia.org/wiki/" + title.replace(' ', '_')
    try:
        response = requests.get(url, timeout=15, headers={"User-Agent": "AccessMitraBot/1.0"})
        soup = BeautifulSoup(response.text, 'html.parser')
        content_div = soup.find('div', {'id': 'mw-content-text'})
        if not content_div:
            return ""
        for tag in content_div.find_all(['table', 'sup']):
            tag.decompose()
        paragraphs = content_div.find_all('p')
        text = ' '.join(p.get_text() for p in paragraphs)
        return clean_text(text)
    except Exception:
        return ""

@router.post("/ingest")
def run_ingest():
    log = []
    total_vectors = 0

    for item in SCHEME_TEXTS:
        chunks = chunk_text(item["text"])
        count = embed_and_upsert(chunks, item["source"], item["category"])
        total_vectors += count
        log.append(f"Ingested: {item['source']} ({count} vectors)")

    for title, category in WIKIPEDIA_ARTICLES:
        text = scrape_wikipedia(title)
        if text:
            chunks = chunk_text(text)
            count = embed_and_upsert(chunks, f"Wikipedia: {title}", category)
            total_vectors += count
            log.append(f"Ingested Wikipedia: {title} ({count} vectors)")
        else:
            log.append(f"Skipped Wikipedia: {title}")
        time.sleep(0.5)

    stats = get_index().describe_index_stats()

    return {
        "status": "complete",
        "total_vectors_ingested": total_vectors,
        "pinecone_total": stats.total_vector_count,
        "log": log,
    }

@router.get("/ingest/status")
def ingest_status():
    stats = get_index().describe_index_stats()
    return {
        "total_vectors": stats.total_vector_count,
        "ready": stats.total_vector_count > 0,
    }