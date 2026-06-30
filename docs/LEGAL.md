# Legal

## License

This SDK is distributed under the **MIT License**. See [LICENSE](./LICENSE).

## Publisher

**SATOSHI FRAMEWORK SASU**
Société par Actions Simplifiée Unipersonnelle (SASU)
Registered in France

Contact: hello@satoshiframework.com

## Data Protection & GDPR

### Roles under GDPR

**The lender is the data controller** (GDPR Art. 4(7)) for the credit assessment purpose.
SATOSHI FRAMEWORK SASU operates as a **data processor** (Art. 28 GDPR), processing creator
personal data solely on the lender's documented instructions and for the purpose of generating
Risk Tapes for credit assessment.

SATOSHI FRAMEWORK SASU is an independent data controller only for its own operational purposes
(billing, account management, service improvement) — not for the credit assessment data flows
this SDK facilitates.

The lawful basis for processing creator personal data is **explicit consent** pursuant to
GDPR Article 6(1)(a). Consent is collected from the creator through the Creatorlayer consent
flow before any data is accessed.

### Data location & transfers

| Component | Location | Provider | Safeguard |
|---|---|---|---|
| API & PostgreSQL database | France (EU) | Scalingo SAS | — |
| Redis cache | France (EU) | Scalingo SAS | — |
| Transactional email | USA | Resend Inc. | EU Standard Contractual Clauses (Art. 46) |
| Error monitoring | USA | Functional Software, Inc. (Sentry) | EU Standard Contractual Clauses (Art. 46) |

Platform API calls (YouTube, Twitch, TikTok, Patreon, etc.) are directed to each platform's
own servers, which may be outside the EU. Each platform is an independent data controller
authorised directly by the creator — they are not sub-processors of SATOSHI FRAMEWORK SASU.

### Creator rights

Creators whose data is processed via the API retain the following rights under GDPR:

- **Right of access** (Art. 15) — available via the creator Privacy Center
- **Right to rectification** (Art. 16) — available via the creator Privacy Center
- **Right to erasure** (Art. 17) — data deleted within 30 days of request
- **Right to restriction** (Art. 18) — available via the creator Privacy Center
- **Right to data portability** (Art. 20) — data export available in JSON format
- **Right to object** (Art. 21) — available via the creator Privacy Center
- **Right to withdraw consent** — creators may withdraw consent at any time; all data is deleted within 30 days

### Lender obligations

As data controller, the lender integrating this SDK is responsible for:

- Maintaining a valid legal basis for processing creator data received from Creatorlayer
- Executing the Creatorlayer **Data Processing Agreement (DPA)** before the first production
  API call — contact hello@satoshiframework.com
- Honouring creator rights requests within statutory deadlines
- Notifying SATOSHI FRAMEWORK SASU of any personal data breach affecting Risk Tape data
- Complying with applicable regulations (GDPR, DORA, EBA Outsourcing Guidelines, etc.)

### Data Processing Agreement

A Data Processing Agreement (DPA) must be in place before your first production API call.
The DPA establishes the lender's obligations as data controller and SATOSHI FRAMEWORK SASU's
obligations as data processor under Art. 28 GDPR.

Contact **hello@satoshiframework.com** to initiate the DPA process.

## Third-Party Notices

This SDK depends on the following open-source packages:

| Package | License |
|---|---|
| `node-fetch` / `undici` | MIT |
| TypeScript (dev) | Apache-2.0 |

A full dependency list is available in `package.json`.
