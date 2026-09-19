export type InvoiceLineItem = {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
  itemType: 'service' | 'part' | 'other'
}

const colors = {
  dark: '#1a1a1a',
  accent: '#ff650a',
  textMain: '#1e293b',
  textMuted: '#64748b',
  border: '#d0d0d0',
  bgLight: '#f7f7f7',
}

const fmt = (n: number) =>
  `LKR ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function renderRowsService(list: any[]) {
  return list.map((item, i) => `
    <tr style="border-bottom: 1px solid ${colors.border}; background: ${i % 2 === 0 ? '#ffffff' : colors.bgLight};">
      <td style="padding: 8px 12px;">${item.description}</td>
      <td style="text-align: right; padding: 8px 12px; font-weight: 700;">${fmt(parseFloat(item.totalPrice))}</td>
    </tr>
  `).join('')
}

function renderRowsParts(list: any[]) {
  return list.map((item, i) => `
    <tr style="border-bottom: 1px solid ${colors.border}; background: ${i % 2 === 0 ? '#ffffff' : colors.bgLight};">
      <td style="padding: 8px 12px;">${item.description}</td>
      <td style="text-align: center; padding: 8px 8px; color: ${colors.textMuted};">${item.quantity}</td>
      <td style="text-align: right; padding: 8px 12px;">${fmt(parseFloat(item.unitPrice))}</td>
      <td style="text-align: right; padding: 8px 12px; font-weight: 700;">${fmt(parseFloat(item.totalPrice))}</td>
    </tr>
  `).join('')
}

const tableHeaderService = (accentColor: string) => `
  <tr style="background: ${accentColor}; color: white;">
    <th style="text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px;">DESCRIPTION</th>
    <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 120px;">SERVICE COST</th>
  </tr>
`

const tableHeaderParts = (accentColor: string) => `
  <tr style="background: ${accentColor}; color: white;">
    <th style="text-align: left; padding: 7px 12px; font-size: 10px; font-weight: 700; letter-spacing: 0.4px;">DESCRIPTION</th>
    <th style="text-align: center; padding: 7px 8px; font-size: 10px; font-weight: 700; width: 60px;">QTY</th>
    <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 110px;">UNIT PRICE</th>
    <th style="text-align: right; padding: 7px 12px; font-size: 10px; font-weight: 700; width: 120px;">TOTAL PRICE</th>
  </tr>
