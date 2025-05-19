const express = require("express");
const axios = require("axios");
const Payment = require("../models/Payment");
const Order = require("../models/Order");
const crypto = require("crypto");
const dotenv = require("dotenv");
dotenv.config();

const momoPayment = async (req, res) => {
  //https://developers.momo.vn/#/docs/en/aiov2/?id=payment-method
  //parameters
  const { order_id, total_amount, payment_id } = req.body;
  console.log("Payment id", payment_id);
  var accessKey = "F8BBA842ECF85";
  var secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  var orderInfo = "pay with MoMo";
  var partnerCode = "MOMO";
  var redirectUrl = `${process.env.REACT_CLIENT_URL}/homepage`;
  // var ipnUrl = `${process.env.BACKEND_URL}/payment/callback`;
  var ipnUrl = `${process.env.BACKEND_URL}/payment/callback`;
  var requestType = "payWithMethod";
  // var amount = order.total_price;
  // var amount = "50000";
  var amount = total_amount;
  var orderId = order_id;
  // var orderId = req.body.orderId.toString();
  // var orderId = partnerCode + new Date().getTime();
  var requestId = orderId;
  var extraData = "";
  var orderGroupId = "";
  var autoCapture = true;
  var lang = "vi";

  //before sign HMAC SHA256 with format
  //accessKey=$accessKey&amount=$amount&extraData=$extraData&ipnUrl=$ipnUrl&orderId=$orderId&orderInfo=$orderInfo&partnerCode=$partnerCode&redirectUrl=$redirectUrl&requestId=$requestId&requestType=$requestType
  var rawSignature =
    "accessKey=" +
    accessKey +
    "&amount=" +
    amount +
    "&extraData=" +
    extraData +
    "&ipnUrl=" +
    ipnUrl +
    "&orderId=" +
    orderId +
    "&orderInfo=" +
    orderInfo +
    "&partnerCode=" +
    partnerCode +
    "&redirectUrl=" +
    redirectUrl +
    "&requestId=" +
    requestId +
    "&requestType=" +
    requestType;
  //puts raw signature
  console.log("--------------------RAW SIGNATURE----------------");
  console.log(rawSignature);
  //signature
  const crypto = require("crypto");
  var signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");
  console.log("--------------------SIGNATURE----------------");
  console.log(signature);

  //json object send to MoMo endpoint
  const requestBody = JSON.stringify({
    partnerCode: partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId: requestId,
    amount: amount,
    orderId: orderId,
    orderInfo: orderInfo,
    redirectUrl: redirectUrl,
    ipnUrl: ipnUrl,
    lang: lang,
    requestType: requestType,
    autoCapture: autoCapture,
    extraData: extraData,
    orderGroupId: orderGroupId,
    signature: signature,
  });
  // console.log("Request body:", requestBody);

  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/create",
    headers: {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(requestBody),
    },
    data: requestBody,
  };
  let result;
  try {
    result = await axios(options);
    res.status(200).json({
      success: true,
      message: "Thanh toán thành công.",
      data: result.data,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

const callBackPayment = async (req, res) => {
  try {
    console.log("callback: ", req.body);
    // console.log(req.body);
    /**
     * Dựa vào kết quả này để update trạng thái đơn hàng
     * Kết quả log:
     * {
          partnerCode: 'MOMO',
          orderId: 'MOMO1712108682648',
          requestId: 'MOMO1712108682648',
          amount: 10000,
          orderInfo: 'pay with MoMo',
          orderType: 'momo_wallet',
          transId: 4014083433,
          resultCode: 0,
          message: 'Thành công.',
          payType: 'qr',
          responseTime: 1712108811069,
          extraData: '',
          signature: '10398fbe70cd3052f443da99f7c4befbf49ab0d0c6cd7dc14efffd6e09a526c0'
        }
     */

    const {
      orderId, // Đây là `paymentId` bạn sử dụng trong hệ thống thanh toán
      resultCode,
      message,
      signature,
      amount,
      transId,
    } = req.body;

    console.log("callback request", req.body);
    var accessKey = "F8BBA842ECF85";
    const secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz"; // Thay bằng secretKey của bạn
    const rawSignature = `amount=${amount}&extraData=&message=${message}&orderId=${orderId}&orderInfo=pay with MoMo&orderType=momo_wallet&partnerCode=MOMO&payType=qr&requestId=${orderId}&responseTime=${req.body.responseTime}&resultCode=${resultCode}&transId=${transId}`;
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(rawSignature)
      .digest("hex");

    const order = await Order.findById(orderId);
    console.log("order", order);
    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy đơn hàng." });
    }

    const payment = await Payment.findOne({
      _id: order.payment_id,
      isDelete: false,
      isActive: true,
    }); // Thêm điều kiện isDelete: false
    console.log("Payment", payment);
    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy hình thức thanh toán",
      });
    }

    // 3. Cập nhật trạng thái thanh toán
    if (resultCode === 0) {
      order.deliveryStatus = "Đã xác nhận";
      payment.status = "Đã thanh toán"; // Thanh toán thành công
    } else {
      order.deliveryStatus = "Đã hủy";
      payment.status = "Chưa thanh toán"; // Thanh toán thất bại hoặc chưa hoàn tất
    }

    payment.updatedAt = new Date(); // Cập nhật thời gian thay đổi

    console.log("Order", order);
    await order.save();
    await payment.save(); // Lưu thay đổi vào database

    console.log("Payment updated successfully:", payment);

    return res.status(200).json({
      success: true,
      message: "Payment callback processed successfully.",
    });

    return res.status(204).json(req.body);
  } catch (error) {
    console.error("Error processing payment callback:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error." });
  }
};

const checkStatusTransaction = async (req, res) => {
  const { orderId } = req.body;

  // const signature = accessKey=$accessKey&orderId=$orderId&partnerCode=$partnerCode
  // &requestId=$requestId

  var secretKey = "K951B6PE1waDMi640xX08PD3vg6EkVlz";
  var accessKey = "F8BBA842ECF85";
  const rawSignature = `accessKey=${accessKey}&orderId=${orderId}&partnerCode=MOMO&requestId=${orderId}`;

  const signature = crypto
    .createHmac("sha256", secretKey)
    .update(rawSignature)
    .digest("hex");

  const requestBody = JSON.stringify({
    partnerCode: "MOMO",
    requestId: orderId,
    orderId: orderId,
    signature: signature,
    lang: "vi",
  });

  // options for axios
  const options = {
    method: "POST",
    url: "https://test-payment.momo.vn/v2/gateway/api/query",
    headers: {
      "Content-Type": "application/json",
    },
    data: requestBody,
  };

  const result = await axios(options);

  return res.status(200).json(result.data);
};

module.exports = {
  momoPayment,
  callBackPayment,
};

