import requests
from tqdm import tqdm
import time

url = "http://at1.cdn.asandl.com/software/os/windows/8.1/2017/December/AW8.1.Pro.December.2017.x86.x64_AsanDl.com.part1.rar"
chunk_size = 52428800  # 50MB in bytes

# get user input for desired download size
size_mb = int(input("How much internet volume should I use (in MB)? "))
size_bytes = size_mb * 1024 * 1024

# initiate download
downloaded_bytes = 0
while downloaded_bytes < size_bytes:
    try:
        with requests.Session() as session:
            response = session.get(url, stream=True, timeout=30)
            response.raise_for_status()

            with open("file.bin", "ab") as f:
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
