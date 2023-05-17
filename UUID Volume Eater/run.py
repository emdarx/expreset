import requests
import concurrent.futures
from tqdm import tqdm
import time
import atexit
import os

url = "https://archive.org/download/windows-11_202201/Win11_Hungarian_x64v1.iso"
chunk_size = 52428800  # 50MB in bytes

# get user input for desired download size
size_mb = int(input("How much internet volume should I use (in MB)? "))
size_bytes = size_mb * 1024 * 1024

# calculate the number of chunks needed
num_chunks = size_bytes // chunk_size
if size_bytes % chunk_size != 0:
    num_chunks += 1

# function to download a chunk
def download_chunk(chunk_start):
    try:
        with requests.Session() as session:
            response = session.get(url, headers={"Range": f"bytes={chunk_start}-{chunk_start+chunk_size-1}"}, stream=True, timeout=30)
            response.raise_for_status()

            with open(f"file_{chunk_start}.bin", "wb") as f:
                for chunk in tqdm(response.iter_content(chunk_size=chunk_size), total=1):
                    if chunk:
                        f.write(chunk)

    except (requests.exceptions.Timeout, requests.exceptions.ConnectionError):
        print(f"Connection error or timeout occurred for chunk starting at {chunk_start}. Retrying...")

# cleanup function to delete downloaded files
def cleanup_files():
    for chunk_start in chunk_starts:
        file_path = f"file_{chunk_start}.bin"
        if os.path.exists(file_path):
            os.remove(file_path)

# initiate download with multiple connections
downloaded_bytes = 0
chunk_starts = [chunk_size * i for i in range(num_chunks)]
with concurrent.futures.ThreadPoolExecutor() as executor:
    futures = [executor.submit(download_chunk, chunk_start) for chunk_start in chunk_starts]
    for future in concurrent.futures.as_completed(futures):
        try:
            future.result()
            downloaded_bytes += chunk_size
        except Exception as e:
            print(f"An error occurred: {e}")

print(f"Downloaded {downloaded_bytes / 1024 / 1024:.2f}MB")

# register the cleanup function
atexit.register(cleanup_files)
