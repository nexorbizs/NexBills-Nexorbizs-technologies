import prisma from "../config/prisma.js";

/* ADD CUSTOMER */
export const addCustomer = async (req, res) => {
  try {
    const { name, phone, address } = req.body;

    const customer = await prisma.customer.create({
      data: {
        name,
        phone,
        address,
        companyId: req.companyId
      }
    });

    res.json(customer);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* GET CUSTOMERS */
export const getCustomers = async (req, res) => {
  try {
    const customers = await prisma.customer.findMany({
      where: { companyId: req.companyId },
      orderBy: { id: "desc" }
    });

    res.json(customers);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* DELETE CUSTOMER */
export const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.customer.delete({
      where: { id: Number(id) }
    });

    res.json({ message: "Customer deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};