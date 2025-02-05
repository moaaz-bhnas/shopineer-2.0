import { MedusaService } from "@medusajs/framework/utils";
import { BoughtTogether } from "./models/together";

class TogetherModuleService extends MedusaService({ BoughtTogether }) {}

export default TogetherModuleService;
