#!/usr/bin/env python3
"""
Triage Worker - AI-powered incident analysis
Processes incidents with null ai_meta and enriches them with AI analysis.
"""

import os
import sys
import time
import json
import psycopg2
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')
OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')

# Validate required environment variables
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)

if not OPENAI_API_KEY:
    print("ERROR: OPENAI_API_KEY environment variable not set")
    sys.exit(1)


def get_db_connection():
    """Create a database connection."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"ERROR: Failed to connect to database: {e}")
        sys.exit(1)


def get_untriaged_incidents(conn):
    """Fetch incidents where ai_meta is null."""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT id, category, description, class_section
        FROM incidents
        WHERE ai_meta IS NULL
        ORDER BY created_at ASC
    """)
    incidents = cursor.fetchall()
    cursor.close()
    return incidents


def analyze_incident_with_ai(incident_data):
    """
    Call OpenAI API to analyze an incident.
    Returns JSON with: ai_category, urgency_score, risk_level, ai_summary
    """
    incident_id, category, description, class_section = incident_data

    # Construct the prompt - keep it concise to stay under 200 tokens
    prompt = f"""Analyze this school safety incident. Return ONLY valid JSON.

Category: {category}
Description: {description or 'N/A'}
Class: {class_section or 'N/A'}

Return JSON:
{{
  "ai_category": "string (violence/bullying/mental_health/substance/other)",
  "urgency_score": number (1-10),
  "risk_level": "string (low/medium/high/critical)",
  "ai_summary": "brief summary (max 50 words)"
}}"""

    try:
        response = requests.post(
            'https://api.openai.com/v1/chat/completions',
            headers={
                'Authorization': f'Bearer {OPENAI_API_KEY}',
                'Content-Type': 'application/json'
            },
            json={
                'model': 'gpt-3.5-turbo',
                'messages': [
                    {
                        'role': 'system',
                        'content': 'You are a school safety analyst. Return only valid JSON, no other text.'
                    },
                    {
                        'role': 'user',
                        'content': prompt
                    }
                ],
                'max_tokens': 200,
                'temperature': 0.3
            },
            timeout=30
        )

        response.raise_for_status()
        result = response.json()

        # Extract the AI response
        ai_response = result['choices'][0]['message']['content'].strip()

        # Parse JSON response
        ai_meta = json.loads(ai_response)

        # Validate required fields
        required_fields = ['ai_category', 'urgency_score', 'risk_level', 'ai_summary']
        if not all(field in ai_meta for field in required_fields):
            raise ValueError(f"Missing required fields in AI response")

        return ai_meta

    except requests.exceptions.RequestException as e:
        print(f"ERROR: API request failed for incident {incident_id}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"ERROR: Failed to parse AI response for incident {incident_id}: {e}")
        return None
    except Exception as e:
        print(f"ERROR: Unexpected error analyzing incident {incident_id}: {e}")
        return None


def update_incident_ai_meta(conn, incident_id, ai_meta):
    """Update an incident's ai_meta field."""
    cursor = conn.cursor()
    try:
        cursor.execute("""
            UPDATE incidents
            SET ai_meta = %s
            WHERE id = %s
        """, (json.dumps(ai_meta), incident_id))
        conn.commit()
        cursor.close()
        return True
    except Exception as e:
        print(f"ERROR: Failed to update incident {incident_id}: {e}")
        conn.rollback()
        cursor.close()
        return False


def process_incidents(run_once=False):
    """Main processing loop."""
    conn = get_db_connection()

    print("Triage Worker started...")
    print(f"Mode: {'Single run' if run_once else 'Continuous loop'}")

    while True:
        try:
            incidents = get_untriaged_incidents(conn)

            if not incidents:
                if run_once:
                    print("No untriaged incidents found. Exiting.")
                    break
                else:
                    print("No untriaged incidents. Waiting 30 seconds...")
                    time.sleep(30)
                    continue

            print(f"\nFound {len(incidents)} untriaged incident(s)")

            for incident in incidents:
                incident_id = incident[0]
                print(f"\nProcessing incident #{incident_id}...")

                ai_meta = analyze_incident_with_ai(incident)

                if ai_meta:
                    if update_incident_ai_meta(conn, incident_id, ai_meta):
                        print(f"✓ Successfully triaged incident #{incident_id}")
                        print(f"  Category: {ai_meta['ai_category']}")
                        print(f"  Urgency: {ai_meta['urgency_score']}/10")
                        print(f"  Risk: {ai_meta['risk_level']}")
                    else:
                        print(f"✗ Failed to update incident #{incident_id}")
                else:
                    print(f"✗ Failed to analyze incident #{incident_id}")

                # Small delay between API calls to avoid rate limiting
                time.sleep(1)

            if run_once:
                print("\nSingle run completed. Exiting.")
                break

            print("\nBatch complete. Waiting 30 seconds before next check...")
            time.sleep(30)

        except KeyboardInterrupt:
            print("\n\nShutting down gracefully...")
            break
        except Exception as e:
            print(f"ERROR: Unexpected error in main loop: {e}")
            if run_once:
                break
            time.sleep(30)

    conn.close()
    print("Triage Worker stopped.")


if __name__ == '__main__':
    # Check if --once flag is provided
    run_once = '--once' in sys.argv
    process_incidents(run_once=run_once)
