import sqlite3

def patch_db():
    conn = sqlite3.connect('crm.db')
    cursor = conn.cursor()
    
    # 1. Patch Trending table
    print("Patching Trending table...")
    trending_cols = [
        ("trend_score", "INTEGER DEFAULT 0"),
        ("search_volume", "INTEGER DEFAULT 0"),
        ("growth_rate", "INTEGER DEFAULT 0"),
        ("social_mentions", "INTEGER DEFAULT 0"),
        ("competition_gap", "INTEGER DEFAULT 0"),
        ("extra_metadata", "JSON DEFAULT '{}'")
    ]
    
    for col_name, col_type in trending_cols:
        try:
            cursor.execute(f"ALTER TABLE trending ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to trending")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in trending")

    # 2. Patch Post table
    print("Patching Post table...")
    post_cols = [
        ("word_count", "INTEGER DEFAULT 0"),
        ("seo_data", "JSON DEFAULT '{}'"),
        ("research_sources", "JSON DEFAULT '[]'"),
        ("pub_platform", "VARCHAR DEFAULT 'none'"),
        ("pub_meta", "JSON DEFAULT '{}'")
    ]
    
    for col_name, col_type in post_cols:
        try:
            cursor.execute(f"ALTER TABLE post ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to post")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in post")

    # 3. Create TrustSource table if it doesn't exist
    print("Creating TrustSource table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trustsource (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        domain VARCHAR UNIQUE,
        authority_score FLOAT DEFAULT 0.0,
        trust_score FLOAT DEFAULT 0.0,
        last_verified DATETIME,
        category VARCHAR DEFAULT 'General',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
    """)
    print("TrustSource table checked/created.")

    # 4. Patch TaskProgress table
    print("Patching TaskProgress table...")
    task_cols = [
        ("preview_data", "JSON DEFAULT '{}'")
    ]
    for col_name, col_type in task_cols:
        try:
            cursor.execute(f"ALTER TABLE task_progress ADD COLUMN {col_name} {col_type}")
            print(f"Added {col_name} to task_progress")
        except sqlite3.OperationalError:
            print(f"Column {col_name} already exists in task_progress")

    conn.commit()
    conn.close()
    print("Database patching complete.")

if __name__ == "__main__":
    patch_db()
