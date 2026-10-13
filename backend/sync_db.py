import sys
from sqlalchemy import text
from app.core.database import engine

def sync_database():
    sql_statements = [
        "RENAME TABLE schedules TO work_schedules;",
        "RENAME TABLE appointment_services TO invoice_details;",
        "ALTER TABLE users RENAME COLUMN hashed_password TO password_hash;",
        "ALTER TABLE customers RENAME COLUMN notes TO hair_type_notes;",
        "ALTER TABLE customers ADD COLUMN total_visits INT NOT NULL DEFAULT 0;",
        "ALTER TABLE services ADD COLUMN service_code VARCHAR(20) UNIQUE;",
        "ALTER TABLE appointments RENAME COLUMN hairdresser_id TO stylist_id;",
        "ALTER TABLE appointments RENAME COLUMN total_price TO estimated_total;",
        "ALTER TABLE appointments RENAME COLUMN notes TO customer_note;",
        "ALTER TABLE appointments ADD COLUMN start_time TIME NULL;",
        "ALTER TABLE service_histories RENAME COLUMN service_names TO technical_notes;",
        "ALTER TABLE service_histories RENAME COLUMN completed_at TO recorded_at;"
    ]

    print("Starting database synchronization for MySQL...")
    
    # Use engine.begin() to manage the transaction automatically.
    # Note: DDL statements (ALTER, RENAME) in MySQL cause implicit commits.
    try:
        with engine.begin() as connection:
            for stmt in sql_statements:
                print(f"Executing: {stmt}")
                connection.execute(text(stmt))
                print(" -> Success")
        print("\nDatabase synchronization completed successfully!")
    except Exception as e:
        print(f"\n[ERROR] An error occurred during execution:\n{e}")
        print("Synchronization aborted.")
        sys.exit(1)

if __name__ == "__main__":
    sync_database()
