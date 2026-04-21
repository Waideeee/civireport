import sys
import os

# Add backend directory to sys.path so we can import
sys.path.append(r"c:\xampp\htdocs\civireport\backend")

from openai_insights import generate_analytics_insight, _request_openai
from analytics_snapshot import build_analytics_snapshot

# Create a mock snapshot
snapshot = build_analytics_snapshot([
    {
        "complaint_type": "Noise",
        "complaint_status": "Pending",
        "created_at": "2023-10-01T10:00:00"
    }
])

try:
    insight = generate_analytics_insight(snapshot)
    print("SUCCESS")
    print(insight)
except Exception as e:
    import traceback
    traceback.print_exc()
