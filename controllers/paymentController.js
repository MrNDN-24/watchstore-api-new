const mongoose = require("mongoose");
const Payment = require("../models/Payment"); // Import mô hình Payment

const createPayment = async (req, res) => {
  try {
    const paymentData = req.body;
    const newPayment = new Payment(paymentData);
    const savedPayment = await newPayment.save();
    return res.status(201).json({
      message: "Payment created successfully",
      savedPayment,
    });
  } catch (error) {
    console.error("Error while creating payment:", error);
    return res.status(500).json({
      error: "Failed to create payment",
      details: error.message,
    });
  }
};

module.exports = { createPayment };
