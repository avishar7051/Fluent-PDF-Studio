import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/**
 * Creates a professional sample Contract PDF with headers, clauses, and signature zones
 */
export async function createSampleContractPdf(): Promise<{ bytes: Uint8Array; name: string }> {
  const pdfDoc = await PDFDocument.create();
  const timesRoman = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  // --- PAGE 1 ---
  const page1 = pdfDoc.addPage([595.28, 841.89]); // A4 in points
  const { width, height } = page1.getSize();

  // Header banner
  page1.drawRectangle({
    x: 40,
    y: height - 80,
    width: width - 80,
    height: 44,
    color: rgb(0.06, 0.09, 0.16),
  });

  page1.drawText('MASTER CONSULTING & SERVICE AGREEMENT', {
    x: 60,
    y: height - 54,
    size: 15,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page1.drawText('Document Reference: MSA-2026-0914 | Jurisdiction: State of Washington / United States', {
    x: 42,
    y: height - 100,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.5),
  });

  let curY = height - 130;

  // Intro paragraph
  page1.drawText('1. PARTIES & EFFECTIVE DATE', {
    x: 42,
    y: curY,
    size: 12,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 20;
  const p1 =
    'This Agreement is entered into as of October 1, 2026 ("Effective Date"), by and between:\n' +
    'Client Corporation: Nexus Dynamics LLC, a Delaware corporation ("Client"), having its principal\n' +
    'office at 450 Innovation Parkway, Suite 800, Seattle, WA 98101; and\n' +
    'Service Provider: Sovereign Design & Systems Inc. ("Provider"), located at 1200 Tech Vista Way.';

  page1.drawText(p1, {
    x: 42,
    y: curY - 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.15, 0.15),
    lineHeight: 15,
  });

  curY -= 80;

  page1.drawText('2. SCOPE OF SERVICES & DELIVERABLES', {
    x: 42,
    y: curY,
    size: 12,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 20;
  const p2 =
    'Provider agrees to render professional engineering, software architecture, and interface design\n' +
    'consulting services for the enterprise cross-platform document pipeline. All deliverables shall\n' +
    'meet industry standards for responsive execution, type fidelity, and cryptographic security.';

  page1.drawText(p2, {
    x: 42,
    y: curY - 20,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.15, 0.15),
    lineHeight: 15,
  });

  curY -= 65;

  page1.drawText('3. COMPENSATION, BILLING & EXPENSES', {
    x: 42,
    y: curY,
    size: 12,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 20;
  const p3 =
    'The fixed project compensation is designated as $48,500.00 USD, payable in three milestone\n' +
    'installments upon acceptance of corresponding phases. Payment terms are strictly Net 30 days\n' +
    'from the date of validated milestone invoice submission.';

  page1.drawText(p3, {
    x: 42,
    y: curY - 20,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.15, 0.15),
    lineHeight: 15,
  });

  curY -= 75;

  page1.drawText('4. CONFIDENTIALITY & PROPRIETARY RIGHTS', {
    x: 42,
    y: curY,
    size: 12,
    font: timesBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  curY -= 20;
  const p4 =
    'Each party acknowledges that it may receive Confidential Information. Receiving party agrees\n' +
    'to hold all such proprietary information in strict confidence for a period of five (5) years\n' +
    'following termination or expiration of this Agreement.';

  page1.drawText(p4, {
    x: 42,
    y: curY - 20,
    size: 10,
    font: timesRoman,
    color: rgb(0.15, 0.15, 0.15),
    lineHeight: 15,
  });

  curY -= 70;

  // Signature Block on Page 1
  page1.drawRectangle({
    x: 40,
    y: curY - 140,
    width: width - 80,
    height: 135,
    borderColor: rgb(0.8, 0.82, 0.88),
    borderWidth: 1,
    color: rgb(0.98, 0.98, 0.99),
  });

  page1.drawText('5. EXECUTION & DIGITAL SIGNATURES', {
    x: 52,
    y: curY - 22,
    size: 11,
    font: helveticaBold,
    color: rgb(0.1, 0.15, 0.25),
  });

  // Client signature line
  page1.drawText('ACCEPTED & AGREED (CLIENT):', {
    x: 52,
    y: curY - 45,
    size: 9,
    font: helveticaBold,
    color: rgb(0.3, 0.35, 0.4),
  });
  page1.drawLine({
    start: { x: 52, y: curY - 95 },
    end: { x: 260, y: curY - 95 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });
  page1.drawText('Authorized Signature: Nexus Dynamics LLC', {
    x: 52,
    y: curY - 110,
    size: 8,
    font: timesRoman,
    color: rgb(0.4, 0.45, 0.5),
  });
  page1.drawText('Date: October 4, 2026', {
    x: 52,
    y: curY - 125,
    size: 8,
    font: timesRoman,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Provider signature line
  page1.drawText('ACCEPTED & AGREED (PROVIDER):', {
    x: 310,
    y: curY - 45,
    size: 9,
    font: helveticaBold,
    color: rgb(0.3, 0.35, 0.4),
  });
  page1.drawLine({
    start: { x: 310, y: curY - 95 },
    end: { x: 520, y: curY - 95 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });
  page1.drawText('Authorized Signature: Sovereign Design', {
    x: 310,
    y: curY - 110,
    size: 8,
    font: timesRoman,
    color: rgb(0.4, 0.45, 0.5),
  });
  page1.drawText('Date: October 4, 2026', {
    x: 310,
    y: curY - 125,
    size: 8,
    font: timesRoman,
    color: rgb(0.4, 0.45, 0.5),
  });

  // Footer
  page1.drawText('Page 1 of 2  ·  Confidential & Legally Binding Agreement', {
    x: 180,
    y: 25,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  // --- PAGE 2 ---
  const page2 = pdfDoc.addPage([595.28, 841.89]);
  page2.drawText('SCHEDULE A: STATEMENT OF WORK (SOW-01)', {
    x: 42,
    y: height - 60,
    size: 14,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });

  page2.drawLine({
    start: { x: 42, y: height - 70 },
    end: { x: width - 42, y: height - 70 },
    thickness: 1,
    color: rgb(0.8, 0.8, 0.8),
  });

  let p2Y = height - 100;
  page2.drawText('Milestone Schedule & Target Deliverables', {
    x: 42,
    y: p2Y,
    size: 11,
    font: timesBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  p2Y -= 25;
  const sowText =
    'Phase I: High-Fidelity Design System & Typography Engine Specification\n' +
    'Target Completion: November 15, 2026  |  Allocated Budget: $16,000.00 USD\n\n' +
    'Phase II: Digital Signature Verification & In-Place Text Replacement Engine\n' +
    'Target Completion: December 20, 2026  |  Allocated Budget: $18,500.00 USD\n\n' +
    'Phase III: Cross-Platform Windows & Desktop App Packaging & Validation\n' +
    'Target Completion: January 30, 2027   |  Allocated Budget: $14,000.00 USD\n\n' +
    'Sign-off and acceptance shall occur within five (5) business days of milestone deliverable demo.';

  page2.drawText(sowText, {
    x: 42,
    y: p2Y - 30,
    size: 10,
    font: timesRoman,
    color: rgb(0.2, 0.2, 0.2),
    lineHeight: 16,
  });

  // Page 2 signature verification box
  p2Y -= 170;
  page2.drawRectangle({
    x: 42,
    y: p2Y - 80,
    width: width - 84,
    height: 75,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
    color: rgb(0.97, 0.98, 1),
  });

  page2.drawText('PROJECT MANAGER APPROVAL:', {
    x: 56,
    y: p2Y - 24,
    size: 10,
    font: helveticaBold,
    color: rgb(0.15, 0.2, 0.35),
  });

  page2.drawText('Sign here to certify milestone criteria and initial billing activation:', {
    x: 56,
    y: p2Y - 42,
    size: 9,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.55),
  });

  page2.drawLine({
    start: { x: 56, y: p2Y - 65 },
    end: { x: 260, y: p2Y - 65 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  page2.drawText('Page 2 of 2  ·  Schedule A: Deliverables & Milestones', {
    x: 180,
    y: 25,
    size: 8,
    font: helvetica,
    color: rgb(0.5, 0.5, 0.5),
  });

  const pdfBytes = await pdfDoc.save();
  return { bytes: pdfBytes, name: 'Service_Agreement_MSA_2026.pdf' };
}

/**
 * Creates a professional sample Invoice PDF
 */
export async function createSampleInvoicePdf(): Promise<{ bytes: Uint8Array; name: string }> {
  const pdfDoc = await PDFDocument.create();
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  const page = pdfDoc.addPage([595.28, 841.89]);
  const { width, height } = page.getSize();

  // Top Bar
  page.drawRectangle({
    x: 40,
    y: height - 90,
    width: width - 80,
    height: 60,
    color: rgb(0.08, 0.12, 0.2),
  });

  page.drawText('INVOICE #INV-8842', {
    x: 60,
    y: height - 55,
    size: 18,
    font: helveticaBold,
    color: rgb(1, 1, 1),
  });

  page.drawText('STATUS: PENDING SIGNATURE & PAYMENT', {
    x: 60,
    y: height - 75,
    size: 9,
    font: helvetica,
    color: rgb(0.6, 0.7, 0.9),
  });

  // Metadata table
  page.drawText('Billed To: Horizon Systems Corp.', {
    x: 42,
    y: height - 120,
    size: 11,
    font: helveticaBold,
    color: rgb(0.1, 0.1, 0.1),
  });
  page.drawText('Attn: Accounts Payable\n770 Tech Center Blvd, Suite 400\nAustin, TX 78701', {
    x: 42,
    y: height - 140,
    size: 9,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
    lineHeight: 14,
  });

  page.drawText('Invoice Date: October 4, 2026\nPayment Due: November 3, 2026\nTerms: Net 30 Days', {
    x: 350,
    y: height - 125,
    size: 9,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.3),
    lineHeight: 14,
  });

  // Table header
  page.drawRectangle({
    x: 40,
    y: height - 215,
    width: width - 80,
    height: 24,
    color: rgb(0.94, 0.95, 0.97),
  });

  page.drawText('ITEM DESCRIPTION', { x: 50, y: height - 205, size: 9, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('HOURS', { x: 340, y: height - 205, size: 9, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('RATE', { x: 420, y: height - 205, size: 9, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });
  page.drawText('AMOUNT (USD)', { x: 480, y: height - 205, size: 9, font: helveticaBold, color: rgb(0.2, 0.25, 0.3) });

  const items = [
    { desc: 'Cross-Platform PDF Layout Architecture & Parser Integration', hrs: '40.0', rate: '$175.00', amt: '$7,000.00' },
    { desc: 'Font Matching Engine & High-Fidelity Text In-Place Editor', hrs: '35.0', rate: '$175.00', amt: '$6,125.00' },
    { desc: 'Digital Signature Studio with Ink Smoothing & Alpha Masking', hrs: '28.0', rate: '$175.00', amt: '$4,900.00' },
    { desc: 'Windows 11 Fluent Interface Design & Drag-and-Drop Dock', hrs: '22.0', rate: '$175.00', amt: '$3,850.00' },
  ];

  let rowY = height - 240;
  items.forEach((item) => {
    page.drawText(item.desc, { x: 50, y: rowY, size: 9, font: helvetica, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(item.hrs, { x: 345, y: rowY, size: 9, font: courier, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(item.rate, { x: 420, y: rowY, size: 9, font: courier, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(item.amt, { x: 480, y: rowY, size: 9, font: courier, color: rgb(0.15, 0.15, 0.15) });

    page.drawLine({
      start: { x: 40, y: rowY - 8 },
      end: { x: width - 40, y: rowY - 8 },
      thickness: 0.5,
      color: rgb(0.9, 0.9, 0.9),
    });
    rowY -= 26;
  });

  // Total summary
  rowY -= 15;
  page.drawText('SUBTOTAL:', { x: 400, y: rowY, size: 10, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('$21,875.00', { x: 480, y: rowY, size: 10, font: courier, color: rgb(0.1, 0.1, 0.1) });

  rowY -= 20;
  page.drawText('TAX (0.0%):', { x: 400, y: rowY, size: 10, font: helveticaBold, color: rgb(0.2, 0.2, 0.2) });
  page.drawText('$0.00', { x: 480, y: rowY, size: 10, font: courier, color: rgb(0.1, 0.1, 0.1) });

  rowY -= 24;
  page.drawRectangle({
    x: 390,
    y: rowY - 6,
    width: width - 430,
    height: 26,
    color: rgb(0.9, 0.94, 1),
  });
  page.drawText('TOTAL DUE:', { x: 400, y: rowY, size: 11, font: helveticaBold, color: rgb(0.05, 0.1, 0.3) });
  page.drawText('$21,875.00', { x: 480, y: rowY, size: 11, font: courier, color: rgb(0.05, 0.1, 0.3) });

  // Signature authorization block
  rowY -= 70;
  page.drawRectangle({
    x: 40,
    y: rowY - 60,
    width: width - 80,
    height: 70,
    borderColor: rgb(0.85, 0.88, 0.92),
    borderWidth: 1,
    color: rgb(0.98, 0.99, 1),
  });

  page.drawText('PAYMENT AUTHORIZATION & SIGNATURE:', {
    x: 52,
    y: rowY - 18,
    size: 9,
    font: helveticaBold,
    color: rgb(0.15, 0.2, 0.3),
  });
  page.drawText('Please sign and return to authorize wire release for INV-8842:', {
    x: 52,
    y: rowY - 32,
    size: 8,
    font: helvetica,
    color: rgb(0.4, 0.45, 0.5),
  });
  page.drawLine({
    start: { x: 52, y: rowY - 48 },
    end: { x: 260, y: rowY - 48 },
    thickness: 1,
    color: rgb(0.6, 0.65, 0.7),
  });

  const invoiceBytes = await pdfDoc.save();
  return { bytes: invoiceBytes, name: 'Invoice_INV-8842.pdf' };
}
