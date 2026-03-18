import PDFDocument from "pdfkit";
import path from "path";

export const generateInvoicePdf = (sale, res) => {

  const doc = new PDFDocument({ margin: 30 });

  const fontPath = path.join(process.cwd(), "src/fonts/Roboto-Regular.ttf");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename=${sale.invoiceNo}.pdf`
  );

  doc.pipe(res);
  doc.font(fontPath);

  const pageWidth = doc.page.width - 60;

  /* ================= COMPANY BOX ================= */

  doc.rect(30, 30, pageWidth, 80).stroke();

  doc.fontSize(18).text(sale.company.name, 30, 45, { align: "center" });

  doc.fontSize(11).text(
    sale.company.setting?.address || "",
    { align: "center" }
  );

  doc.text(
    sale.company.setting?.phone || "",
    { align: "center" }
  );

  doc.moveDown(2);

  /* ================= CUSTOMER BOX ================= */

  doc.rect(30, 120, pageWidth, 70).stroke();

  doc.fontSize(12)
     .text(`Invoice No : ${sale.invoiceNo}`, 40, 130)
     .text(`Customer   : ${sale.customerName}`)
     .text(`Phone      : ${sale.customerPhone || "-"}`);

  /* ================= ITEMS TABLE ================= */

  const tableTop = 210;
  const col1 = 40;
  const col2 = 300;
  const col3 = 370;
  const col4 = 450;

  doc.rect(30, tableTop, pageWidth, 25).stroke();

  doc.fontSize(12)
     .text("Item", col1, tableTop + 7)
     .text("Qty", col2, tableTop + 7)
     .text("Price", col3, tableTop + 7)
     .text("Total", col4, tableTop + 7);

  let y = tableTop + 25;

  let subTotal = 0;
  let totalGST = 0;

  sale.items.forEach(item => {

    const taxable = item.price * item.qty;
    const gst = taxable * (item.cgst + item.sgst) / 100;
    const total = taxable + gst;

    subTotal += taxable;
    totalGST += gst;

    doc.rect(30, y, pageWidth, 25).stroke();

    doc.text(item.productName, col1, y + 7);
    doc.text(item.qty, col2, y + 7);
    doc.text(`₹ ${item.price}`, col3, y + 7);
    doc.text(`₹ ${total.toFixed(2)}`, col4, y + 7);

    y += 25;
  });

  /* ================= SUMMARY BOX ================= */

  const grandTotal = subTotal + totalGST;
  const finalTotal = Math.round(grandTotal);
  const roundOff = finalTotal - grandTotal;

  y += 10;

  doc.rect(30, y, pageWidth, 90).stroke();

  doc.fontSize(12)
     .text(`Subtotal : ₹ ${subTotal.toFixed(2)}`, 350, y + 10)
     .text(`GST      : ₹ ${totalGST.toFixed(2)}`, 350, y + 30)
     .text(`RoundOff : ₹ ${roundOff.toFixed(2)}`, 350, y + 50);

  doc.fontSize(14)
     .text(`Grand Total : ₹ ${finalTotal}`, 350, y + 70);

  /* ================= FOOTER ================= */

  doc.fontSize(10)
     .text("Powered by NexorBizs Technologies", 30, y + 110, { align: "center" });

  doc.end();
};