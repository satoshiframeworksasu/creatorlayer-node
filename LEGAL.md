# Legal

## License

This SDK is distributed under the **MIT License**. See [LICENSE](./LICENSE).

## Publisher

**SATOSHI FRAMEWORK SASU**
Société par Actions Simplifiée Unipersonnelle (SASU)
Registered in France

Contact: hello@satoshiframework.com

## Data Residency & GDPR

### Data controller

When you use the Creatorlayer API via this SDK, the data controller for any personal data processed is:

> **SATOSHI FRAMEWORK SASU**, a company incorporated in France under French law.

The lawful basis for processing creator personal data is **explicit consent** pursuant to GDPR Article 6(1)(a). Consent is collected from the creator through the Creatorlayer consent flow before any data is accessed.

### Data location

All personal data processed through the Creatorlayer API is stored and processed **exclusively in the EU**:

| Component | Location | Provider |
|---|---|---|
| API & PostgreSQL database | France | Scalingo SAS |
| Redis cache | France | Scalingo SAS |
| Transactional email | USA (SCCs in place) | Resend |

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

If you are a regulated lender using this SDK, you may be acting as a **joint controller** or **independent controller** for personal data received via the Risk Tape. You are responsible for:

- Maintaining your own legal basis for processing creator data received from Creatorlayer
- Executing the Creatorlayer **Data Processing Agreement (DPA)** — contact hello@satoshiframework.com
- Complying with applicable regulations (GDPR, DORA, EBA Outsourcing Guidelines, etc.)
- Notifying your competent supervisory authority of any material outsourcing arrangement

### DPA and sub-processors

A full Data Processing Agreement is available on request. Current sub-processors are listed in the [Creatorlayer compliance documentation](https://docs.creatorlayer.eu/compliance/soc2-overview).

Contact **hello@satoshiframework.com** to request the DPA.

## Third-Party Notices

This SDK depends on the following open-source packages:

| Package | License |
|---|---|
| `node-fetch` / `undici` | MIT |
| TypeScript (dev) | Apache-2.0 |

A full dependency list is available in `package.json`.
