import json
import os
import re
import sys
import urllib.request


REPO = os.environ.get("GITHUB_REPOSITORY")
TOKEN = os.environ.get("GITHUB_TOKEN")


def fail(msg: str) -> None:
    print(f"ERROR: {msg}")


def api_get(url: str):
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    if TOKEN:
        req.add_header("Authorization", f"Bearer {TOKEN}")
    with urllib.request.urlopen(req) as resp:  # nosec B310 - trusted GitHub API URL
        return json.loads(resp.read().decode("utf-8"))


def list_issues():
    issues = []
    page = 1
    while True:
        url = (
            f"https://api.github.com/repos/{REPO}/issues"
            f"?state=all&per_page=100&page={page}"
        )
        batch = api_get(url)
        if not batch:
            break
        # Exclude pull requests
        issues.extend([i for i in batch if "pull_request" not in i])
        page += 1
    return issues


def has_acceptance_criteria(body: str) -> bool:
    if not body:
        return False
    match = re.search(
        r"Acceptance Criteria:\s*(.*?)(?:\n\n[A-Z][^\n]*:|\Z)",
        body,
        flags=re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return False
    section = match.group(1)
    return bool(re.search(r"^\s*-\s+\S+", section, flags=re.MULTILINE))


def extract_evidence_section(body: str) -> str:
    if not body:
        return ""
    match = re.search(
        r"Evidence Reference:\s*(.*?)(?:\n\n[A-Z][^\n]*:|\Z)",
        body,
        flags=re.IGNORECASE | re.DOTALL,
    )
    return match.group(1).strip() if match else ""


def extract_linked_issue_numbers(body: str):
    return {int(n) for n in re.findall(r"#(\d+)", body or "")}


def has_real_evidence_reference(text: str) -> bool:
    if not text:
        return False
    # Must include at least one URL or explicit artifact reference.
    return bool(
        re.search(r"https?://", text, flags=re.IGNORECASE)
        or re.search(r"\bartifact\b", text, flags=re.IGNORECASE)
        or re.search(r"\bscreenshot\b", text, flags=re.IGNORECASE)
        or re.search(r"\brecording\b", text, flags=re.IGNORECASE)
    )


def main():
    if not REPO:
        print("GITHUB_REPOSITORY is required")
        sys.exit(2)

    issues = list_issues()
    pb_issues = [i for i in issues if re.match(r"^\[PB-[^\]]+\]", i["title"])]
    tc_issue_numbers = {
        i["number"] for i in issues if re.match(r"^\[TC-[^\]]+\]", i["title"])
    }

    errors = []

    for issue in pb_issues:
        number = issue["number"]
        title = issue["title"]
        body = issue.get("body") or ""
        labels = {l["name"].lower() for l in issue.get("labels", [])}
        linked_numbers = extract_linked_issue_numbers(body)
        linked_tcs = linked_numbers.intersection(tc_issue_numbers)
        evidence_section = extract_evidence_section(body)

        if not linked_tcs:
            errors.append(
                f"PB issue #{number} ({title}) has no linked test case issue reference."
            )

        if not evidence_section:
            errors.append(
                f"PB issue #{number} ({title}) has no evidence reference section."
            )

        if not has_acceptance_criteria(body):
            errors.append(
                f"PB issue #{number} ({title}) is missing explicit acceptance criteria bullets."
            )

        is_done = issue["state"].lower() == "closed" or bool(
            labels.intersection({"done", "completed"})
        )
        if is_done and not has_real_evidence_reference(evidence_section):
            errors.append(
                f"PB issue #{number} ({title}) is Done/Closed but has no concrete validation evidence."
            )

    if errors:
        for e in errors:
            fail(e)
        print(f"Traceability validation failed with {len(errors)} issue(s).")
        sys.exit(1)

    print(
        f"Traceability validation passed for {len(pb_issues)} PB issue(s) with linked test cases and evidence references."
    )


if __name__ == "__main__":
    main()
