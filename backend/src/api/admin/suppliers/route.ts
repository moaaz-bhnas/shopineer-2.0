import { MedusaRequest, MedusaResponse } from "@medusajs/framework";
import { createSupplierWorkflow } from "../../../workflows/create-supplier";

type PostAdminCreateSupplierType = {
  name: string;
};

export async function POST(req: MedusaRequest<PostAdminCreateSupplierType>, res: MedusaResponse) {
  const { result: supplier } = await createSupplierWorkflow(req.scope).run({ input: req.validatedBody });

  res.json({ supplier });
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve("query");

  const {
    data: suppliers,
    metadata: { count, take, skip },
  } = await query.graph({
    entity: "supplier",
    // fields: ["*", "products.*"],
    ...req.remoteQueryConfig,
  });

  res.json({ suppliers, count, limit: take, offset: skip });
}
