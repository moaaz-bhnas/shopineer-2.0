import { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ROLE_MODULE } from "../modules/role";

type AssignRoleDto = {
  userId: string;
  roleId: string;
};

function buildLink(userId: string, roleId: string) {
  return {
    [Modules.USER]: {
      user_id: userId,
    },
    [ROLE_MODULE]: {
      role_id: roleId,
    },
  };
}

export const assignRoleStep = createStep(
  "assign-role-step",
  async function assignRoleStep(input: AssignRoleDto, { container }) {
    const logger = container.resolve("logger");
    const link = container.resolve("link");
    const query = container.resolve("query");

    const activityId = logger.activity(`🔵 assignRoleStep: Assigning role: ${input.roleId} to user: ${input.userId}`);

    // 1. Dismiss existing links for the user (if any)
    const { data } = await query.graph({
      entity: "user",
      fields: ["role.*"],
      filters: { id: input.userId },
    });
    const user = data[0];
    if (user?.role) {
      const linkDefinitions: LinkDefinition[] = Array.isArray(user.role)
        ? user.role.map((role) => buildLink(input.userId, role.id))
        : [buildLink(input.userId, user.role.id)];

      await link.dismiss(linkDefinitions);

      logger.progress(activityId, `🔵 assignRoleStep: Dismissed existing links for user: ${input.userId}`);
    }

    // 2. Link the new role to the user
    const linkDefinition: LinkDefinition = buildLink(input.userId, input.roleId);
    await link.create(linkDefinition);

    logger.success(activityId, `🟢 assignRoleStep: Role assigned to user: ${input.userId}`);

    return new StepResponse(linkDefinition, linkDefinition);
  },
  async function rollBack(linkDefinition: LinkDefinition, { container }) {
    const link = container.resolve("link");
    await link.dismiss(linkDefinition);
  }
);

export const assignRoleWorkflow = createWorkflow("assign-role", function workflow(input: AssignRoleDto) {
  const link = assignRoleStep(input);

  return new WorkflowResponse(link);
});
