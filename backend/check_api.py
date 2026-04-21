import httpx
import asyncio

async def main():
    async with httpx.AsyncClient() as client:
        try:
            r = await client.get('http://127.0.0.1:8000/api/notifications/complaints/latest')
            print("Laravel Proxy Response:", r.status_code)
            print(r.text)
        except Exception as e:
            print("Proxy Error:", e)
            
        try:
            # Let's try FastAPI directly, assuming it runs on 8001 or 5000 or similar
            # Since I don't know the port, I'll just try 8000. Wait, Laravel is 8000!
            # If Laravel is 8000, maybe FastAPI is 8001?
            pass
        except Exception as e:
            pass

asyncio.run(main())
