import fp from "lodash/fp";
import crypto from "crypto";
import axios from "axios";
import { BACKEND_URL } from "../../lib/constants";
import {
  AuthorizePaymentInput,
  AuthorizePaymentOutput,
  CancelPaymentInput,
  CancelPaymentOutput,
  CapturePaymentInput,
  CapturePaymentOutput,
  CartDTO,
  CartLineItemDTO,
  DeletePaymentInput,
  DeletePaymentOutput,
  GetPaymentStatusInput,
  GetPaymentStatusOutput,
  InitiatePaymentInput,
  InitiatePaymentOutput,
  Logger,
  ProviderWebhookPayload,
  RefundPaymentInput,
  RefundPaymentOutput,
  RetrievePaymentInput,
  RetrievePaymentOutput,
  UpdatePaymentInput,
  UpdatePaymentOutput,
  WebhookActionResult,
} from "@medusajs/framework/types";
import { AbstractPaymentProvider, BigNumber, MedusaError, PaymentSessionStatus } from "@medusajs/framework/utils";

type ChargeItem = {
  itemId: string;
  description: string;
  price: number;
  quantity: number;
  imageUrl: string;
};

interface ChargeRequest {
  merchantCode: string;
  merchantRefNum: string;
  customerMobile: string;
  customerEmail: string;
  customerName: string;
  customerProfileId: string;
  language: "en-gb" | "ar-eg";
  chargeItems: ChargeItem[];
  returnUrl: string;
  orderWebHookUrl?: string;
  authCaptureModePayment: boolean;
  signature: string;
}

interface WebhookPayload {
  requestId: string;
  fawryRefNumber: string;
  merchantRefNumber: string;
  customerName?: string;
  customerMail: string;
  paymentAmount: number;
  orderAmount: number;
  fawryFees: number;
  orderStatus: "NEW" | "PAID" | "CANCELLED" | "REFUNDED" | "EXPIRED" | "PARTIAL_REFUNDED" | "FAILD";
  failureReason?: string;
}

type Options = {
  merchantCode: string;
  securityCode: string;
  baseUrl: string;
  returnUrl: string;
};

type InjectedDependencies = {
  logger: Logger;
};

export default class FawryProviderService extends AbstractPaymentProvider<Options> {
  static identifier = "fawry";
  protected logger_: Logger;
  protected options_: Options;
  // assuming you're initializing a client
  protected client;

  constructor(container: InjectedDependencies, options: Options) {
    super(container, options);

    this.options_ = options;
    this.logger_ = container.logger;
  }

  static validateOptions(options: Record<any, any>) {
    const requiredFields = ["merchantCode", "securityCode", "baseUrl", "returnUrl"];

    for (const field of requiredFields) {
      if (!options[field]) {
        throw new MedusaError(MedusaError.Types.INVALID_DATA, `${field} is required in the provider's options`);
      }
    }
  }

  private generateSignature(sessionId: string, cart: CartDTO, totalPrice: number): string {
    const merchantRefNum = sessionId;
    const customerProfileId = cart.customer_id;
    const itemsDetails = fp.flow(
      this.getCheckoutItems(totalPrice),
      fp.map((item) => `${item.itemId}${item.quantity}${Number(item.price).toFixed(2)}`),
      fp.join("")
    )(cart);
    const { returnUrl, merchantCode, securityCode } = this.options_;

    const dataToHash = `${merchantCode}${merchantRefNum}${customerProfileId}${returnUrl}${itemsDetails}${securityCode}`;

    const signature = crypto.createHash("sha256").update(dataToHash).digest("hex");

    return signature;
  }

