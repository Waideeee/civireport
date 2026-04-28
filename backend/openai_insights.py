from __future__ import annotations

import json
import logging
import os
from datetime import datetime, timezone
from typing import Any, Callable
from urllib import error, request

from dotenv import load_dotenv


logger = logging.getLogger(__name__)

load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


DEFAULT_TIMEOUT_SECONDS = 20
DEFAULT_MODEL = "gpt-4o-mini"
RESPONSES_URL = "https://api.openai.com/v1/chat/completions"

INSIGHT_RESPONSE_SCHEMA = {
    "type": "object",
    "additionalProperties": False,
    "required": ["headline", "summary", "common_problem", "evidence", "recommendations"],
    "properties": {
        "headline": {"type": "string"},
        "summary": {"type": "string"},
        "common_problem": {"type": "string"},
        "evidence": {
            "type": "array",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["label", "detail"],
                "properties": {
                    "label": {"type": "string"},
                    "detail": {"type": "string"},
                },
            },
        },
        "recommendations": {
            "type": "array",
            "minItems": 1,
            "maxItems": 3,
            "items": {
                "type": "object",
                "additionalProperties": False,
                "required": ["title", "priority", "details"],
                "properties": {
                    "title": {"type": "string"},
                    "priority": {"type": "string"},
                    "details": {"type": "string"},
                },
            },
        },
    },
}

OpenAIRequester = Callable[[dict[str, Any], dict[str, Any]], dict[str, Any]]


def _utc_now_iso() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def _normalized_timeout() -> int:
    raw_value = os.getenv("OPENAI_TIMEOUT_SECONDS", str(DEFAULT_TIMEOUT_SECONDS))
    try:
        value = int(raw_value)
        return value if value > 0 else DEFAULT_TIMEOUT_SECONDS
    except (TypeError, ValueError):
        return DEFAULT_TIMEOUT_SECONDS


def _openai_config() -> dict[str, Any]:
    return {
        "api_key": os.getenv("OPENAI_API_KEY", "").strip(),
        "model": os.getenv("OPENAI_MODEL", DEFAULT_MODEL).strip() or DEFAULT_MODEL,
        "timeout": _normalized_timeout(),
    }


def _build_insight_prompt_payload(snapshot: dict[str, Any]) -> dict[str, Any]:
    grounded_payload = {
        "summary": snapshot.get("summary", {}),
        "top_categories": snapshot.get("top_categories", []),
        "top_subtypes": snapshot.get("top_subtypes", []),
        "top_locations": snapshot.get("top_locations", []),
        "urgency_mix": snapshot.get("urgency_mix", []),
        "by_status": snapshot.get("by_status", {}),
        "monthly": snapshot.get("monthly", {}),
        "unresolved_total": snapshot.get("unresolved_total", 0),
        "current_year": snapshot.get("current_year"),
    }

    return {
        "system_prompt": (
            "You are an analytics assistant for barangay administrators. "
            "Use only the aggregated complaint analytics provided to you. "
            "Do not invent causes, names, or incidents. "
            "Write concise, practical guidance for local government action. "
            "Ground every insight in the supplied counts and trends."
        ),
        "user_payload": grounded_payload,
    }


def _extract_output_text(response_json: dict[str, Any]) -> str:
    # Handle Chat Completions API response format
    if "choices" in response_json and isinstance(response_json["choices"], list):
        for choice in response_json["choices"]:
            if isinstance(choice, dict) and "message" in choice:
                message = choice["message"]
                if isinstance(message, dict) and "content" in message:
                    content = message["content"]
                    if isinstance(content, str) and content.strip():
                        return content.strip()
    
    # Fallback for legacy response formats
    if isinstance(response_json.get("output_text"), str) and response_json["output_text"].strip():
        return response_json["output_text"].strip()

    parts: list[str] = []
    for item in response_json.get("output", []):
        if item.get("type") != "message":
            continue
        for content in item.get("content", []):
            text_value = content.get("text")
            if isinstance(text_value, str) and text_value.strip():
                parts.append(text_value.strip())
                continue
            if isinstance(text_value, dict) and isinstance(text_value.get("value"), str):
                parts.append(text_value["value"].strip())
                continue
            if isinstance(content.get("value"), str) and content["value"].strip():
                parts.append(content["value"].strip())

    return "\n".join(part for part in parts if part).strip()


