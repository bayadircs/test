
import json
import re
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

ACCOUNTS = ["raghdiscoding", "takecaregirly"]
OUTPUT = Path("followers.json")

# Load previously saved data
if OUTPUT.exists():
    data = json.loads(
        OUTPUT.read_text(encoding="utf-8")
    )
else:
    data = {"accounts": {}}

data.setdefault("accounts", {})

def parse_count(value):
    value = value.strip().upper().replace(",", "")
    match = re.fullmatch(
        r"([\d.]+)\s*([KMB]?)", value
    )

    if not match:
        raise ValueError("Invalid follower count")

    number = float(match.group(1))
    multiplier = {
        "": 1,
        "K": 1000,
        "M": 1000000,
        "B": 1000000000
    }[match.group(2)]

    return round(number * multiplier)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)

    page = browser.new_page(
        viewport={"width": 1280, "height": 900},
        locale="en-US"
    )

    success = 0

    for username in ACCOUNTS:
        print(f"Checking @{username}")

        for attempt in range(3):
            try:
                page.goto(
                    f"https://www.tiktok.com/@{username}",
                    wait_until="domcontentloaded",
                    timeout=60000
                )

                count_text = page.locator(
                    '[data-e2e="followers-count"]'
                ).first.inner_text(timeout=20000)

                count = parse_count(count_text)

                data["accounts"][username] = {
                    "followers": count,
                    "display": count_text,
                    "checked_at": datetime.now(
                        timezone.utc
                    ).isoformat()
                }

                print(
                    f"SUCCESS: @{username} = {count_text}"
                )

                success += 1
                break

            except Exception as error:
                print(
                    f"Attempt {attempt + 1} failed: {error}"
                )
                page.wait_for_timeout(3000)

    browser.close()

data["updated_at"] = datetime.now(
    timezone.utc
).isoformat()

OUTPUT.write_text(
    json.dumps(
        data,
        ensure_ascii=False,
        indent=2
    ),
    encoding="utf-8"
)

print(f"Updated {success}/{len(ACCOUNTS)} accounts")

if success == 0:
    raise RuntimeError(
        "Could not read TikTok follower counts"
    )
