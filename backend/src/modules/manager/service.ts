import { MedusaService } from "@medusajs/framework/utils";
import { Manager } from "./models/manager";

class ManagerModuleService extends MedusaService({
  Manager,
}) {}

export default ManagerModuleService;
