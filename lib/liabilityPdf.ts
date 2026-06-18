/** Capture a DOM node as a PDF data URL (legacy liability waiver parity). */
export async function captureElementAsPdfDataUrl(element: HTMLElement): Promise<string> {
  const html2canvas = (await import('html2canvas')).default
  const { jsPDF } = await import('jspdf')
  const canvas = await html2canvas(element, { scale: 2, useCORS: true, logging: false })
  const img = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const imgWidth = pageWidth - 40
  const imgHeight = (canvas.height * imgWidth) / canvas.width
  let heightLeft = imgHeight
  let position = 20
  pdf.addImage(img, 'PNG', 20, position, imgWidth, imgHeight)
  heightLeft -= pageHeight - 40
  while (heightLeft > 0) {
    pdf.addPage()
    position = 20 - (imgHeight - heightLeft)
    pdf.addImage(img, 'PNG', 20, position, imgWidth, imgHeight)
    heightLeft -= pageHeight - 40
  }
  return pdf.output('datauristring')
}
