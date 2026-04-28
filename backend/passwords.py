import bcrypt

def hash_password(password: str) -> str:
    password_bytes = password.encode("utf-8")
    if len(password_bytes) > 72:
        raise ValueError("Password must not exceed 72 bytes when encoded.")

    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(password_bytes, salt)
    hashed_str = hashed_bytes.decode('utf-8')
    
    if hashed_str.startswith("$2b$"):
        return "$2y$" + hashed_str[4:]
    return hashed_str
