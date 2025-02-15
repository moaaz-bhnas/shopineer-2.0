import { LinkDefinition } from "@medusajs/framework/types";
import { Modules } from "@medusajs/framework/utils";
import { createStep, createWorkflow, StepResponse, WorkflowResponse } from "@medusajs/framework/workflows-sdk";
import { ROLE_MODULE } from "../modules/role";
import { Permission, PermissionType } from "../modules/role/models/role";
import RoleModuleService from "../modules/role/service";
import { uniqBy } from "lodash";

type RoleDto = {
  name: string;
  store_id: string;
  permissions?: Permission[];
};

const REQUIRED_PERMISSIONS: Permission[] = [
  {
    name: "users",
    path: "^/users.*",
    method: PermissionType.GET,
  },
  {
    name: "stores",
    path: "^/stores.*",
    method: PermissionType.GET,
  },
];

function uniqPermissions(permissions: Permission[]) {
  return uniqBy(permissions, (permission) => permission.name + permission.method);
}

export const createRoleStep = createStep(
  "create-role-step",
  async function createRoleStep(input: RoleDto, { container }) {
    const logger = container.resolve("logger");
    const roleModuleService: RoleModuleService = container.resolve(ROLE_MODULE);
    const link = container.resolve("link");

    const permissions = uniqPermissions([...REQUIRED_PERMISSIONS, ...(input.permissions || [])]);

    const activityId = logger.activity(`🔵 createRoleStep: Creating role: ${input.name}`);

    // 1. Create the role
    const role = await roleModuleService.createRoles({ ...input, permissions: permissions as any });
    logger.success(activityId, `🔵 createRoleStep: Role created: ${input.name}`);

    // 2. Link the role to the store
    const links: LinkDefinition = {
      [Modules.STORE]: {
        store_id: input.store_id,
      },
      [ROLE_MODULE]: {
        role_id: role.id,
      },
    };
    await link.create(links);

    logger.success(activityId, `🟢 createRoleStep: Role linked to store: ${input.name}`);

    return new StepResponse(role, role.id);
  }
);

export const createRoleWorkflow = createWorkflow("create-role", function createRoleWorkflow(input: RoleDto) {
  const role = createRoleStep(input);

  return new WorkflowResponse(role);
});