  private getCheckoutItems = fp.curry(function getCheckoutItems(totalPrice: number, cart: CartDTO): ChargeItem[] {
    const addDiscountItem = fp.curry(function addDiscountItem(cart: CartDTO, lineItems: ChargeItem[]) {
      lineItems = fp.cloneDeep(lineItems);
      if (Number(cart.discount_total) > 0) {
        lineItems.push({
          itemId: "discount",
          description: "Discount",
          price: -Number(cart.discount_total),
          quantity: 1,
          imageUrl: "",
        });
      }
      return lineItems;
    });

    const addShipingItem = fp.curry(function addDiscountItem(cart: CartDTO, lineItems: ChargeItem[]) {
      lineItems = fp.cloneDeep(lineItems);
      if (Number(cart.shipping_total) > 0) {
        lineItems.push({
          itemId: "shipping",
          description: "Shipping",
          price: Number(cart.shipping_total),
          quantity: 1,
          imageUrl: "",
        });
      }
      return lineItems;
    });

    /**
     * Add amount difference item to cart if amount difference is greater than 0
     */
    const addAmountDifferenceItem = fp.curry(function addAmountDifferenceItem(
      totalPrice: number,
      lineItems: ChargeItem[]
    ) {
      lineItems = fp.cloneDeep(lineItems);
      const lineItemsTotal = fp.sumBy<ChargeItem>("price", lineItems);
      const amountDifference = Number(lineItemsTotal) - Number(totalPrice);

      if (amountDifference > 0) {
        lineItems.push({
          itemId: "amount_difference",
          description: "Amount Difference",
          price: amountDifference,
          quantity: 1,
          imageUrl: "",
        });
      }
      return lineItems;
    });

    function mapCartItemToChargeItem(item: CartLineItemDTO): ChargeItem {
      return {
        itemId: item.id,
        description: item.title,
        price: Number(item.unit_price),
        quantity: Number(item.quantity),
        imageUrl: item.thumbnail,
      };
    }

    const result = fp.flow(
      fp.map(mapCartItemToChargeItem),
      addDiscountItem(cart),
      addShipingItem(cart),
      addAmountDifferenceItem(totalPrice),
      fp.sortBy<ChargeItem>("itemId")
    )(cart.items);

    return result;
  });

  private buildCheckoutRequest(sessionId: string, cart: CartDTO, totalPrice: number): ChargeRequest {
    const { merchantCode, returnUrl } = this.options_;
    const request: ChargeRequest = {
      merchantCode,
      merchantRefNum: sessionId,
      customerMobile: cart.shipping_address.phone,
      customerEmail: cart.email,
      customerName: cart.shipping_address.first_name + " " + cart.shipping_address.last_name,
      customerProfileId: cart.customer_id,
      language: "ar-eg",
      chargeItems: this.getCheckoutItems(totalPrice, cart),
      returnUrl,
      orderWebHookUrl: `${BACKEND_URL}/hooks/payment/${FawryProviderService.identifier}_fawry`,
      authCaptureModePayment: false,
      signature: this.generateSignature(sessionId, cart, totalPrice),
    };

    return request;
  }

  private generateRefundObject(referenceNumber: string, refundAmount: number) {
    const { merchantCode, securityCode } = this.options_;
    const dataToHash = `${merchantCode}${referenceNumber}${refundAmount.toFixed(2)}${securityCode}`;

    const signature = crypto.createHash("sha256").update(dataToHash).digest("hex");

    return signature;
  }

