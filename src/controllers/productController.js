import prisma from "../config/prisma.js";
import { logActivity } from "../utils/activityLogger.js";

/* ================= ADD PRODUCT ================= */
export const addProduct = async (req, res) => {
  try {
    const { name, sku, hsn, barcode, price, stock, cgst, sgst, discount } = req.body;

    if (!name || !sku || !hsn || price === undefined || stock === undefined)
      return res.status(400).json({ error: "All fields required" });

    const existingSku = await prisma.product.findFirst({
      where: { sku, companyId: req.companyId }
    });
    if (existingSku)
      return res.status(400).json({ error: `SKU "${sku}" already exists for product: ${existingSku.name}` });

    const existingHsn = await prisma.product.findFirst({
      where: { hsn, companyId: req.companyId }
    });
    if (existingHsn)
      return res.status(400).json({ error: `HSN "${hsn}" already exists for product: ${existingHsn.name}` });

    if (barcode && barcode.trim() !== "") {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcode: barcode.trim(), companyId: req.companyId }
      });
      if (existingBarcode)
        return res.status(400).json({ error: `Barcode "${barcode}" already exists for product: ${existingBarcode.name}` });
    }

    const product = await prisma.product.create({
      data: {
        name, sku, hsn,
        barcode: barcode?.trim() || "",
        price: Number(price),
        stock: Number(stock),
        cgst: Number(cgst || 0),
        sgst: Number(sgst || 0),
        discount: Number(discount || 0),
        companyId: req.companyId
      }
    });

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.userName || "Unknown",
      module: "PRODUCT",
      action: "CREATED",
      summary: `Added product "${name}" — SKU: ${sku}, Barcode: ${barcode || "N/A"}, Stock: ${stock}, Price: ₹${price}`,
      details: JSON.stringify({ name, sku, hsn, barcode, price, stock, cgst, sgst })
    });

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= GET PRODUCTS ================= */
export const getProducts = async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      where: { companyId: req.companyId },
      orderBy: { id: "desc" }
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= SEARCH BY BARCODE ================= */
export const getProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;
    const product = await prisma.product.findFirst({
      where: { companyId: req.companyId, barcode: barcode.trim() }
    });
    if (!product)
      return res.status(404).json({ error: "Product not found for this barcode" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE PRODUCT ================= */ // ⭐ NEW
export const updateProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, sku, hsn, barcode, price, cgst, sgst, discount } = req.body;

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing || existing.companyId !== req.companyId)
      return res.status(404).json({ error: "Product not found" });

    // Check duplicate SKU (exclude current product)
    if (sku && sku !== existing.sku) {
      const dupSku = await prisma.product.findFirst({
        where: { sku, companyId: req.companyId, id: { not: id } }
      });
      if (dupSku)
        return res.status(400).json({ error: `SKU "${sku}" already exists for product: ${dupSku.name}` });
    }

    // Check duplicate HSN (exclude current product)
    if (hsn && hsn !== existing.hsn) {
      const dupHsn = await prisma.product.findFirst({
        where: { hsn, companyId: req.companyId, id: { not: id } }
      });
      if (dupHsn)
        return res.status(400).json({ error: `HSN "${hsn}" already exists for product: ${dupHsn.name}` });
    }

    // Check duplicate barcode (exclude current product)
    if (barcode && barcode.trim() !== "" && barcode !== existing.barcode) {
      const dupBarcode = await prisma.product.findFirst({
        where: { barcode: barcode.trim(), companyId: req.companyId, id: { not: id } }
      });
      if (dupBarcode)
        return res.status(400).json({ error: `Barcode "${barcode}" already exists for product: ${dupBarcode.name}` });
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        name: name || existing.name,
        sku: sku || existing.sku,
        hsn: hsn || existing.hsn,
        barcode: barcode?.trim() ?? existing.barcode,
        price: price !== undefined ? Number(price) : existing.price,
        cgst: cgst !== undefined ? Number(cgst) : existing.cgst,
        sgst: sgst !== undefined ? Number(sgst) : existing.sgst,
        discount: discount !== undefined ? Number(discount) : existing.discount,
      }
    });

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.userName || "Unknown",
      module: "PRODUCT",
      action: "UPDATED",
      summary: `Updated product "${updated.name}" — Price: ₹${updated.price}, SKU: ${updated.sku}`,
      details: JSON.stringify({ productId: id, name: updated.name, price: updated.price })
    });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= DELETE PRODUCT ================= */
export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const product = await prisma.product.findUnique({ where: { id } });

    const salesCount = await prisma.saleItem.count({ where: { productId: id } });
    if (salesCount > 0)
      return res.status(400).json({
        error: `Cannot delete — product is used in ${salesCount} sale(s). Disable it instead.`
      });

    await prisma.product.delete({ where: { id } });

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.userName || "Unknown",
      module: "PRODUCT",
      action: "DELETED",
      summary: `Deleted product "${product?.name}" — SKU: ${product?.sku}`,
      details: JSON.stringify({ productId: id, name: product?.name })
    });

    res.json({ message: "Product deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* ================= UPDATE STOCK ================= */
export const updateStock = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { change } = req.body;

    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    if (product.stock + change < 0)
      return res.status(400).json({ error: "Stock cannot be negative" });

    const oldStock = product.stock;
    const newStock = oldStock + change;

    const updated = await prisma.product.update({
      where: { id },
      data: { stock: { increment: change } }
    });

    await logActivity({
      companyId: req.companyId,
      userId: req.userId,
      userName: req.userName || "Unknown",
      module: "PRODUCT",
      action: "UPDATED",
      summary: `Updated stock of "${product.name}" from ${oldStock} to ${newStock} (${change > 0 ? "+" : ""}${change})`,
      details: JSON.stringify({ productId: id, name: product.name, oldStock, newStock, change })
    });

    res.json(updated);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};