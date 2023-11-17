from dotenv import load_dotenv
import os
from minio import Minio
from minio.error import S3Error

load_dotenv()


# Create a client with the MinIO server playground, its access key
# and secret key.
minio_client = Minio(
    os.environ.get("MINIO_URL", "localhost:9002"),
    access_key=os.environ.get("MINIO_USERNAME", "minioadmin"),
    secret_key=os.environ.get("MINIO_PASSWORD", "minioadmin"),
    secure=False,
)

# Make 'backup' bucket if not exist.
found = minio_client.bucket_exists("backup")
if not found:
    minio_client.make_bucket("backup")
else:
    print("Bucket 'backup' already exists")
