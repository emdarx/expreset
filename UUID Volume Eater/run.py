import requests
from tqdm import tqdm
import time
import os

url = "https://dn802605.us.archive.org/0/items/win-10-pro/Win10Pro.iso"
chunk_size = 52428800 #50MB

while True:
    size_mb = int(input("How much data do you want to download (in MB)? "))
    if size_mb < 50:
        print("Please enter a number greater than or equal to 50.")
        continue
    else:
        break

size_bytes = size_mb * 1024 * 1024

downloaded_bytes = 0
while downloaded_bytes < size_bytes:
    try:
        with requests.Session() as session:
            response = session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            with open("file.pkg", "ab") as f:
                for chunk in tqdm(response.iter_content(chunk_size=chunk_size),
                                  total=size_bytes // chunk_size + 1):
                    if chunk:
                        f.write(chunk)
                        downloaded_bytes += len(chunk)
                        if downloaded_bytes >= size_bytes:
                            break

    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
        print("Connection error or timeout occurred. Retrying in 10 seconds...")
        time.sleep(10)
        continue

print(f"Downloaded {downloaded_bytes / 1024 / 1024:.2f}MB")
os.remove("file.pkg")

input("Press Enter to exit")
