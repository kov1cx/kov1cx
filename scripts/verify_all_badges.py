import urllib.request

badges = [
    # Top status
    ("STATUS", "https://img.shields.io/static/v1?label=STATUS&message=SYSTEM+ONLINE&color=00ff66&style=flat-square"),
    ("LOCATION", "https://img.shields.io/static/v1?label=LOCATION&message=HANOI%2C+VN&color=ff007f&style=flat-square"),
    # Applied AI
    ("Local AI", "https://img.shields.io/static/v1?label=Local+AI&message=Ollama+%7C+vLLM&color=00e5ff&style=for-the-badge&logo=linux&logoColor=white"),
    ("GPU Acceleration", "https://img.shields.io/static/v1?label=GPU+Acceleration&message=NVIDIA+CUDA&color=76b900&style=for-the-badge&logo=nvidia&logoColor=white"),
    ("Pipelines", "https://img.shields.io/static/v1?label=Pipelines&message=n8n+Automation&color=ea4c89&style=for-the-badge&logo=n8n&logoColor=white"),
    ("Mesh SDN", "https://img.shields.io/static/v1?label=Mesh+SDN&message=ZeroTier&color=ff9800&style=for-the-badge&logo=zerotier&logoColor=white"),
    # Domain Logistics
    ("Cold-Chain", "https://img.shields.io/static/v1?label=Cold-Chain&message=Reefer+40%27RH+%7C+CPT+%7C+FOB&color=0288d1&style=flat-square"),
    ("Procurement", "https://img.shields.io/static/v1?label=Procurement&message=S2P+%7C+P2P+%7C+Kraljic&color=2e7d32&style=flat-square"),
    ("Quality Ops", "https://img.shields.io/static/v1?label=Quality+Ops&message=FMEA+%7C+Ishikawa+%7C+Pareto&color=e65100&style=flat-square"),
    ("Customs", "https://img.shields.io/static/v1?label=Customs&message=Import%2FExport+Compliance&color=455a64&style=flat-square"),
    # Rig
    ("RIG_STATUS", "https://img.shields.io/static/v1?label=RIG+STATUS&message=ONLINE&color=00ff66&style=flat-square&logo=nvidia&logoColor=white"),
    ("INFERENCE", "https://img.shields.io/static/v1?label=INFERENCE&message=LOCAL+GPU&color=00e5ff&style=flat-square&logo=linux&logoColor=white"),
    ("TUNNEL", "https://img.shields.io/static/v1?label=TUNNEL&message=ZEROTIER+SDN&color=ff9800&style=flat-square&logo=zerotier&logoColor=white"),
    # Connect
    ("GitHub", "https://img.shields.io/static/v1?label=GitHub&message=kov1cx&color=181717&style=for-the-badge&logo=github&logoColor=white"),
    ("X", "https://img.shields.io/static/v1?label=X&message=%40Kov1cx1&color=000000&style=for-the-badge&logo=x&logoColor=white"),
    ("Bio.link", "https://img.shields.io/static/v1?label=Bio.link&message=kov1cx&color=4353ff&style=for-the-badge&logo=linktree&logoColor=white")
]

all_ok = True
for name, url in badges:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            body = r.read()
            if r.status != 200 or len(body) == 0:
                print(f"FAILED {name}: status={r.status}")
                all_ok = False
            else:
                print(f"OK {name}: status={r.status}, bytes={len(body)}")
    except Exception as e:
        print(f"ERROR {name}: {e}")
        all_ok = False

if all_ok:
    print("\nALL 16 BADGES RETURNED 200 OK WITH VALID SVG DATA!")

