import type { Creatorlayer } from "../Creatorlayer.js";

export type DataRoomDocument = "dpa" | "lender-onboarding" | "pilot-terms";

export interface DataRoomGateParams {
  /** Full name of the requesting individual. */
  name: string;
  /** Work email address. */
  email: string;
  /** Organisation name. */
  company: string;
  /** The document being requested. */
  document: DataRoomDocument;
}

export interface DataRoomGateResponse {
  ok: boolean;
}

export class DataRoom {
  constructor(private readonly client: Creatorlayer) {}

  /**
   * Submit a request for access to a gated Data Room document (DPA, Lender Onboarding
   * Terms, or Pilot Program Terms). The Creatorlayer team is notified and will send the
   * document to the provided email address.
   *
   * This endpoint is unauthenticated — no API key is required.
   *
   * @example
   * await cl.dataRoom.gateAccess({
   *   name: "Alice Martin",
   *   email: "alice@lender.com",
   *   company: "Acme Lending Ltd",
   *   document: "dpa",
   * });
   */
  gateAccess(params: DataRoomGateParams): Promise<DataRoomGateResponse> {
    return this.client._request<DataRoomGateResponse>(
      "POST",
      "/api/v1/data-room/gate",
      { body: params }
    );
  }
}