def _parse_output_json(output_text: str) -> dict[str, Any]:
    cleaned = output_text.strip()
    if cleaned.startswith("```"):
        cleaned = cleaned.strip("`")
        if cleaned.lower().startswith("json"):
            cleaned = cleaned[4:]
        cleaned = cleaned.strip()

    parsed = json.loads(cleaned)
    if not isinstance(parsed, dict):
        raise ValueError("Model response did not return a JSON object")
    return parsed


def _request_openai(prompt_payload: dict[str, Any], config: dict[str, Any]) -> dict[str, Any]:
    payload = {
        "model": config["model"],
        "messages": [
            {
                "role": "system",
                "content": prompt_payload["system_prompt"],
            },
            {
                "role": "user",
                "content": json.dumps(prompt_payload["user_payload"], ensure_ascii=False),
            },
        ],
        "max_tokens": 700,
        "response_format": {
            "type": "json_schema",
            "json_schema": {
                "name": "barangay_analytics_insight",
                "strict": True,
                "schema": INSIGHT_RESPONSE_SCHEMA,
            }
        },
    }

    req = request.Request(
        RESPONSES_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )

    try:
        with request.urlopen(req, timeout=config["timeout"]) as response:
            return json.loads(response.read().decode("utf-8"))
    except error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenAI HTTP {exc.code}: {body}") from exc
    except error.URLError as exc:
        raise RuntimeError(f"OpenAI request failed: {exc.reason}") from exc


def _validate_list_items(items: Any, required_keys: list[str], limit: int) -> list[dict[str, str]]:
    if not isinstance(items, list):
        raise ValueError("Model response returned a non-list field")

    validated: list[dict[str, str]] = []
    for item in items[:limit]:
        if not isinstance(item, dict):
            raise ValueError("Model response contained a non-object list item")

        normalized_item: dict[str, str] = {}
        for key in required_keys:
            value = item.get(key)
            if not isinstance(value, str) or not value.strip():
                raise ValueError(f"Model response is missing a valid '{key}' field")
            normalized_item[key] = value.strip()
        validated.append(normalized_item)

    if not validated:
        raise ValueError("Model response returned no usable list items")

    return validated


def _normalize_model_output(raw_output: dict[str, Any]) -> dict[str, Any]:
    required_text_fields = ["headline", "summary", "common_problem"]
    normalized: dict[str, Any] = {}

    for field in required_text_fields:
        value = raw_output.get(field)
        if not isinstance(value, str) or not value.strip():
            raise ValueError(f"Model response is missing a valid '{field}' field")
        normalized[field] = value.strip()

    normalized["evidence"] = _validate_list_items(raw_output.get("evidence"), ["label", "detail"], limit=3)
    normalized["recommendations"] = _validate_list_items(
        raw_output.get("recommendations"),
        ["title", "priority", "details"],
        limit=3,
    )
    return normalized


def _unavailable_response(message: str) -> dict[str, Any]:
    return {
        "state": "unavailable",
        "generated_at": _utc_now_iso(),
        "headline": "AI insight unavailable",
        "summary": message,
        "common_problem": "",
        "evidence": [],
        "recommendations": [],
    }


def _status_value(summary: dict[str, Any], key: str) -> int:
    value = summary.get(key, 0)
    return value if isinstance(value, int) and value >= 0 else 0


def _percentage(part: int, total: int) -> int:
    return round((part / total) * 100) if total > 0 else 0


