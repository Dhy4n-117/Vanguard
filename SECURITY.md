# Security Policy

## 🛡️ Vanguard Sentinel — Security Policy

We take the security of Vanguard Sentinel seriously. If you discover a security vulnerability, we appreciate your help in disclosing it responsibly.

---

## Supported Versions

| Version | Supported          |
|---------|--------------------|
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report vulnerabilities through one of the following channels:

### 1. GitHub Private Vulnerability Reporting

Use [GitHub's private vulnerability reporting](https://github.com/Dhy4n-117/Vanguard/security/advisories/new) to submit a detailed report directly through the repository.

### 2. Email

Send an email to the maintainers with the following information:

- **Subject:** `[SECURITY] Vanguard Sentinel — Vulnerability Report`
- **Description** of the vulnerability
- **Steps to reproduce** the issue
- **Impact assessment** (what an attacker could achieve)
- **Affected component** (frontend, backend, graph database, API, etc.)
- **Suggested fix** (if you have one)

## What to Expect

- **Acknowledgment:** We will acknowledge receipt of your report within **48 hours**.
- **Assessment:** We will investigate and validate the vulnerability within **5 business days**.
- **Resolution:** We aim to release a patch within **14 days** for critical vulnerabilities.
- **Credit:** With your permission, we will credit you in the security advisory and changelog.

## Scope

The following components are in scope for security reports:

| Component | Description |
|-----------|-------------|
| **Backend API** | FastAPI endpoints, authentication, input validation |
| **Graph Database** | Neo4j Cypher injection, unauthorized data access |
| **Vector Store** | ChromaDB data integrity, prompt injection |
| **Frontend** | XSS, CSRF, sensitive data exposure |
| **WebSocket** | Stream hijacking, unauthorized connections |
| **Docker** | Container escape, misconfigured permissions |
| **Dependencies** | Known CVEs in third-party packages |

## Out of Scope

- Vulnerabilities in third-party services not maintained by this project
- Social engineering attacks
- Denial of service attacks against development/staging environments
- Issues in dependencies already reported upstream with pending fixes

## Security Best Practices

When contributing to Vanguard Sentinel, please follow these security guidelines:

1. **Never commit secrets** — Use `.env` files and ensure they are in `.gitignore`
2. **Validate all inputs** — Both on the frontend and backend
3. **Use parameterized queries** — Never construct Cypher queries with string concatenation
4. **Keep dependencies updated** — Regularly run `npm audit` and `pip audit`
5. **Follow least privilege** — Database users should have minimal required permissions

## Disclosure Policy

We follow a **coordinated disclosure** process:

1. Reporter submits vulnerability privately
2. We validate and assess severity
3. We develop and test a fix
4. We release the fix and publish a security advisory
5. Reporter is credited (with consent)

---

*This security policy is effective as of June 2026 and applies to all versions of Vanguard Sentinel.*
