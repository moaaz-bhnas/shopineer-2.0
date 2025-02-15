import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ResponseDto } from "../types/review";
import ReviewModuleService from "../modules/review/service";
import { REVIEW_MODULE } from "../modules/review";
import { Modules } from "@medusajs/framework/utils";
import { LinkDefinition } from "@medusajs/framework/types";

export const createResopnseStep = createStep(
  "create-response-step",
  async function step(input: ResponseDto, { container }) {
    try {
      const logger = container.resolve("logger");
      const link = container.resolve("link");
      const reviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);

      const activityId = logger.activity(`🔵 createResponseStep: Creating response`);

      // 1. Create the response
      const response = await reviewModuleService.createResponses({
        review_id: input.review_id,
        text: input.text,
      });
      logger.success(activityId, `🔵 createResponseStep: Response created: ${response.id}`);

      // 2. Link the response to the user
      const userResponseLink: LinkDefinition = {
        [Modules.USER]: {
          user_id: input.user_id,
        },
        [REVIEW_MODULE]: {
          response_id: response.id,
        },
      };
      await link.create(userResponseLink);
      logger.progress(activityId, `🔵 createResponseStep: Response linked to user: ${response.id}`);

      return new StepResponse(response, response.id);
    } catch (error) {
      return StepResponse.permanentFailure(error.message);
    }
  },
  async function rollBack(id: string, { container }) {
    const reviewModuleService: ReviewModuleService = container.resolve(REVIEW_MODULE);

    await reviewModuleService.deleteResponses(id);
  }
);

export const createResponseWorkflow = createWorkflow("create-response", function workflow(input: ResponseDto) {
  const response = createResopnseStep(input);

  return new WorkflowResponse(response);
});
