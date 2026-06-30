import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { Creatorlayer } from "./Creatorlayer.js";
import { CreatorlayerError } from "./errors.js";
import type { CreateVerificationParams, EnrollMonitoringParams } from "./types.js";

function buildClient(): Creatorlayer {
  const apiKey = process.env.CREATORLAYER_API_KEY;
  if (!apiKey) {
    throw new Error(
      "CREATORLAYER_API_KEY environment variable is required. " +
      "Set it to your Creatorlayer lender API key (format: cl_live_... or " +
      "cl_demo_api_key for sandbox testing)."
    );
  }
  return new Creatorlayer({
    apiKey,
    sandbox: process.env.CREATORLAYER_SANDBOX === "true",
  });
}

const TOOLS = [
  {
    name: "create_verification",
    description:
      "Initiate a creator income verification. Returns a consent_url to send to the " +
      "creator and a verification_id to track progress. The creator visits consent_url " +
      "to connect their revenue platforms (YouTube, Twitch, Stripe, Patreon, etc.) via " +
      "OAuth. After consent, call check_eligibility (free) to screen, or get_tape " +
      "(billable, €100 excl. TVA) to retrieve the full Risk Tape.",
    inputSchema: {
      type: "object" as const,
      properties: {
        obligor_reference: {
          type: "string",
          description: "Your internal ID for this creator (max 100 chars, no PII)",
        },
        lender_name: {
          type: "string",
          description: "Your institution name — displayed to the creator in the consent UI",
        },
        product_type: {
          type: "string",
          enum: ["term_loan", "rbf", "revenue_loan", "venture_debt", "securitization_pool"],
          description:
            "Financial product type — drives eligibility thresholds and covenant selection. " +
            "Use rbf for revenue-based financing, term_loan for fixed-term amortising loans.",
        },
        creator_email: {
          type: "string",
          description:
            "Creator email — pre-fills the consent UI (optional). " +
            "Creatorlayer does not email the creator; you must deliver the consent_url.",
        },
        return_url: {
          type: "string",
          description: "URL to redirect the creator to after consent is complete (must be https://)",
        },
        webhook_url: {
          type: "string",
          description:
            "Per-verification webhook endpoint for verification.completed events. " +
            "Overrides the account-level webhook URL.",
        },
        custom_reference: {
          type: "string",
          description: "Opaque reference string stored on the verification (e.g. your loan application ID)",
        },
      },
      required: ["obligor_reference", "product_type"],
      additionalProperties: false,
    },
  },
  {
    name: "get_verification",
    description:
      "Check the status of a verification. " +
      "Status values: pending_creator_consent (creator has not yet completed OAuth), " +
      "processing (platform data is being fetched), completed (tape is ready — call get_tape), " +
      "failed, expired.",
    inputSchema: {
      type: "object" as const,
      properties: {
        verification_id: {
          type: "string",
          description: "The verification_id returned by create_verification (format: ver_...)",
        },
      },
      required: ["verification_id"],
      additionalProperties: false,
    },
  },
  {
    name: "check_eligibility",
    description:
      "Screen a completed verification for financing eligibility. Free — does not count " +
      "against tape quota. Returns eligible (boolean | null while pending), risk_tier " +
      "(prime | standard | subprime | ineligible | null), and data_quality_score. " +
      "Use this before get_tape to avoid paying for ineligible creators.",
    inputSchema: {
      type: "object" as const,
      properties: {
        verification_id: {
          type: "string",
          description: "The verification_id to screen (status must be completed)",
        },
      },
      required: ["verification_id"],
      additionalProperties: false,
    },
  },
  {
    name: "get_tape",
    description:
      "Retrieve the full Risk Tape for a completed verification. Billable at €100 excl. TVA. " +
      "Returns income metrics, eligibility decisions per product type, covenants, and a " +
      "signed_jwt (ES256 JWT for offline cryptographic verification). " +
      "The engine is deterministic and ML-free: the same inputs always produce the same tape. " +
      "If stale_platforms is present in the response, some platform data is older than 30 days — " +
      "consider requesting a re-sync before a lending decision.",
    inputSchema: {
      type: "object" as const,
      properties: {
        verification_id: {
          type: "string",
          description: "The verification_id to retrieve (status must be completed)",
        },
      },
      required: ["verification_id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_monitored",
    description:
      "List all verifications currently enrolled in portfolio monitoring. " +
      "Returns verification IDs, income baselines, monthly billing amounts " +
      "(monthly_rate_cents where 500 = €5.00), alert thresholds, last check " +
      "timestamps, and last alert timestamps.",
    inputSchema: {
      type: "object" as const,
      properties: {},
      required: [],
      additionalProperties: false,
    },
  },
  {
    name: "enroll_monitoring",
    description:
      "Enroll a completed verification in portfolio monitoring. Creatorlayer re-checks " +
      "the creator's income daily using existing OAuth tokens and alerts the lender if " +
      "avg_monthly_revenue drops more than alert_threshold_pct below the baseline. " +
      "Billed at €5.00/month per enrolled tape. " +
      "IMPORTANT: this requires separate explicit creator consent for ongoing monitoring — " +
      "confirm creator consent before enrolling.",
    inputSchema: {
      type: "object" as const,
      properties: {
        verification_id: {
          type: "string",
          description: "The verification_id to enroll (status must be completed)",
        },
        alert_threshold_pct: {
          type: "number",
          description:
            "Income drop percentage that triggers an alert. Default 20 (= 20% drop). Range: 5–80.",
        },
      },
      required: ["verification_id"],
      additionalProperties: false,
    },
  },
  {
    name: "unenroll_monitoring",
    description:
      "Stop portfolio monitoring for a verification. Terminates daily income re-checks " +
      "and the recurring billing item immediately.",
    inputSchema: {
      type: "object" as const,
      properties: {
        verification_id: {
          type: "string",
          description: "The verification_id to unenroll",
        },
      },
      required: ["verification_id"],
      additionalProperties: false,
    },
  },
];

type Args = Record<string, unknown>;

export async function runMcpServer(): Promise<void> {
  const cl = buildClient();

  const server = new Server(
    { name: "creatorlayer", version: "0.2.0" },
    { capabilities: { tools: {} } }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    const a = args as Args;

    try {
      let result: unknown;

      switch (name) {
        case "create_verification":
          result = await cl.verifications.create(a as unknown as CreateVerificationParams);
          break;

        case "get_verification":
          result = await cl.verifications.retrieve(a.verification_id as string);
          break;

        case "check_eligibility":
          result = await cl.verifications.retrieveEligibility(a.verification_id as string);
          break;

        case "get_tape":
          result = await cl.verifications.retrieveTape(a.verification_id as string);
          break;

        case "list_monitored":
          result = await cl.verifications.listMonitored();
          break;

        case "enroll_monitoring": {
          const params: EnrollMonitoringParams = {};
          if (typeof a.alert_threshold_pct === "number") {
            params.alert_threshold_pct = a.alert_threshold_pct;
          }
          result = await cl.verifications.enroll(a.verification_id as string, params);
          break;
        }

        case "unenroll_monitoring":
          result = await cl.verifications.unenroll(a.verification_id as string);
          break;

        default:
          return {
            content: [{ type: "text" as const, text: `Unknown tool: ${name}` }],
            isError: true,
          };
      }

      return {
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      };
    } catch (err) {
      const message =
        err instanceof CreatorlayerError
          ? `Creatorlayer API error (HTTP ${err.status}): ${err.message}`
          : err instanceof Error
          ? err.message
          : String(err);

      return {
        content: [{ type: "text" as const, text: message }],
        isError: true,
      };
    }
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
