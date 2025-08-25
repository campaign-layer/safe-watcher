import logger from "../logger.js";
import type { Signer } from "../safe/index.js";
import type { Event, EventType, INotifier } from "../types.js";

const ACTIONS: Record<EventType, string> = {
  created: "created",
  updated: "updated",
  executed: "executed",
  malicious: "ALERT! ACTION REQUIRED: MALICIOUS TRANSACTION DETECTED!",
};

const NETWORKS: Record<string, string> = {
  camp: "Camp"
};

export interface SlackOptions {
  safeURL: string;
  slackWebhookUrl: string;
}

export class Slack implements INotifier {
  readonly #webhookUrl: string;
  readonly #safeURL: string;

  constructor(opts: SlackOptions) {
    this.#webhookUrl = opts.slackWebhookUrl;
    this.#safeURL = opts.safeURL;
  }

  public async send(event: Event): Promise<void> {
    const msg = this.#getMessage(event);
    await this.#sendToSlack(msg);
  }

  #getMessage(event: Event): string {
    const { type, chainPrefix, safe, tx } = event;
    const link = `<${this.#safeURL}safe=${chainPrefix}:${safe}/&id=multisig_${safe}_${tx.safeTxHash}|🔗 transaction>`;
    const proposer = `*Proposed by:* ${printSigner(tx.proposer)}`;
    let confirmations = tx.confirmations.map(printSigner).join(", ");
    confirmations = `*Signed by:* ${confirmations}`;

    const msg = `${ACTIONS[type]} ${NETWORKS[chainPrefix]} multisig [${tx.confirmations.length}/${tx.confirmationsRequired}] with safeTxHash \`${tx.safeTxHash}\` and nonce \`${tx.nonce}\``;

    const components = [msg, proposer, confirmations, link];

    return components.join("\n\n");
  }

  async #sendToSlack(text: string): Promise<void> {
    if (!this.#webhookUrl) {
      logger.warn("slack webhook not configured");
      return;
    }

    try {
      const response = await fetch(this.#webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        logger.debug("slack sent successfully");
      } else {
        const err = await response.text();
        throw new Error(`${response.statusText}: ${err}`);
      }
    } catch (err) {
      logger.error({ err, text }, "cannot send to slack");
    }
  }
}

function printSigner({ address, name }: Signer): string {
  return name ? `*${name}*` : `\`${address}\``;
}
