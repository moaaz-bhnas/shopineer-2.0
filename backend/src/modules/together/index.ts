import { Module } from "@medusajs/framework/utils";
import TogetherModuleService from "./service";

export const TOGETHER_MODULE = "together";

const TogetherModule = Module(TOGETHER_MODULE, {
  service: TogetherModuleService,
});

export default TogetherModule;
