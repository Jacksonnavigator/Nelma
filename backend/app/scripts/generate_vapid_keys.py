"""Print a new key pair for browser (web push) alerts in the staff dashboard.

Run it once:  python -m app.scripts.generate_vapid_keys

Put the three lines it prints into Render's environment. The private key signs every alert, so treat it like a
password: it goes in Render only, never in the repository, never in a VITE_ variable. Changing the keys later
switches off every browser's alerts, and each person must press "Turn on alerts" again.
"""

import base64

from cryptography.hazmat.primitives.asymmetric import ec
from cryptography.hazmat.primitives.serialization import Encoding, PublicFormat


def _b64url(raw: bytes) -> str:
    return base64.urlsafe_b64encode(raw).rstrip(b"=").decode("ascii")


def generate() -> tuple[str, str]:
    private = ec.generate_private_key(ec.SECP256R1())
    private_raw = private.private_numbers().private_value.to_bytes(32, "big")
    public_raw = private.public_key().public_bytes(Encoding.X962, PublicFormat.UncompressedPoint)
    return _b64url(public_raw), _b64url(private_raw)


def main() -> None:
    public, private = generate()
    print("WEB_PUSH_ENABLED=true")
    print(f"VAPID_PUBLIC_KEY={public}")
    print(f"VAPID_PRIVATE_KEY={private}")
    print("VAPID_SUBJECT=mailto:nelma.water@nm-aist.ac.tz")


if __name__ == "__main__":
    main()
