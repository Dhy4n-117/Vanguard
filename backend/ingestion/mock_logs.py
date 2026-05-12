"""
Vanguard Sentinel — Mock Log Generator
Generates ~120 realistic cybersecurity log entries for demonstration.
"""

import random
import uuid
from datetime import datetime, timedelta


# ─── Seed Data ────────────────────────────────────────────

THREAT_ACTORS = [
    {"name": "APT28",        "alias": "Fancy Bear",       "threat_level": "CRITICAL"},
    {"name": "Lazarus",      "alias": "Hidden Cobra",     "threat_level": "CRITICAL"},
    {"name": "APT41",        "alias": "Double Dragon",    "threat_level": "HIGH"},
    {"name": "DarkHydrus",   "alias": "LazyMeerkat",      "threat_level": "HIGH"},
    {"name": "Sandworm",     "alias": "Voodoo Bear",      "threat_level": "CRITICAL"},
]

MALICIOUS_IPS = [
    {"address": "185.220.101.42",  "geo": "Russia",        "asn": "AS51396"},
    {"address": "91.219.236.88",   "geo": "Netherlands",   "asn": "AS49505"},
    {"address": "103.224.182.251", "geo": "China",         "asn": "AS4134"},
    {"address": "194.61.24.102",   "geo": "Ukraine",       "asn": "AS57043"},
    {"address": "45.129.56.200",   "geo": "Iran",          "asn": "AS44444"},
    {"address": "77.83.247.81",    "geo": "Moldova",       "asn": "AS39798"},
    {"address": "185.56.83.100",   "geo": "Germany",       "asn": "AS24961"},
    {"address": "211.56.98.33",    "geo": "North Korea",   "asn": "AS131279"},
]

BENIGN_IPS = [
    {"address": "10.0.1.50",       "geo": "Internal",      "asn": "PRIVATE"},
    {"address": "10.0.1.100",      "geo": "Internal",      "asn": "PRIVATE"},
    {"address": "10.0.2.25",       "geo": "Internal",      "asn": "PRIVATE"},
    {"address": "192.168.1.10",    "geo": "Internal",      "asn": "PRIVATE"},
    {"address": "172.16.0.5",      "geo": "Internal",      "asn": "PRIVATE"},
    {"address": "8.8.8.8",         "geo": "United States", "asn": "AS15169"},
    {"address": "1.1.1.1",         "geo": "United States", "asn": "AS13335"},
]

ASSETS = [
    {"hostname": "web-server-01",    "os": "Ubuntu 22.04",      "criticality": 4, "department": "Engineering"},
    {"hostname": "web-server-02",    "os": "Ubuntu 22.04",      "criticality": 3, "department": "Engineering"},
    {"hostname": "db-server-prod",   "os": "CentOS 8",          "criticality": 5, "department": "Data"},
    {"hostname": "db-server-stage",  "os": "CentOS 8",          "criticality": 2, "department": "Data"},
    {"hostname": "api-gateway",      "os": "Alpine Linux",      "criticality": 5, "department": "Platform"},
    {"hostname": "mail-server",      "os": "Windows Server 22", "criticality": 3, "department": "IT"},
    {"hostname": "vpn-concentrator", "os": "Cisco IOS",         "criticality": 4, "department": "Network"},
    {"hostname": "dc-primary",       "os": "Windows Server 22", "criticality": 5, "department": "IT"},
]

VULNERABILITIES = [
    {"cve_id": "CVE-2024-3400", "cvss": 10.0, "desc": "PAN-OS Command Injection in GlobalProtect Gateway",           "severity": "CRITICAL"},
    {"cve_id": "CVE-2024-21887", "cvss": 9.1,  "desc": "Ivanti Connect Secure Command Injection",                     "severity": "CRITICAL"},
    {"cve_id": "CVE-2023-46805", "cvss": 8.2,  "desc": "Ivanti Connect Secure Authentication Bypass",                 "severity": "HIGH"},
    {"cve_id": "CVE-2024-1709",  "cvss": 10.0, "desc": "ConnectWise ScreenConnect Authentication Bypass",             "severity": "CRITICAL"},
    {"cve_id": "CVE-2023-44228", "cvss": 7.5,  "desc": "Apache Log4j Remote Code Execution",                          "severity": "HIGH"},
    {"cve_id": "CVE-2024-27198", "cvss": 9.8,  "desc": "JetBrains TeamCity Authentication Bypass",                    "severity": "CRITICAL"},
]

