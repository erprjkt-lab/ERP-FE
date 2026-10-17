import type { FormInstance } from 'antd'
import { useHsnCodes } from './useHsnCodes'

/** HSN is the tax master, so picking one on an item form fills its GST % —
 *  wire the returned handler to the form's `onValuesChange`. */
export function useHsnGstAutofill(form: FormInstance) {
  // A picker needs every code, not a page of them: a code missing from the list
  // can't be selected, and the GST % it would have filled in never arrives.
  // ponytail: one big page, because ERP-BE has no "list all" for hsn-codes.
  // Switch to fetching until meta.last_page if the master ever outgrows this.
  const { data: hsnCodes = [] } = useHsnCodes(1, 1000)

  return {
    hsnCodeOptions: hsnCodes.map(h => ({ label: `${h.hsn} (${h.gstRate}%)`, value: h.hsn })),
    onValuesChange: (changed: Record<string, unknown>) => {
      if (!('hsnCode' in changed)) return
      form.setFieldValue('gstPercent', hsnCodes.find(h => h.hsn === changed.hsnCode)?.gstRate)
    },
  }
}