  async initiatePayment(input: InitiatePaymentInput): Promise<InitiatePaymentOutput> {
    const { amount, data } = input;

    const activityId = this.logger_.activity(
      `⚡🔵 Fawry (initiatePayment): Initiating a payment for cart: ${(data.cart as CartDTO).id}`
    );
    const checkoutRequest = this.buildCheckoutRequest(data.session_id as string, data.cart as CartDTO, Number(amount));

    try {
      const response = await axios.post(`${this.options_.baseUrl}/fawrypay-api/api/payments/init`, checkoutRequest, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.logger_.success(
        activityId,
        `⚡🟢 Fawry (initiatePayment): Successfully created checkout URL: ${response.data} for cart: ${
          (data.cart as CartDTO).id
        }`
      );

      return { id: (data.cart as CartDTO).id.toString(), data: { checkoutUrl: response.data } };
    } catch (error) {
      this.logger_.failure(
        activityId,
        `⚡🔴 Fawry (initiatePayment): Failed to create checkout URL for cart: ${
          (data.cart as CartDTO).id
        } with error: ${error.message}`
      );

      throw new Error(error.message);
    }
  }

  // async authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
  //   console.log("🤓🤓 authorizePayment", input);

  //   return {
  //     data: input.data,
  //     status: PaymentSessionStatus.CAPTURED,
  //   };
  // }

  capturePayment(input: CapturePaymentInput): Promise<CapturePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  authorizePayment(input: AuthorizePaymentInput): Promise<AuthorizePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  cancelPayment(input: CancelPaymentInput): Promise<CancelPaymentOutput> {
    throw new Error("Method not implemented.");
  }
  deletePayment(input: DeletePaymentInput): Promise<DeletePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  getPaymentStatus(input: GetPaymentStatusInput): Promise<GetPaymentStatusOutput> {
    throw new Error("Method not implemented.");
  }
  refundPayment(input: RefundPaymentInput): Promise<RefundPaymentOutput> {
    throw new Error("Method not implemented.");
  }
  retrievePayment(input: RetrievePaymentInput): Promise<RetrievePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  updatePayment(input: UpdatePaymentInput): Promise<UpdatePaymentOutput> {
    throw new Error("Method not implemented.");
  }
  getWebhookActionAndData(data: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
    throw new Error("Method not implemented.");
  }

  // async getWebhookActionAndData(payload: ProviderWebhookPayload["payload"]): Promise<WebhookActionResult> {
  //   const activityId = this.logger_.activity(
  //     `⚡🔵 Fawry (webhook): triggered with payload: ${JSON.stringify(payload)}`
  //   );

  //   const data = payload.data as unknown as WebhookPayload;

  //   switch (data.orderStatus) {
  //     case "NEW":
  //       return {
  //         action: "authorized",
  //         data: {
  //           session_id: data.merchantRefNumber,
  //           amount: new BigNumber(data.paymentAmount as number),
  //         },
  //       };
  //     case "PAID":
  //       return {
  //         action: "captured",
  //         data: {
  //           session_id: data.merchantRefNumber,
  //           amount: new BigNumber(data.paymentAmount as number),
  //         },
  //       };
  //     case "FAILD":
  //     case "EXPIRED":
  //       return {
  //         action: "failed",
  //         data: {
  //           session_id: data.merchantRefNumber,
  //           amount: new BigNumber(data.paymentAmount as number),
  //         },
  //       };
  //     default:
  //       return {
  //         action: "not_supported",
  //       };
  //   }
  // }

  // async refundPayment(
  //   paymentData: Record<string, unknown>,
  //   refundAmount: number
  // ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
  //   const activityId = this.logger_.activity(
  //     `⚡🔵 Fawry (refundPayment): Initiating a refund for payment: ${paymentData.checkoutUrl}`
  //   );
  //   console.log("🤯", paymentData, refundAmount);

  //   try {
  //     const response = await axios.post(
  //       `${this.options_.baseUrl}/ECommerceWeb/Fawry/payments/refund`,
  //       this.generateRefundObject("", refundAmount),
  //       { headers: { "Content-Type": "application/json" } }
  //     );

  //     this.logger_.success(
  //       activityId,
  //       `⚡🟢 Fawry (refundPayment): Successfully created a refund for payment ${paymentData.checkoutUrl} with amount: ${refundAmount}`
  //     );

  //     return { data: { ...response.data } };
  //   } catch (error) {
  //     this.logger_.failure(
  //       activityId,
  //       `⚡🔴 Fawry (refundPayment): Failed to refund payment: ${paymentData.checkoutUrl} with error: ${error.message}`
  //     );

  //     return {
  //       error: error.message,
  //       code: "unknown",
  //       detail: error,
  //     };
  //   }
  // }

  // cancelPayment(
  //   paymentData: Record<string, unknown>
  // ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
  //   throw new Error("Method not implemented.");
  // }

  // deletePayment(
  //   paymentSessionData: Record<string, unknown>
  // ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
  //   throw new Error("Method not implemented.");
  // }
  // getPaymentStatus(paymentSessionData: Record<string, unknown>): Promise<PaymentSessionStatus> {
  //   throw new Error("Method not implemented.");
  // }
  // retrievePayment(
  //   paymentSessionData: Record<string, unknown>
  // ): Promise<PaymentProviderError | PaymentProviderSessionResponse["data"]> {
  //   throw new Error("Method not implemented.");
  // }
  // updatePayment(context: UpdatePaymentProviderSession): Promise<PaymentProviderError | PaymentProviderSessionResponse> {
  //   throw new Error("Method not implemented.");
  // }
}
