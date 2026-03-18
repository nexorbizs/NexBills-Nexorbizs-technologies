import prisma from "../config/prisma.js";

/* ================= ADD PRODUCT ================= */

export const addProduct = async (req, res) => {
  try {
    const { name, sku, hsn, price, stock, cgst, sgst } = req.body;

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        hsn,
        price: Number(price),
        stock: Number(stock),
        cgst: Number(cgst),
        sgst: Number(sgst),
        companyId: req.companyId
      }
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

/* ================= DELETE PRODUCT ================= */

export const deleteProduct = async (req, res) => {
  try {
    const id = Number(req.params.id);

    await prisma.product.delete({
      where: { id }
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

    const product = await prisma.product.update({
      where: { id },
      data: {
        stock: {
          increment: change
        }
      }
    });

    res.json(product);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};