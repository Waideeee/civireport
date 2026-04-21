from __future__ import annotations

from collections import Counter
from datetime import date, datetime
from typing import Any, Iterable


MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
STATUS_ORDER = ["Pending", "In Progress", "Resolved", "Rejected"]
URGENCY_ORDER = ["Critical", "High", "Medium", "Low"]


def _clean_text(value: Any) -> str:
    if value is None:
        return ""
    return " ".join(str(value).split())


def _normalize_status(value: Any) -> str:
    text = _clean_text(value)
    lowered = text.lower()

    if lowered == "in progress":
        return "In Progress"
    if lowered == "pending":
        return "Pending"
    if lowered == "resolved":
        return "Resolved"
    if lowered == "rejected":
        return "Rejected"
    if not text:
        return "Unknown"
    return text.title()


def _normalize_urgency(value: Any) -> str:
    text = _clean_text(value)
    if not text:
        return "Unknown"

    lowered = text.lower()
    if lowered == "critical":
        return "Critical"
    if lowered == "high":
        return "High"
    if lowered == "medium":
        return "Medium"
    if lowered == "low":
        return "Low"
    return text.title()


def _normalize_label(value: Any, fallback: str = "Unknown") -> str:
    text = _clean_text(value)
    return text if text else fallback


def _location_key(value: str) -> str:
    return value.lower()


def _event_date(record: dict[str, Any]) -> date | None:
    created_at = record.get("created_at")
    complaint_date = record.get("complaint_date")

    for candidate in (created_at, complaint_date):
        if isinstance(candidate, datetime):
            return candidate.date()
        if isinstance(candidate, date):
            return candidate
    return None


def _ordered_items(counter: Counter[str], preferred_order: list[str] | None = None) -> list[tuple[str, int]]:
    items = list(counter.items())
    if preferred_order:
        index_map = {label: idx for idx, label in enumerate(preferred_order)}
        items.sort(key=lambda item: (index_map.get(item[0], len(index_map)), -item[1], item[0]))
        return items

    items.sort(key=lambda item: (-item[1], item[0]))
    return items


def _top_entries(counter: Counter[str], limit: int = 5) -> list[dict[str, Any]]:
    return [
        {"label": label, "count": count}
        for label, count in _ordered_items(counter)[:limit]
    ]


def build_analytics_snapshot(records: Iterable[dict[str, Any]], today: date | None = None) -> dict[str, Any]:
    today = today or date.today()
    rows = list(records)

    category_counter: Counter[str] = Counter()
    status_counter: Counter[str] = Counter()
    subtype_counter: Counter[str] = Counter()
    urgency_counter: Counter[str] = Counter()
    monthly_counter: Counter[int] = Counter()
    location_counter: Counter[str] = Counter()
    location_labels: dict[str, str] = {}

    for row in rows:
        category = _normalize_label(row.get("complaint_type"))
        status = _normalize_status(row.get("complaint_status"))
        subtype = _normalize_label(row.get("complaint_subtype"), fallback="")
        urgency = _normalize_urgency(row.get("urgency_level"))
        location = _normalize_label(row.get("complaint_location"), fallback="")

        category_counter[category] += 1
        status_counter[status] += 1

        if subtype:
            subtype_counter[subtype] += 1
        if urgency != "Unknown":
            urgency_counter[urgency] += 1
        if location:
            key = _location_key(location)
            location_counter[key] += 1
            location_labels.setdefault(key, location)

        event_date = _event_date(row)
        if event_date and event_date.year == today.year:
            monthly_counter[event_date.month] += 1

    summary = {
        "total": len(rows),
        "resolved": status_counter.get("Resolved", 0),
        "pending": status_counter.get("Pending", 0),
        "in_progress": status_counter.get("In Progress", 0),
        "rejected": status_counter.get("Rejected", 0),
    }

    category_items = _ordered_items(category_counter)
    status_items = _ordered_items(status_counter, preferred_order=STATUS_ORDER)
    urgency_items = _ordered_items(urgency_counter, preferred_order=URGENCY_ORDER)
    location_items = sorted(
        ((location_labels[key], count) for key, count in location_counter.items()),
        key=lambda item: (-item[1], item[0]),
    )

    monthly_values = [monthly_counter.get(month_number, 0) for month_number in range(1, 13)]

    return {
        "summary": summary,
        "by_category": {
            "labels": [label for label, _ in category_items],
            "values": [count for _, count in category_items],
        },
        "by_status": {
            "labels": [label for label, _ in status_items],
            "values": [count for _, count in status_items],
        },
        "monthly": {
            "labels": MONTH_NAMES,
            "values": monthly_values,
        },
        "top_categories": _top_entries(category_counter, limit=5),
        "top_subtypes": _top_entries(subtype_counter, limit=5),
        "top_locations": [
            {"label": label, "count": count}
            for label, count in location_items[:5]
        ],
        "urgency_mix": [
            {"label": label, "count": count}
            for label, count in urgency_items
        ],
        "unresolved_total": summary["pending"] + summary["in_progress"],
        "total_reports": summary["total"],
        "current_year": today.year,
    }