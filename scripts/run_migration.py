"""Execute Supabase SQL migration using the SQL endpoint."""
import urllib.request
import json
import sys

SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdsa2ltcmlveXNkb3d3eWdwbGlxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDg4NjMxOSwiZXhwIjoyMTAwMDQ2MzE5fQ.ZLTbXDrdvB2PGRNNnjKexEkWlqrFHM_mP1cMqX7AHSw"
MGMT_TOKEN = "sbp_15a8aa24007ab2cb5690a76d221b2ff02e095951"

with open(sys.argv[1], 'r', encoding='utf-8') as f:
    sql = f.read()

data = json.dumps({'query': sql}).encode('utf-8')
req = urllib.request.Request(
    f'https://api.supabase.com/v1/projects/glkimrioysdowwygpliq/query',
    data=data,
    headers={'Authorization': f'Bearer {MGMT_TOKEN}', 'Content-Type': 'application/json'}
)

try:
    resp = urllib.request.urlopen(req)
    body = resp.read().decode()
    print(f'Status: {resp.status}')
    print(f'Response: {body[:1000]}')
except urllib.error.HTTPError as e:
    print(f'Error {e.code}: {e.read().decode()[:500]}')
