import prisma from "../config/prisma.js";

export const saveSettings = async (req, res) => {
  try {
    const companyId = req.companyId;
    const { shopName, gstNumber, phone, address, upiId, logoUrl } = req.body; // ⭐

    const existing = await prisma.setting.findUnique({ where: { companyId } });

    if (existing) {
      const updated = await prisma.setting.update({
        where: { companyId },
        data: {
          shopName,
          gstNumber,
          phone,
          address,
          upiId: upiId || "",       // ⭐
          logoUrl: logoUrl || ""    // ⭐
        }
      });
      return res.json(updated);
    }

    const created = await prisma.setting.create({
      data: {
        companyId,
        shopName,
        gstNumber,
        phone,
        address,
        upiId: upiId || "",         // ⭐
        logoUrl: logoUrl || ""      // ⭐
      }
    });

    res.json(created);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getSettings = async (req, res) => {
  try {
    const setting = await prisma.setting.findUnique({
      where: { companyId: req.companyId }
    });
    res.json(setting);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};