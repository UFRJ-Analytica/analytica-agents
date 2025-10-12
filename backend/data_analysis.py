import psycopg2
from psycopg2.extras import RealDictCursor
import pandas as pd

conn = psycopg2.connect(
                host="grupo3-agent-db.c7bh93xirm1i.us-east-1.rds.amazonaws.com",
                dbname="postgres",
                user="postgres",
                password="12345678",
                port=5432
            )
cursor = conn.cursor(cursor_factory=RealDictCursor)

# Execução da query
cursor.execute("SELECT * FROM procedimento;")
print(cursor.fetchall())