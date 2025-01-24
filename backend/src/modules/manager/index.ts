import { Module } from "@medusajs/framework/utils";
import ManagerModuleService from "./service";

export const MANAGER_MODULE = "manager";

const ManagerModule = Module(MANAGER_MODULE, {
  service: ManagerModuleService,
});

export default ManagerModule;
