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
import type * as admin_d from "../admin/d.js";
import type * as admin_m from "../admin/m.js";
import type * as admin_q from "../admin/q.js";
import type * as affiliateAccounts_d from "../affiliateAccounts/d.js";
import type * as affiliateAccounts_m from "../affiliateAccounts/m.js";
import type * as affiliateAccounts_q from "../affiliateAccounts/q.js";
import type * as blogs_d from "../blogs/d.js";
import type * as blogs_m from "../blogs/m.js";
import type * as blogs_q from "../blogs/q.js";
import type * as cart_d from "../cart/d.js";
import type * as cart_m from "../cart/m.js";
import type * as cart_q from "../cart/q.js";
import type * as categories_d from "../categories/d.js";
import type * as categories_m from "../categories/m.js";
import type * as categories_q from "../categories/q.js";
import type * as checkoutLogs_d from "../checkoutLogs/d.js";
import type * as checkoutLogs_m from "../checkoutLogs/m.js";
import type * as checkoutLogs_q from "../checkoutLogs/q.js";
import type * as couriers_d from "../couriers/d.js";
import type * as couriers_m from "../couriers/m.js";
import type * as couriers_q from "../couriers/q.js";
import type * as crons from "../crons.js";
import type * as emailSettings_d from "../emailSettings/d.js";
import type * as emailSettings_m from "../emailSettings/m.js";
import type * as emailSettings_q from "../emailSettings/q.js";
import type * as init from "../init.js";
import type * as logs_d from "../logs/d.js";
import type * as logs_m from "../logs/m.js";
import type * as logs_q from "../logs/q.js";
import type * as orders_cashapp from "../orders/cashapp.js";
import type * as orders_d from "../orders/d.js";
import type * as orders_m from "../orders/m.js";
import type * as orders_paygate from "../orders/paygate.js";
import type * as orders_q from "../orders/q.js";
import type * as paygateAccounts_a from "../paygateAccounts/a.js";
import type * as paygateAccounts_d from "../paygateAccounts/d.js";
import type * as paygateAccounts_m from "../paygateAccounts/m.js";
import type * as paygateAccounts_q from "../paygateAccounts/q.js";
import type * as productHolds_d from "../productHolds/d.js";
import type * as productHolds_m from "../productHolds/m.js";
import type * as productHolds_q from "../productHolds/q.js";
import type * as products_d from "../products/d.js";
import type * as products_m from "../products/m.js";
import type * as products_q from "../products/q.js";
import type * as rewards_d from "../rewards/d.js";
import type * as rewards_m from "../rewards/m.js";
import type * as rewards_q from "../rewards/q.js";
import type * as rewards_utils from "../rewards/utils.js";
import type * as staff_d from "../staff/d.js";
import type * as staff_m from "../staff/m.js";
import type * as staff_q from "../staff/q.js";
import type * as uploads from "../uploads.js";
import type * as users_d from "../users/d.js";
import type * as users_m from "../users/m.js";
import type * as users_q from "../users/q.js";
import type * as utils_id_validation from "../utils/id_validation.js";

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
  "admin/d": typeof admin_d;
  "admin/m": typeof admin_m;
  "admin/q": typeof admin_q;
  "affiliateAccounts/d": typeof affiliateAccounts_d;
  "affiliateAccounts/m": typeof affiliateAccounts_m;
  "affiliateAccounts/q": typeof affiliateAccounts_q;
  "blogs/d": typeof blogs_d;
  "blogs/m": typeof blogs_m;
  "blogs/q": typeof blogs_q;
  "cart/d": typeof cart_d;
  "cart/m": typeof cart_m;
  "cart/q": typeof cart_q;
  "categories/d": typeof categories_d;
  "categories/m": typeof categories_m;
  "categories/q": typeof categories_q;
  "checkoutLogs/d": typeof checkoutLogs_d;
  "checkoutLogs/m": typeof checkoutLogs_m;
  "checkoutLogs/q": typeof checkoutLogs_q;
  "couriers/d": typeof couriers_d;
  "couriers/m": typeof couriers_m;
  "couriers/q": typeof couriers_q;
  crons: typeof crons;
  "emailSettings/d": typeof emailSettings_d;
  "emailSettings/m": typeof emailSettings_m;
  "emailSettings/q": typeof emailSettings_q;
  init: typeof init;
  "logs/d": typeof logs_d;
  "logs/m": typeof logs_m;
  "logs/q": typeof logs_q;
  "orders/cashapp": typeof orders_cashapp;
  "orders/d": typeof orders_d;
  "orders/m": typeof orders_m;
  "orders/paygate": typeof orders_paygate;
  "orders/q": typeof orders_q;
  "paygateAccounts/a": typeof paygateAccounts_a;
  "paygateAccounts/d": typeof paygateAccounts_d;
  "paygateAccounts/m": typeof paygateAccounts_m;
  "paygateAccounts/q": typeof paygateAccounts_q;
  "productHolds/d": typeof productHolds_d;
  "productHolds/m": typeof productHolds_m;
  "productHolds/q": typeof productHolds_q;
  "products/d": typeof products_d;
  "products/m": typeof products_m;
  "products/q": typeof products_q;
  "rewards/d": typeof rewards_d;
  "rewards/m": typeof rewards_m;
  "rewards/q": typeof rewards_q;
  "rewards/utils": typeof rewards_utils;
  "staff/d": typeof staff_d;
  "staff/m": typeof staff_m;
  "staff/q": typeof staff_q;
  uploads: typeof uploads;
  "users/d": typeof users_d;
  "users/m": typeof users_m;
  "users/q": typeof users_q;
  "utils/id_validation": typeof utils_id_validation;
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
