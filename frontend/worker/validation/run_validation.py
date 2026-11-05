import argparse
import json
import re
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import requests

HERE = Path(__file__).resolve().parent


def run_case(base_url: str, case: dict, state: str | None) -> dict:
    payload = {"query": case["prompt"]}
    if state:
        payload["state"] = state
    started = time.time()
    try:
        response = requests.post(f"{base_url}/api/query", json=payload, timeout=60)
        body = response.json()
        status = response.status_code
    except Exception as exc:
        return {"http_status": None, "state": "client_error", "answer": "", "source_ids": [], "error": type(exc).__name__, "seconds": round(time.time() - started, 2)}
    return {
        "http_status": status,
        "state": body.get("state"),
        "answer": body.get("answer", body.get("detail", "")),
        "source_ids": [s.get("source_id") for s in body.get("sources", [])],
        "source_urls": [s.get("url") for s in body.get("sources", [])],
        "seconds": round(time.time() - started, 2),
    }


def auto_verdict(case: dict, result: dict) -> str:
    if result["state"] in (None, "client_error"):
        return "not_tested"
    if result["state"] not in case["allowed_states"] and result["state"] not in ("rate_limited",):
        return "fail_review"
    text = result["answer"] or ""
    for pattern in case["forbid_patterns"]:
        if re.search(pattern, text):
            return "fail_critical_review"
    return "pass_pending_human_review"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8787")
    parser.add_argument("--commit", default="unknown")
    parser.add_argument("--state", default=None)
    parser.add_argument("--delay", type=float, default=6.0)
    args = parser.parse_args()

    cases = json.loads((HERE / "test_cases.json").read_text(encoding="utf-8"))["cases"]
    rows = []
    for case in cases:
        row = {
            "id": case["id"], "group": case["group"], "prompt": case["prompt"], "expected": case["expected"],
            "mode": case["mode"], "actual_output": "", "state": "", "source_ids": [],
            "citation_supports_claim": "", "severity": "", "fix": "", "retest_result": "",
            "auto_verdict": "not_tested" if case["mode"] == "manual" else "",
        }
        if case["mode"] == "manual":
            row["manual_setup"] = case.get("manual_setup", "")
        else:
            result = run_case(args.base_url, case, args.state)
            row.update({"actual_output": result["answer"], "state": result["state"], "source_ids": result["source_ids"], "http_status": result["http_status"]})
            row["auto_verdict"] = auto_verdict(case, result)
            time.sleep(args.delay)
        rows.append(row)
        print(f"{row['id']}: {row['auto_verdict']}")

    out_dir = HERE / "results"
    out_dir.mkdir(exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    out = out_dir / f"results_{stamp}.json"
    out.write_text(json.dumps({"commit": args.commit, "base_url": args.base_url, "run_at": stamp, "rows": rows}, indent=2, ensure_ascii=False), encoding="utf-8")
    print(f"Wrote {out}")
    print("Auto verdicts are screening only. A human must judge citation support and set severity for every case.")


if __name__ == "__main__":
    sys.exit(main())
