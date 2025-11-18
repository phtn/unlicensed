/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activities_d from "../activities/d.js";
import type * as activities_m from "../activities/m.js";
import type * as activities_q from "../activities/q.js";
import type * as activityViews_d from "../activityViews/d.js";
import type * as activityViews_m from "../activityViews/m.js";
import type * as activityViews_q from "../activityViews/q.js";
import type * as cart_d from "../cart/d.js";
import type * as cart_m from "../cart/m.js";
import type * as cart_q from "../cart/q.js";
import type * as categories_d from "../categories/d.js";
import type * as categories_m from "../categories/m.js";
import type * as categories_q from "../categories/q.js";
import type * as init from "../init.js";
import type * as orders_d from "../orders/d.js";
import type * as orders_m from "../orders/m.js";
import type * as orders_q from "../orders/q.js";
import type * as products_d from "../products/d.js";
import type * as products_m from "../products/m.js";
import type * as products_q from "../products/q.js";
import type * as rewards_d from "../rewards/d.js";
import type * as rewards_m from "../rewards/m.js";
import type * as rewards_q from "../rewards/q.js";
import type * as uploads from "../uploads.js";
import type * as users_d from "../users/d.js";
import type * as users_m from "../users/m.js";
import type * as users_q from "../users/q.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "activities/d": typeof activities_d;
  "activities/m": typeof activities_m;
  "activities/q": typeof activities_q;
  "activityViews/d": typeof activityViews_d;
  "activityViews/m": typeof activityViews_m;
  "activityViews/q": typeof activityViews_q;
  "cart/d": typeof cart_d;
  "cart/m": typeof cart_m;
  "cart/q": typeof cart_q;
  "categories/d": typeof categories_d;
  "categories/m": typeof categories_m;
  "categories/q": typeof categories_q;
  init: typeof init;
  "orders/d": typeof orders_d;
  "orders/m": typeof orders_m;
  "orders/q": typeof orders_q;
  "products/d": typeof products_d;
  "products/m": typeof products_m;
  "products/q": typeof products_q;
  "rewards/d": typeof rewards_d;
  "rewards/m": typeof rewards_m;
  "rewards/q": typeof rewards_q;
  uploads: typeof uploads;
  "users/d": typeof users_d;
  "users/m": typeof users_m;
  "users/q": typeof users_q;
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
