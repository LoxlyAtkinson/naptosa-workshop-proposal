"""Fail closed on a portable independent experience-review verdict.

Usage: python scripts/check-experience-acceptance.py <verdict.json>
This validates recorded evidence, not the truth of a review or visual quality.
"""
import json
import hashlib
import re
import struct
import zlib
import sys
from datetime import datetime
from pathlib import Path


def valid_png(data):
    if not data.startswith(b'\x89PNG\r\n\x1a\n'):
        return False
    offset, seen_header, seen_data, data_ended = 8, False, False, False
    compressed = bytearray()
    row_bytes = height = 0
    while offset + 12 <= len(data):
        length = struct.unpack('>I', data[offset:offset + 4])[0]
        kind = data[offset + 4:offset + 8]
        if not all(65 <= c <= 90 or 97 <= c <= 122 for c in kind):
            return False
        if not seen_header and kind != b'IHDR':
            return False
        if not kind[0] & 32 and kind not in (b'IHDR', b'IDAT', b'IEND'):
            return False
        if seen_data and kind != b'IDAT':
            data_ended = True
        end = offset + 8 + length
        if end + 4 > len(data):
            return False
        body = data[offset + 8:end]
        if zlib.crc32(kind + body) & 0xffffffff != struct.unpack('>I', data[end:end + 4])[0]:
            return False
        if kind == b'IHDR':
            if seen_header or offset != 8 or length != 13:
                return False
            width, height = struct.unpack('>II', body[:8])
            depth, colour, compression, filtering, interlace = body[8:]
            # Browser evidence supports non-interlaced 8-bit RGB/RGBA captures.
            # Other valid PNG encodings fail closed; recapture in a supported format.
            if width < 100 or height < 100 or depth != 8 or colour not in (2, 6) or any((compression, filtering, interlace)):
                return False
            row_bytes = width * (3 if colour == 2 else 4) + 1
            if row_bytes * height > 128 * 1024 * 1024:
                return False
            seen_header = True
        if kind == b'IDAT':
            if not seen_header or data_ended:
                return False
            seen_data = seen_data or bool(body)
            compressed.extend(body)
        if kind == b'IEND':
            if not (seen_header and seen_data and length == 0 and end + 4 == len(data)):
                return False
            try:
                decoder = zlib.decompressobj()
                pixels = decoder.decompress(compressed, row_bytes * height + 1)
                return (decoder.eof and not decoder.unused_data and not decoder.unconsumed_tail
                        and len(pixels) == row_bytes * height
                        and all(pixels[i] <= 4 for i in range(0, len(pixels), row_bytes)))
            except zlib.error:
                return False
        offset = end + 4
    return False