EVENT_TYPES = [
    "AUTH_FAILURE",
    "EXPLOIT_ATTEMPT",
    "PORT_SCAN",
    "DATA_EXFIL",
    "MALWARE_DETECTED",
    "PRIVILEGE_ESCALATION",
    "BRUTE_FORCE",
    "LATERAL_MOVEMENT",
    "C2_BEACON",
    "PHISHING_ATTEMPT",
]

SEVERITY_LEVELS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"]

LOG_TEMPLATES = [
    "Failed SSH login from {ip} to {asset} — user '{user}' — attempt {n}/5",
    "Exploit attempt detected: {cve} targeting {asset} from {ip}",
    "Port scan detected from {ip} — {ports} ports scanned on {asset}",
    "Suspicious outbound data transfer: {asset} → {ip} — {size}MB exfiltrated",
    "Malware signature match on {asset}: {malware} — source IP {ip}",
    "Privilege escalation detected on {asset}: user '{user}' → root via sudo abuse",
    "Brute force attack: {n} failed logins from {ip} on {asset} in 60 seconds",
    "Lateral movement detected: {ip} → {asset} via SMB/PSEXEC",
    "C2 beacon traffic: {asset} → {ip} — interval {interval}s — protocol HTTPS",
    "Phishing email from {ip} targeting {user}@corp.local — attachment: {file}",
]


def _random_ts(base: datetime, spread_hours: int = 72) -> str:
    """Generate a random timestamp within `spread_hours` of `base`."""
    delta = timedelta(seconds=random.randint(0, spread_hours * 3600))
    return (base - delta).isoformat() + "Z"


def generate_mock_logs(count: int = 120) -> list[dict]:
    """
    Generate `count` mock cybersecurity log entries.
    Each entry contains: entities involved, relationships, and raw log text.
    """
    base_time = datetime(2024, 11, 15, 14, 30, 0)
    logs = []

    for i in range(count):
        event_type = random.choice(EVENT_TYPES)
        severity = random.choice(SEVERITY_LEVELS)
        actor = random.choice(THREAT_ACTORS)
        mal_ip = random.choice(MALICIOUS_IPS)
        asset = random.choice(ASSETS)
        vuln = random.choice(VULNERABILITIES)

        # Build raw log text from template
        template = random.choice(LOG_TEMPLATES)
        raw_text = template.format(
            ip=mal_ip["address"],
            asset=asset["hostname"],
            user=random.choice(["admin", "root", "jdoe", "svc_account", "backup_user"]),
            n=random.randint(1, 50),
            cve=vuln["cve_id"],
            ports=random.randint(10, 65535),
            size=round(random.uniform(0.5, 500.0), 1),
            malware=random.choice(["Cobalt Strike", "Emotet", "TrickBot", "Ryuk", "Mimikatz"]),
            interval=random.choice([30, 60, 120, 300]),
            file=random.choice(["invoice.pdf.exe", "report_q4.xlsm", "update.scr", "resume.docm"]),
        )

        log_entry = {
            "id": str(uuid.uuid4()),
            "timestamp": _random_ts(base_time),
            "raw_text": raw_text,
            "event_type": event_type,
            "severity": severity,
            # ── Entities referenced in this log ──
            "threat_actor": actor,
            "source_ip": {
                "address": mal_ip["address"],
                "geo_location": mal_ip["geo"],
                "is_malicious": True,
                "asn": mal_ip["asn"],
            },
            "target_asset": asset,
            "vulnerability": vuln if event_type in ("EXPLOIT_ATTEMPT", "PRIVILEGE_ESCALATION") else None,
        }
        logs.append(log_entry)

    return logs


# Allow running standalone
if __name__ == "__main__":
    import json
    logs = generate_mock_logs(120)
    print(json.dumps(logs[:3], indent=2))
    print(f"\n[OK] Generated {len(logs)} mock log entries")
