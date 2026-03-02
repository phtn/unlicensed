import {Infer, v} from 'convex/values'

export const productImportErrorSchema = v.object({
  rowIndex: v.number(),
  slug: v.optional(v.string()),
  message: v.string(),
})

export const productImportSchema = v.object({
  title: v.string(),
  uploadedBy: v.string(),
  createdAt: v.number(),
  rowCount: v.number(),
  successCount: v.number(),
  errorCount: v.number(),
  errors: v.optional(v.array(productImportErrorSchema)),
})

export type ProductImport = Infer<typeof productImportSchema>
