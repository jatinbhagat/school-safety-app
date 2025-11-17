#!/usr/bin/env python3
"""
Incident Aggregation ETL - Daily aggregate computation for heatmap analytics
Computes incident counts, recurrences, and severity metrics for visualization.
"""

import os
import sys
import json
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv('DATABASE_URL')

# Validate required environment variables
if not DATABASE_URL:
    print("ERROR: DATABASE_URL environment variable not set")
    sys.exit(1)


def get_db_connection():
    """Create a database connection."""
    try:
        conn = psycopg2.connect(DATABASE_URL)
        return conn
    except Exception as e:
        print(f"ERROR: Failed to connect to database: {e}")
        sys.exit(1)


def populate_incident_locations(conn):
    """
    Populate incident_locations table from incidents that don't have a location record yet.
    Uses class_section as location identifier and generates sample coordinates.
    """
    cursor = conn.cursor()

    # Find incidents without location records
    cursor.execute("""
        SELECT i.id, i.class_section
        FROM incidents i
        LEFT JOIN incident_locations il ON i.id = il.incident_id
        WHERE il.id IS NULL
    """)

    incidents_without_locations = cursor.fetchall()

    if not incidents_without_locations:
        print("All incidents already have location records")
        cursor.close()
        return 0

    print(f"Populating locations for {len(incidents_without_locations)} incidents...")

    # Insert location records
    # Note: In production, these coordinates should come from actual map/floor plan data
    # For now, we'll use a simple hash-based distribution for demo purposes
    for incident_id, class_section in incidents_without_locations:
        # Generate pseudo-random but consistent coordinates based on class_section
        if class_section:
            # Simple hash to generate consistent coordinates for the same class_section
            hash_val = hash(class_section)
            x_coord = (hash_val % 1000) / 10.0  # Range: 0-100
            y_coord = ((hash_val // 1000) % 1000) / 10.0  # Range: 0-100
        else:
            # Default coordinates for incidents without class_section
            x_coord = 50.0
            y_coord = 50.0

        cursor.execute("""
            INSERT INTO incident_locations (incident_id, class_section, x_coord, y_coord)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (incident_id) DO NOTHING
        """, (incident_id, class_section, x_coord, y_coord))

    conn.commit()
    cursor.close()

    print(f"✓ Created {len(incidents_without_locations)} location records")
    return len(incidents_without_locations)


def compute_daily_aggregates(conn, start_date=None, end_date=None):
    """
    Compute daily aggregates for the incident heatmap.

    Args:
        conn: Database connection
        start_date: Start date for aggregation (default: 30 days ago)
        end_date: End date for aggregation (default: today)
    """
    cursor = conn.cursor()

    # Default to last 30 days if not specified
    if not end_date:
        end_date = datetime.now().date()
    if not start_date:
        start_date = end_date - timedelta(days=30)

    print(f"\nComputing aggregates from {start_date} to {end_date}...")

    # Main aggregation query
    # Groups incidents by date, location, and category
    # Computes counts, recurrence patterns, and average severity
    cursor.execute("""
        WITH incident_data AS (
            SELECT
                i.id,
                DATE(i.created_at) as incident_date,
                i.category,
                i.status,
                il.class_section,
                il.x_coord,
                il.y_coord,
                COALESCE((i.ai_meta->>'urgency_score')::numeric, 5) as urgency_score
            FROM incidents i
            LEFT JOIN incident_locations il ON i.id = il.incident_id
            WHERE DATE(i.created_at) BETWEEN %s AND %s
        ),
        recurrence_check AS (
            SELECT
                id1.id,
                COUNT(DISTINCT id2.id) as similar_incidents
            FROM incident_data id1
            LEFT JOIN incident_data id2 ON
                id1.class_section = id2.class_section
                AND id1.category = id2.category
                AND id1.id != id2.id
                AND ABS(id1.incident_date - id2.incident_date) <= 7
            GROUP BY id1.id
        ),
        aggregated AS (
            SELECT
                id.incident_date as date,
                id.class_section,
                id.category,
                id.x_coord,
                id.y_coord,
                COUNT(DISTINCT id.id) as incident_count,
                COUNT(DISTINCT CASE WHEN rc.similar_incidents > 0 THEN id.id END) as recurrence_count,
                AVG(id.urgency_score) as severity_avg,
                jsonb_object_agg(
                    id.status,
                    COUNT(DISTINCT id.id)
                ) FILTER (WHERE id.status IS NOT NULL) as status_breakdown
            FROM incident_data id
            LEFT JOIN recurrence_check rc ON id.id = rc.id
            GROUP BY id.incident_date, id.class_section, id.category, id.x_coord, id.y_coord
        )
        INSERT INTO analytics.incident_aggregates (
            date,
            class_section,
            category,
            x_coord,
            y_coord,
            incident_count,
            recurrence_count,
            severity_avg,
            status_breakdown,
            last_computed_at
        )
        SELECT
            date,
            class_section,
            category,
            x_coord,
            y_coord,
            incident_count,
            recurrence_count,
            ROUND(severity_avg::numeric, 2) as severity_avg,
            status_breakdown,
            NOW()
        FROM aggregated
        ON CONFLICT (date, class_section, category, x_coord, y_coord)
        DO UPDATE SET
            incident_count = EXCLUDED.incident_count,
            recurrence_count = EXCLUDED.recurrence_count,
            severity_avg = EXCLUDED.severity_avg,
            status_breakdown = EXCLUDED.status_breakdown,
            last_computed_at = NOW()
        RETURNING date, class_section, category, incident_count
    """, (start_date, end_date))

    results = cursor.fetchall()
    conn.commit()

    print(f"✓ Computed {len(results)} aggregate records")

    # Display summary
    if results:
        total_incidents = sum(row[3] for row in results)
        print(f"  Total incidents aggregated: {total_incidents}")
        print(f"  Unique date/location/category combinations: {len(results)}")

    cursor.close()
    return len(results)


def generate_incident_tags(conn):
    """
    Generate tags for incidents based on AI metadata and patterns.
    Tags help with filtering and categorization in the heatmap.
    """
    cursor = conn.cursor()

    print("\nGenerating incident tags...")

    # Tag high-urgency incidents
    cursor.execute("""
        INSERT INTO incident_tags (incident_id, tag)
        SELECT DISTINCT i.id, 'high-urgency'
        FROM incidents i
        WHERE (i.ai_meta->>'urgency_score')::numeric >= 8
        ON CONFLICT (incident_id, tag) DO NOTHING
    """)
    high_urgency_count = cursor.rowcount

    # Tag recurring incidents (same location + category within 7 days)
    cursor.execute("""
        INSERT INTO incident_tags (incident_id, tag)
        SELECT DISTINCT i1.id, 'recurring'
        FROM incidents i1
        INNER JOIN incident_locations il1 ON i1.id = il1.incident_id
        INNER JOIN incidents i2 ON i1.category = i2.category AND i1.id != i2.id
        INNER JOIN incident_locations il2 ON i2.id = il2.incident_id
        WHERE il1.class_section = il2.class_section
            AND ABS(DATE(i1.created_at) - DATE(i2.created_at)) <= 7
        ON CONFLICT (incident_id, tag) DO NOTHING
    """)
    recurring_count = cursor.rowcount

    # Tag unresolved incidents
    cursor.execute("""
        INSERT INTO incident_tags (incident_id, tag)
        SELECT DISTINCT i.id, 'unresolved'
        FROM incidents i
        WHERE i.status IN ('open', 'in_progress')
        ON CONFLICT (incident_id, tag) DO NOTHING
    """)
    unresolved_count = cursor.rowcount

    # Tag incidents by AI category
    cursor.execute("""
        INSERT INTO incident_tags (incident_id, tag)
        SELECT DISTINCT i.id, i.ai_meta->>'ai_category'
        FROM incidents i
        WHERE i.ai_meta IS NOT NULL
            AND i.ai_meta->>'ai_category' IS NOT NULL
        ON CONFLICT (incident_id, tag) DO NOTHING
    """)
    category_count = cursor.rowcount

    conn.commit()
    cursor.close()

    print(f"✓ Generated tags:")
    print(f"  High-urgency: {high_urgency_count}")
    print(f"  Recurring: {recurring_count}")
    print(f"  Unresolved: {unresolved_count}")
    print(f"  Category tags: {category_count}")

    return high_urgency_count + recurring_count + unresolved_count + category_count


def get_aggregation_stats(conn):
    """Display current aggregation statistics."""
    cursor = conn.cursor()

    # Get aggregate counts
    cursor.execute("SELECT COUNT(*) FROM analytics.incident_aggregates")
    total_aggregates = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM incident_locations")
    total_locations = cursor.fetchone()[0]

    cursor.execute("SELECT COUNT(*) FROM incident_tags")
    total_tags = cursor.fetchone()[0]

    cursor.execute("SELECT MAX(last_computed_at) FROM analytics.incident_aggregates")
    last_run = cursor.fetchone()[0]

    cursor.close()

    print("\n" + "="*60)
    print("AGGREGATION STATISTICS")
    print("="*60)
    print(f"Total aggregate records: {total_aggregates}")
    print(f"Total location records: {total_locations}")
    print(f"Total tag records: {total_tags}")
    print(f"Last aggregation run: {last_run or 'Never'}")
    print("="*60)


def main():
    """Main ETL execution."""
    print("="*60)
    print("INCIDENT ANALYTICS ETL")
    print("="*60)

    conn = get_db_connection()

    try:
        # Step 1: Ensure all incidents have location records
        populate_incident_locations(conn)

        # Step 2: Generate tags for incidents
        generate_incident_tags(conn)

        # Step 3: Compute daily aggregates
        # Default: last 30 days
        compute_daily_aggregates(conn)

        # Step 4: Display statistics
        get_aggregation_stats(conn)

        print("\n✓ ETL completed successfully!")

    except Exception as e:
        print(f"\n✗ ERROR: ETL failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == '__main__':
    main()
