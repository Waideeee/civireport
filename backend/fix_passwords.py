from database import engine
from sqlalchemy import text
import bcrypt

with engine.connect() as conn:
    res = conn.execute(text("SELECT user_id, email, password FROM users"))
    users = res.fetchall()
    for user_id, email, password in users:
        if not password:
            continue
        if password.startswith('$2y$'):
            print(f"Skipping {email}, already hashed correctly.")
            continue
            
        if password.startswith('$2b$'):
            # Fix passlib $2b$ to Laravel $2y$
            hashed = "$2y$" + password[4:]
            conn.execute(text("UPDATE users SET password = :p WHERE user_id = :u"), {"p": hashed, "u": user_id})
            conn.commit()
            print(f"Fixed $2b$ hash to $2y$ for {email}")
            continue
        
        # Hash plaintext passwords
        hashed = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        if hashed.startswith('$2b$'):
            hashed = "$2y$" + hashed[4:]
            
        conn.execute(text("UPDATE users SET password = :p WHERE user_id = :u"), {"p": hashed, "u": user_id})
        conn.commit()
        print(f"Hashed plaintext password for {email}")