`

export function generateInvoiceHTML(
  invoice: any,
  customers: any[],
  serviceRecords: any[],
  bikes: any[]
): string {
  if (!invoice) {
    return '<p style="color: #64748b; text-align: center; padding: 20px;">No invoice selected.</p>'
  }

  const customer = customers.find((c) => c.id === invoice.customerId)
  const record = serviceRecords.find((r) => r.id === invoice.serviceRecordId)
  const bike = record ? bikes.find((b) => b.registrationNumber === record.registrationNumber) : null

  const itemsSubtotalAmt = parseFloat(invoice.subtotal || 0)
  const serviceFeeAmt = parseFloat(invoice.tax || 0)
  const discountAmt = parseFloat(invoice.discount || 0)
  const grandTotalAmt = parseFloat(invoice.total || 0)

  const rawItems: any[] = invoice.items && invoice.items.length > 0
    ? invoice.items
    : [{ description: record?.description || 'Standard Maintenance Service', quantity: 1, unitPrice: itemsSubtotalAmt, totalPrice: itemsSubtotalAmt, itemType: 'service' }]

  const serviceItems = rawItems.filter((i) => i.itemType === 'service' || i.itemType === 'other' || !i.itemType)
  const partItems = rawItems.filter((i) => i.itemType === 'part')

  const servicesTotal = serviceItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
  const partsTotal = partItems.reduce((sum, i) => sum + parseFloat(i.totalPrice), 0)
  const totalPriceBeforeDiscount = servicesTotal + partsTotal + serviceFeeAmt

  return `
    <div style="width: 210mm; min-height: 297mm; box-sizing: border-box; display: flex; flex-direction: column;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800;900&family=Inter:wght@400;500;600;700&display=swap');
        .thm-invoice * { font-family: 'Inter', Arial, sans-serif; }
        .thm-invoice h1, .thm-invoice .thm-heading { font-family: 'Poppins', Arial, sans-serif; }
      </style>

      <div class="thm-invoice" style="padding: 34px 38px; background: white; color: ${colors.textMain}; flex: 1; display: flex; flex-direction: column;">

        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 22px;">
          <div>
            <h1 style="margin: 0; font-size: 27px; font-weight: 900; color: ${colors.dark}; letter-spacing: -0.3px;">
              THEERTHA <span style="color: ${colors.accent};">MOTORS</span>
            </h1>
            <p style="margin: 3px 0 0 0; font-size: 10.5px; font-weight: 700; color: ${colors.textMuted}; text-transform: uppercase; letter-spacing: 0.6px;">
              Electric Bike Repair &amp; Service
            </p>
            <p style="margin: 8px 0 0 0; font-size: 11.5px; color: ${colors.textMain};">📍 138/1 Aluthgoda, Thissamaharama</p>
            <p style="margin: 1px 0 0 0; font-size: 11.5px; color: ${colors.textMain};">📞 071 243 2063 / 071 438 3144</p>
          </div>

          <div style="text-align: right;">
            <div class="thm-heading" style="display: inline-block; background: ${colors.accent}; color: white; font-size: 21px; font-weight: 800; padding: 8px 26px; letter-spacing: 1.5px; clip-path: polygon(12% 0, 100% 0, 100% 100%, 0% 100%);">
              INVOICE
            </div>
            <p style="margin: 8px 0 0 0; font-size: 11.5px;"><strong>Date:</strong> ${invoice.invoiceDate ? new Date(invoice.invoiceDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '--'}</p>
            <p style="margin: 2px 0 0 0; font-size: 11.5px;"><strong>Invoice #:</strong> ${invoice.invoiceNumber || '--'}</p>
          </div>
        </div>

        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            CUSTOMER &amp; BIKE DETAILS
          </div>
          <div style="display: flex;">
            <div style="width: 50%; border-right: 1.5px solid ${colors.dark};">
              <div style="background: ${colors.accent}; color: white; padding: 4px 12px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;">CUSTOMER DETAILS</div>
              <div style="padding: 10px 12px; font-size: 12px; line-height: 1.85;">
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Name:</span><span>${customer?.name || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Address:</span><span>${customer?.address || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 65px; font-weight: 600;">Phone:</span><span>${customer?.phone || 'N/A'}</span></div>
              </div>
            </div>
            <div style="width: 50%;">
              <div style="background: ${colors.accent}; color: white; padding: 4px 12px; font-size: 9.5px; font-weight: 700; letter-spacing: 0.5px;">BIKE DETAILS</div>
              <div style="padding: 10px 12px; font-size: 12px; line-height: 1.85;">
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Brand/Model:</span><span>${bike?.brand || 'N/A'} ${bike?.model || ''}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Year:</span><span>${bike?.year || 'N/A'}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Registration No:</span><span>${bike?.registrationNumber || record?.registrationNumber || '--'}</span></div>
                <div style="display: flex;"><span style="width: 110px; font-weight: 600;">Mileage:</span><span>${record?.milageOnService || 'N/A'} km</span></div>
              </div>
            </div>
          </div>
        </div>

        ${serviceItems.length > 0 ? `
        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 10px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            SERVICES PERFORMED
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>${tableHeaderService(colors.accent)}</thead>
            <tbody>${renderRowsService(serviceItems)}</tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; padding: 7px 12px; font-size: 12px; background: ${colors.bgLight}; border-top: 1px solid ${colors.border};">
            <span style="font-weight: 700;">Services Cost: ${fmt(servicesTotal)}</span>
          </div>
        </div>` : ''}

        ${partItems.length > 0 ? `
        <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 14px;">
          <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
            PARTS USED
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>${tableHeaderParts('#555555')}</thead>
            <tbody>${renderRowsParts(partItems)}</tbody>
          </table>
          <div style="display: flex; justify-content: flex-end; padding: 7px 12px; font-size: 12px; background: ${colors.bgLight}; border-top: 1px solid ${colors.border};">
            <span style="font-weight: 700;">Parts Cost: ${fmt(partsTotal)}</span>
          </div>
        </div>` : ''}

        <div style="display: flex; justify-content: flex-end; margin-bottom: 22px;">
          <div style="width: 270px; font-size: 12px; border: 1px solid ${colors.border}; border-radius: 6px; overflow: hidden;">
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid ${colors.border};">
              <span style="color: ${colors.textMuted};">Total Price</span>
              <span style="font-weight: 700;">${fmt(totalPriceBeforeDiscount)}</span>
            </div>
            ${discountAmt > 0 ? `
            <div style="display: flex; justify-content: space-between; padding: 7px 12px; border-bottom: 1px solid ${colors.border}; color: #b91c1c;">
              <span>Discount</span>
              <span style="font-weight: 700;">− ${fmt(discountAmt)}</span>
            </div>` : ''}
            <div class="thm-heading" style="display: flex; justify-content: space-between; background: ${colors.accent}; color: white; padding: 9px 12px; font-weight: 800; font-size: 13px;">
              <span>Total Due</span>
              <span>${fmt(grandTotalAmt)}</span>
            </div>
          </div>
        </div>

        <div style="margin-top: auto;">
          <div style="border: 1.5px solid ${colors.dark}; border-radius: 6px; overflow: hidden; margin-bottom: 16px;">
            <div class="thm-heading" style="background: ${colors.dark}; color: white; padding: 6px 12px; font-size: 11.5px; font-weight: 700; letter-spacing: 0.5px;">
              OWNER &amp; TECHNICIAN AUTHORIZATION
            </div>
            <div style="display: flex;">
              <div style="width: 50%; border-right: 1.5px solid ${colors.dark}; padding: 12px; font-size: 12px; line-height: 2.3;">
                <p style="margin: 0; font-weight: 700;">BIKE OWNER</p>
                <p style="margin: 0;">Name: ${customer?.name || ''}</p>
                <p style="margin: 0;">Signature: ______________________</p>
                <p style="margin: 0;">Date: ______________</p>
              </div>
              <div style="width: 50%; padding: 12px; font-size: 12px; line-height: 2.3;">
                <p style="margin: 0; font-weight: 700;">TECHNICIAN</p>
                <p style="margin: 0;">Name: ${record?.technician || ''}</p>
                <p style="margin: 0;">Signature: ______________________</p>
                <p style="margin: 0;">Date: ______________</p>
              </div>
            </div>
          </div>

          <p class="thm-heading" style="text-align: center; margin: 0; font-size: 16px; font-weight: 800; font-style: italic; color: ${colors.dark};">
            DRIVE SAFE &amp; <span style="color: ${colors.accent};">ENJOY THE RIDE!</span>
          </p>
        </div>

      </div>
    </div>
  `
}