/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as categories_d from "../categories/d.js";
import type * as categories_m from "../categories/m.js";
import type * as categories_q from "../categories/q.js";
import type * as init from "../init.js";
import type * as products_d from "../products/d.js";
import type * as products_m from "../products/m.js";
import type * as products_q from "../products/q.js";
import type * as uploads from "../uploads.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "categories/d": typeof categories_d;
  "categories/m": typeof categories_m;
  "categories/q": typeof categories_q;
  init: typeof init;
  "products/d": typeof products_d;
  "products/m": typeof products_m;
  "products/q": typeof products_q;
  uploads: typeof uploads;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
