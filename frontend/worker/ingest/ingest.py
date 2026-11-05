import argparse
import hashlib
import json
import os
import re
import sys
import time
from pathlib import Path

import requests
from dotenv import load_dotenv

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"
MAX_WORDS = 220
API_VERSION = "2024-07"

load_dotenv(HERE / ".env")


def load_json(name: str) -> dict:
    with open(DATA / name, encoding="utf-8") as fh:
        return json.load(fh)


def split_sentences(text: str) -> list[str]:
    return [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]


def chunk_document(text: str, max_words: int = MAX_WORDS) -> list[str]:
    chunks: list[str] = []
    for paragraph in [p.strip() for p in re.split(r"\n\s*\n", text) if p.strip()]:
        words = paragraph.split()
        if len(words) <= max_words:
            chunks.append(" ".join(words))
            continue
        current: list[str] = []
        count = 0
        for sentence in split_sentences(paragraph):
            n = len(sentence.split())
            if current and count + n > max_words:
                chunks.append(" ".join(current))
                current = [current[-1]]
                count = len(current[0].split())
            current.append(sentence)
            count += n
        if current:
            chunks.append(" ".join(current))
    return chunks


def require_env(*names: str) -> dict:
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        sys.exit("Missing environment values in worker/ingest/.env: " + ", ".join(missing))
    return {n: os.environ[n] for n in names}


def embed(text: str, token: str, model: str) -> list[float]:
    res = requests.post(
        f"https://router.huggingface.co/hf-inference/models/{model}/pipeline/feature-extraction",
        headers={"Authorization": f"Bearer {token}"},
        json={"inputs": text, "options": {"wait_for_model": True}},
        timeout=60,
    )
    res.raise_for_status()
    data = res.json()
    if isinstance(data, list) and data and isinstance(data[0], list):
        vec = data[0]
        if vec and isinstance(vec[0], list):
            vec = [sum(col) / len(col) for col in zip(*vec)]
        return vec
    return data


def pinecone(host: str, key: str, path: str, payload: dict) -> dict:
    res = requests.post(
        f"{host.rstrip('/')}{path}",
        headers={"Api-Key": key, "Content-Type": "application/json", "X-Pinecone-Api-Version": API_VERSION},
        json=payload,
        timeout=60,
    )
    res.raise_for_status()
    return res.json() if res.text else {}


def main() -> None:
    parser = argparse.ArgumentParser(description="Load registered source documents into Pinecone.")
    parser.add_argument("--reset", action="store_true", help="Delete every existing vector first.")
    parser.add_argument("--dry-run", action="store_true", help="Show the plan without calling any service.")
    args = parser.parse_args()

    sources = {s["source_id"]: s for s in load_json("sources.json")["sources"]}
    documents = load_json("seed_documents.json")["documents"]

    plan = []
    for doc in documents:
        source = sources.get(doc["source_id"])
        if source is None:
            print(f"Skipping {doc['doc_id']}: unknown source_id {doc['source_id']}")
            continue
        for n, chunk in enumerate(chunk_document(doc["text"])):
            plan.append((doc, source, n, chunk))

    print(f"{len(plan)} chunks from {len(documents)} documents")
    if args.dry_run:
        for doc, source, n, chunk in plan:
            print(f"- {source['source_id']} {doc['doc_id']}#{n}: {len(chunk.split())} words, geography {source['geography']}")
        return

    env = require_env("HF_API_KEY", "PINECONE_API_KEY", "PINECONE_INDEX_HOST")
    model = os.environ.get("HF_MODEL", "sentence-transformers/all-MiniLM-L6-v2")

    if args.reset:
        pinecone(env["PINECONE_INDEX_HOST"], env["PINECONE_API_KEY"], "/vectors/delete", {"deleteAll": True})
        print("Existing vectors deleted")

    vectors = []
    for doc, source, n, chunk in plan:
        vector_id = hashlib.sha1(f"{source['source_id']}|{doc['doc_id']}|{n}|{chunk}".encode()).hexdigest()
        vectors.append({
            "id": vector_id,
            "values": embed(chunk, env["HF_API_KEY"], model),
            "metadata": {
                "text": chunk,
                "source_id": source["source_id"],
                "doc_id": doc["doc_id"],
                "section": doc.get("section", ""),
                "category": doc.get("category", "general"),
                "geography": source["geography"],
            },
        })
        time.sleep(0.2)

    for i in range(0, len(vectors), 50):
        pinecone(env["PINECONE_INDEX_HOST"], env["PINECONE_API_KEY"], "/vectors/upsert", {"vectors": vectors[i:i + 50]})
    stats = pinecone(env["PINECONE_INDEX_HOST"], env["PINECONE_API_KEY"], "/describe_index_stats", {})
    print(f"Upserted {len(vectors)} vectors. Index now holds {stats.get('totalVectorCount', 'unknown')} vectors")


if __name__ == "__main__":
    main()
