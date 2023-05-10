import requests
from tqdm import tqdm
import time
import os

url = "http://gs2.ww.prod.dl.playstation.net/gs2/ppkgo/prod/CUSA33387_00/8/f_48b7cbab941b354b0f3779e37f3f3a021d6a072f60cc6917a726077f24479528/f/UP0102-CUSA33387_00-RE4RMAINGAME0000-A0105-V0100_0.pkg"
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