def _build_local_insight(snapshot: dict[str, Any]) -> dict[str, Any]:
    summary = snapshot.get("summary", {})
    total = _status_value(summary, "total")
    resolved = _status_value(summary, "resolved")
    pending = _status_value(summary, "pending")
    in_progress = _status_value(summary, "in_progress")
    rejected = _status_value(summary, "rejected")

    top_categories = snapshot.get("top_categories") or []
    top_locations = snapshot.get("top_locations") or []
    urgency_mix = snapshot.get("urgency_mix") or []

    lead_category = top_categories[0] if top_categories else {"label": "Community concerns", "count": total}
    lead_location = top_locations[0] if top_locations else None
    lead_urgency = urgency_mix[0] if urgency_mix else None

    category_label = str(lead_category.get("label", "Community concerns")).strip() or "Community concerns"
    category_count = int(lead_category.get("count", 0) or 0)
    unresolved_total = pending + in_progress
    resolution_rate = _percentage(resolved, total)

    headline = f"{category_label} needs the closest barangay attention"

    summary_parts = [
        f"{total} total complaint{'s' if total != 1 else ''} recorded",
        f"{resolved} resolved",
    ]
    if pending:
        summary_parts.append(f"{pending} still pending")
    if in_progress:
        summary_parts.append(f"{in_progress} in progress")
    if rejected:
        summary_parts.append(f"{rejected} rejected")

    overview = ", ".join(summary_parts)
    summary_text = (
        f"{overview}. {category_label} accounts for {category_count} report"
        f"{'s' if category_count != 1 else ''}, with a current resolution rate of {resolution_rate}%."
    )

    common_problem = f"{category_label} is the most reported concern"
    if lead_location and lead_location.get("label"):
        common_problem += f" near {lead_location['label']}"
    common_problem += "."

    evidence = [
        {
            "label": "Most reported category",
            "detail": (
                f"{category_label} appears in {category_count} complaint"
                f"{'s' if category_count != 1 else ''}, making it the top issue in the current analytics snapshot."
            ),
        },
        {
            "label": "Resolution progress",
            "detail": (
                f"{resolved} of {total} complaint{'s' if total != 1 else ''} are resolved, "
                f"while {unresolved_total} remain active."
            ),
        },
    ]

    if lead_urgency and lead_urgency.get("label"):
        urgency_count = int(lead_urgency.get("count", 0) or 0)
        evidence.append(
            {
                "label": "Urgency mix",
                "detail": (
                    f"{lead_urgency['label']} urgency appears in {urgency_count} complaint"
                    f"{'s' if urgency_count != 1 else ''}, which helps indicate response pressure."
                ),
            }
        )
    elif lead_location and lead_location.get("label"):
        location_count = int(lead_location.get("count", 0) or 0)
        evidence.append(
            {
                "label": "Frequent location",
                "detail": (
                    f"{lead_location['label']} appears in {location_count} complaint"
                    f"{'s' if location_count != 1 else ''}, suggesting a repeat hotspot."
                ),
            }
        )

    recommendations = [
        {
            "title": f"Prioritize follow-up on {category_label}",
            "priority": "High" if unresolved_total > 0 else "Medium",
            "details": (
                f"Review active {category_label.lower()} cases first and assign concrete next actions "
                f"for each unresolved complaint."
            ),
        },
        {
            "title": "Focus barangay response where reports cluster",
            "priority": "High" if lead_location else "Medium",
            "details": (
                f"Increase coordination, visibility, or field verification in {lead_location['label']}."
                if lead_location and lead_location.get("label")
                else "Group recurring reports by location so patrols and site visits can be scheduled where they matter most."
            ),
        },
        {
            "title": "Track closure speed weekly",
            "priority": "Medium",
            "details": (
                "Monitor pending and in-progress complaints every week so stalled cases can be escalated before they age out."
            ),
        },
    ]

    return {
        "state": "ok",
        "generated_at": _utc_now_iso(),
        "headline": headline,
        "summary": summary_text,
        "common_problem": common_problem,
        "evidence": evidence[:3],
        "recommendations": recommendations[:3],
    }


def generate_analytics_insight(
    snapshot: dict[str, Any],
    requester: OpenAIRequester | None = None,
) -> dict[str, Any]:
    if snapshot.get("total_reports", 0) == 0:
        return {
            "state": "no_data",
            "generated_at": _utc_now_iso(),
            "headline": "No reports to analyze yet",
            "summary": "AI insight will appear after complaint reports are available in analytics.",
            "common_problem": "",
            "evidence": [],
            "recommendations": [],
        }

    config = _openai_config()
    if not config["api_key"]:
        logger.warning("OpenAI API key is not configured; using local analytics insight fallback")
        return _build_local_insight(snapshot)

    prompt_payload = _build_insight_prompt_payload(snapshot)
    requester = requester or _request_openai

    try:
        response_json = requester(prompt_payload, config)
        output_text = _extract_output_text(response_json)
        if not output_text:
            raise ValueError("OpenAI returned no output text")

        parsed_output = _parse_output_json(output_text)
        insight = _normalize_model_output(parsed_output)
        insight["state"] = "ok"
        insight["generated_at"] = _utc_now_iso()
        return insight
    except Exception:
        logger.exception("Failed to generate analytics insight from OpenAI")
        return _build_local_insight(snapshot)
