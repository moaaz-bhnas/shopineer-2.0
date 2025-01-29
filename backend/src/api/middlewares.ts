import {
  defineMiddlewares,
  MedusaNextFunction,
  MedusaRequest,
  MedusaResponse,
  validateAndTransformBody,
  validateAndTransformQuery,
} from "@medusajs/framework/http";
import { PostAdminCreateSupplier } from "./admin/suppliers/validators";
import z from "zod";
import { createFindParams } from "@medusajs/medusa/api/utils/validators";
import { PostAdminCreateBrand } from "./admin/brands/validators";
import { MedusaError } from "@medusajs/framework/utils";
import { HttpStatusCode } from "axios";
import { Permission } from "src/modules/role/models/role";

const GetSuppliersSchema = createFindParams();

export const permissions = async (req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) => {
  const query = req.scope.resolve("query");

  const userId = req.session?.auth_context?.actor_id;
  const {
    data: [user],
  } = await query.graph({
    entity: "user",
    fields: ["*", "role.*"],
    filters: {
      id: [userId],
    },
  });

  const isSuperAdmin = !user?.role;
  if (isSuperAdmin) {
    next();
    return;
  }

  const rolePermissions = user.role.permissions as unknown as Permission[];
  const isAllowed = rolePermissions.some(matchPathAndMethod(req));
  if (isAllowed) {
    next();
    return;
  }

  // deny access
  next(new MedusaError(MedusaError.Types.UNAUTHORIZED, `You are not authorized to access ${req.baseUrl}.`));

  function matchPathAndMethod(req: MedusaRequest) {
    const path = req.baseUrl.replace(/\/admin/, "");

    return function match(permission: Permission) {
      const result = new RegExp(permission.path).test(path) && permission.method === req.method;

      return result;
    };
  }
};

export default defineMiddlewares({
  routes: [
    {
      matcher: "/admin/*",
      middlewares: [permissions],
    },
    {
      matcher: "/admin/products",
      method: "GET",
    },
    {
      matcher: "/admin/products",
      method: "POST",
      additionalDataValidator: {
        supplier_id: z.string().optional() as any,
        brand_id: z.string().optional() as any,
      },
    },
    {
      matcher: "/admin/suppliers",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateSupplier as any)],
    },
    {
      matcher: "/admin/suppliers/:id",
      method: "PUT",
      middlewares: [validateAndTransformBody(PostAdminCreateSupplier as any)],
    },
    {
      matcher: "/admin/suppliers",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetSuppliersSchema, {
          defaults: ["id", "name", "contact_person", "email", "phone", "products.*"],
          isList: true,
        }),
      ],
    },
    {
      matcher: "/admin/brands",
      method: "POST",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand as any)],
    },
    {
      matcher: "/admin/brands/:id",
      method: "PUT",
      middlewares: [validateAndTransformBody(PostAdminCreateBrand as any)],
    },
    {
      matcher: "/admin/brands",
      method: "GET",
      middlewares: [
        validateAndTransformQuery(GetSuppliersSchema, {
          defaults: ["id", "name", "description", "image", "products.*"],
          isList: true,
        }),
      ],
    },
  ],
  errorHandler(error: MedusaError | any, req: MedusaRequest, res: MedusaResponse, next: MedusaNextFunction) {
    if (error.type === MedusaError.Types.UNAUTHORIZED) {
      res.status(HttpStatusCode.Ok).json({
        error: error.message,
        timestamp: new Date().toISOString(),
        path: req.baseUrl,
      });
    } else {
      next(error);
    }
  },
});
