import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import { generateInvoiceHTML } from './invoice-template'

export async function downloadInvoicePDF(
  invoice: any,
  customers: any[],
  serviceRecords: any[],
  bikes: any[]
) {
  const element = document.createElement('div')
  element.innerHTML = generateInvoiceHTML(invoice, customers, serviceRecords, bikes)

  element.style.position = 'fixed'
  element.style.top = '-9999px'
  element.style.left = '-9999px'
  element.style.width = '210mm'
  document.body.appendChild(element)

  await document.fonts.ready
  await new Promise((resolve) => setTimeout(resolve, 200))

  const canvas = await html2canvas(element, {
    backgroundColor: '#ffffff',
    scale: 2,
    useCORS: true,
    logging: false,
  })

  document.body.removeChild(element)

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const imgData = canvas.toDataURL('image/png')
  const imgWidth = 210
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight)
  pdf.save(`invoice-${invoice.invoiceNumber}.pdf`)
}