def check(path):
    verdict = json.loads(path.read_text(encoding="utf-8-sig"))
    errors = []
    reviewer = verdict.get("reviewer")
    if not isinstance(reviewer, str) or not reviewer.strip():
        errors.append("Reviewer identity must be a nonempty string.")
    builders = verdict.get("builders")
    if not isinstance(builders, list) or not builders or any(not isinstance(x, str) or not x.strip() for x in builders):
        errors.append("A nonempty named builder roster is required.")
    if verdict.get("raw_verdict") is not None:
        errors.append("This JSON must be the raw judge-authored verdict, not a summary of another verdict.")
    if verdict.get("authored_by") != reviewer or not isinstance(verdict.get("run_id"), str) or not verdict["run_id"].strip():
        errors.append("Judge authorship and run identity are required.")
    def bound_artifact(item, label):
        if not isinstance(item, dict) or not item.get("path") or not item.get("sha256"):
            errors.append(f"{label} requires path and SHA256 binding.")
            return None
        target = path.parent / item["path"]
        if not target.is_file() or hashlib.sha256(target.read_bytes()).hexdigest() != item["sha256"]:
            errors.append(f"Missing or changed {label}: {item['path']}")
            return None
        return target
    contract = bound_artifact(verdict.get("contract"), "contract")
    sources = verdict.get("sources")
    if not isinstance(sources, list) or not sources:
        errors.append("Current source hashes are required.")
    else:
        for source in sources:
            bound_artifact(source, "source")
    manifest = verdict.get("artifacts", {})
    if not isinstance(manifest, dict):
        manifest = {}
    kinds = set()
    def metadata(item):
        if not isinstance(item, dict):
            return False
        viewport = item.get("viewport")
        if not isinstance(viewport, dict) or any(type(viewport.get(d)) is not int or viewport[d] <= 0 for d in ("width", "height")):
            return False
        if any(not isinstance(item.get(f), str) or not item[f].strip() for f in ("route", "state", "timestamp")):
            return False
        try:
            return datetime.fromisoformat(item["timestamp"].replace("Z", "+00:00")).tzinfo is not None
        except ValueError:
            return False
    for key, item in manifest.items():
        if (not isinstance(key, str) or not key.strip() or not isinstance(item, dict)
                or not isinstance(item.get("kind"), str) or not item["kind"].strip()):
            errors.append("Every artifact requires a nonempty ID, object value and kind string.")
            continue
        artifact = bound_artifact(item, f"artifact {key}")
        kinds.add(item.get("kind"))
        if item.get("kind") == "screenshot":
            if artifact and not valid_png(artifact.read_bytes()):
                errors.append(f"Screenshot {key} must be a decodable RGB/RGBA PNG capture.")
            if not metadata(item):
                errors.append(f"Screenshot {key} requires route, state, actual viewport and timezone-aware capture time.")
        if item.get("kind") == "browser_log" and artifact:
            observations = json.loads(artifact.read_text(encoding="utf-8-sig"))
            if not isinstance(observations, list) or not observations:
                errors.append("Browser observations cannot be empty.")
            else:
                for observation in observations:
                    if not metadata(observation) or any(not isinstance(observation.get(field), str) or not observation[field].strip() for field in ("action", "expected", "actual")):
                        errors.append("Browser observation is missing required metadata.")
                    if observation.get("result") != "PASS":
                        errors.append("Every required browser observation must explicitly PASS; failed or blocked observations prevent acceptance.")
                    capture = manifest.get(observation.get("screenshot"), {})
                    if capture.get("kind") != "screenshot" or any(capture.get(f) != observation.get(f) for f in ("route", "state", "viewport")):
                        errors.append("Browser observation must identify a screenshot of the same route, state and viewport.")
    if not {"screenshot", "browser_log"}.issubset(kinds):
        errors.append("Both final screenshots and browser observation logs are required.")
    criteria = verdict.get("criteria")
    if not isinstance(criteria, dict) or not criteria or any(v != "PASS" for v in criteria.values()):
        errors.append("Explicit criterion-by-criterion PASS results are required.")
    if contract:
        required_criteria = set(re.findall(r"^C\d+(?=\s|:)", contract.read_text(encoding="utf-8-sig"), re.MULTILINE))
        if not required_criteria or not isinstance(criteria, dict) or set(criteria) != required_criteria:
            errors.append("Verdict criteria must exactly cover the contract's line-leading C1, C2, ... IDs.")
    if verdict.get("score") != 100 or verdict.get("verdict") != "PASS":
        errors.append("Independent verdict must be PASS with score 100.")
    if not isinstance(reviewer, str) or reviewer.strip().casefold() in [b.strip().casefold() for b in builders if isinstance(b, str)] if isinstance(builders, list) else True:
        errors.append("A named reviewer independent of all builders is required.")
    if verdict.get("unresolved") != [] or verdict.get("unverified") != []:
        errors.append("Unresolved and unverified lists must explicitly be empty.")
    required = {"coverage", "composition", "behaviour", "evidence", "independence", "repair_loop", "completion"}
    gates = verdict.get("gates", {})
    if not isinstance(gates, dict) or set(gates) != required:
        errors.append("Exactly the seven named gates are required.")
        gates = gates if isinstance(gates, dict) else {}
    for gate in sorted(required):
        item = gates.get(gate, {})
        evidence_ids = item.get("evidence") if isinstance(item, dict) else None
        if (not isinstance(item, dict) or item.get("status") != "PASS"
                or not isinstance(evidence_ids, list) or not evidence_ids
                or any(not isinstance(e, str) or not e.strip() for e in evidence_ids)):
            errors.append(f"Gate {gate} requires PASS and evidence paths.")
            continue
        for evidence in evidence_ids:
            if evidence not in manifest:
                errors.append(f"Evidence must identify a hash-bound artifact: {evidence}")
    return errors


if __name__ == "__main__":
    try:
        failures = check(Path(sys.argv[1]).resolve())
    except (IndexError, OSError, ValueError, TypeError, AttributeError) as error:
        failures = [f"Invalid acceptance packet: {error}"]
    for failure in failures:
        print("BLOCK:", failure)
    if not failures:
        print("Acceptance record validated. Human/model judgment remains evidence-dependent.")
    sys.exit(bool(failures))
