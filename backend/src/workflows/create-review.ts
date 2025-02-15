import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ReviewDto } from "../types/review";
import ReviewModuleService from "../modules/review/service";
import { REVIEW_MODULE } from "../modules/review";
import { omit } from "lodash";
import { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export const createReviewStep = createStep(
  "create-review-step",
  async function createReviewStep(input: ReviewDto, { container }) {
    const logger = container.resolve("logger");
    const link = container.resolve("link");
    const ReviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);

    const activityId = logger.activity(`🔵 createReviewStep: Creating review`);

    //  1. Create the review
    const review = await ReviewModuleService.createReviews(omit(input, ["customer_id", "product_id"]));
    logger.progress(activityId, `🔵 createReviewStep: Review created: ${review.id}`);

    // 2. Link the review to the customer
    const customerReviewLink: LinkDefinition = {
      [Modules.CUSTOMER]: {
        customer_id: input.customer_id,
      },
      [REVIEW_MODULE]: {
        review_id: review.id,
      },
    };
    await link.create(customerReviewLink);
    logger.progress(activityId, `🔵 createReviewStep: Review linked to customer: ${review.id}`);

    // 3. Link the review to the product
    const productReviewLink: LinkDefinition = {
      [Modules.PRODUCT]: {
        product_id: input.product_id,
      },
      [REVIEW_MODULE]: {
        review_id: review.id,
      },
    };
    await link.create(productReviewLink);
    logger.success(activityId, `🟢 createReviewStep: Review linked to product: ${review.id}`);

    return new StepResponse(review, { ...input, id: review.id });
  },

  async function rollBack(input: ReviewDto & { id: string }, { container }) {
    const ReviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);
    const link = container.resolve("link");

    await ReviewModuleService.deleteReviews(input.id);
    await link.dismiss([
      {
        [Modules.CUSTOMER]: {
          customer_id: input.customer_id,
        },
        [REVIEW_MODULE]: {
          review_id: input.id,
        },
      },
      {
        [Modules.PRODUCT]: {
          product_id: input.product_id,
        },
        [REVIEW_MODULE]: {
          review_id: input.id,
        },
      },
    ]);
  }
);

export const createReviewWorkflow = createWorkflow("create-review", function createReviewWorkflow(input: ReviewDto) {
  const review = createReviewStep(input);

  return new WorkflowResponse(review);
});
