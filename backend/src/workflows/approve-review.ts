import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ApproveReviewDto, Review } from "../types/review";
import ReviewModuleService from "../modules/review/service";
import { REVIEW_MODULE } from "../modules/review";
import { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";

export const approveReviewStep = createStep(
  "approve-review-step",
  async function step(input: ApproveReviewDto, { container }) {
    const logger = container.resolve("logger");
    const link = container.resolve("link");
    const ReviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);

    const activityId = logger.activity(`🔵 approveReviewStep: Approving review`);

    // 1. Approve the review
    const updatedReview: Review = await ReviewModuleService.updateReviews({
      id: input.review_id,
      approved_at: new Date(),
    });
    logger.progress(activityId, `🔵 approveReviewStep: Review approved: ${input.review_id}`);

    // 2. Link the review to the user
    const userReviewLink: LinkDefinition = {
      [Modules.USER]: {
        user_id: input.user_id,
      },
      [REVIEW_MODULE]: {
        review_id: input.review_id,
      },
    };
    await link.create(userReviewLink);
    logger.progress(activityId, `🟢 approveReviewStep: Review linked to user: ${input.review_id}`);

    return new StepResponse(updatedReview, input);
  },
  async function rollBack(input: ApproveReviewDto, { container }) {
    const ReviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);
    const link = container.resolve("link");

    await ReviewModuleService.deleteReviews(input.review_id);
    await link.dismiss([
      {
        [Modules.USER]: {
          user_id: input.user_id,
        },
        [REVIEW_MODULE]: {
          review_id: input.review_id,
        },
      },
    ]);
  }
);

export const approveReviewWorkflow = createWorkflow("approve-review", function workflow(input: ApproveReviewDto) {
  const review = approveReviewStep(input);

  return new WorkflowResponse(review);
});
