/**
 * Admin Navbar Slot - Override
 * 
 * This parallel route slot overrides the root-level @navbar slot for admin routes.
 * By returning null, we prevent the main navbar from appearing in the admin section.
 * 
 * Next.js parallel routes allow child route groups to override parent route slots.
 * Since admin routes are nested under the root layout, this slot takes precedence
 * over the root @navbar slot for all routes under /admin.
 */
export default function AdminNavbarSlot() {
  return null
}

