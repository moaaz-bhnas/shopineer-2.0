import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import * as adsSdk from "facebook-nodejs-ads-sdk";

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  console.log("🫣🫣", adsSdk);

  res.json({});
};
