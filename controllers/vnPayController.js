const {
  VNPay,
  ignoreLogger,
  ProductCode,
  VnpLocale,
  dateFormat,
} = require("vnpay");

const crypto = require("crypto");
const moment = require("moment");
const request = require("request");
const Order = require("../models/Order"); // thay đường dẫn nếu khác
const Payment = require("../models/Payment"); // thay đường dẫn nếu khác

const createQRCode = async (req, res) => {
  const { order_id, total_amount, payment_id } = req.body;

  const vnpay = new VNPay({
    tmnCode: "ZKGLJ1FQ",
    secureSecret: "BJ6SWSOJTPKSQI4O3IRKYPJ6FOOPINF5",
    vnpayHost: "https://sandbox.vnpayment.vn",
    testMode: true, // tùy chọn
    hashAlgorithe: "SHA512", // tùy chọn
    loggerFn: ignoreLogger, // tùy chọn
  });

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const vnpayResponse = await vnpay.buildPaymentUrl({
    vnp_Amount: total_amount,
    vnp_IpAddr: "127.0.0.1",
    vnp_TxnRef: order_id,
    vnp_OrderInfo: order_id,
    vnp_OrderType: ProductCode.Other,
    vnp_ReturnUrl: "http://localhost:5000/api/payment/vnpay/vnpay-return",
    vnp_Locale: VnpLocale.VN,
    vnp_CreateDate: dateFormat(new Date()),
    vnp_ExpireDate: dateFormat(tomorrow),
    vnp_BankCode: "VNBANK", // Thêm dòng này
    vnp_CurrCode: "VND", // Thêm dòng này nếu chưa có
  });

  return res.status(200).json({
    success: true,
    message: "Tạo QR code thành công",
    data: vnpayResponse,
  });
};
const checkPayment = async (req, res) => {
  console.log("Check payment: ", req.query); // <- sửa từ req.body sang req.query

  return res.status(200).json({
    success: true,
    data: req.query,
  });
};

const vnp_HashSecret = "BJ6SWSOJTPKSQI4O3IRKYPJ6FOOPINF5"; // phải giống với createQRCode

const vnpayReturn = async (req, res) => {
  try {
    const vnp_Params = { ...req.query };
    console.log("VNPay Return: ", vnp_Params);

    const secureHash = vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHash"];
    delete vnp_Params["vnp_SecureHashType"];

    // B1. Sắp xếp theo thứ tự key alphabet
    const sortedParams = Object.keys(vnp_Params)
      .sort()
      .reduce((result, key) => {
        result[key] = vnp_Params[key];
        return result;
      }, {});

    const querystring = require("qs");
    const signData = querystring.stringify(sortedParams, { encode: false });

    const hmac = crypto.createHmac("sha512", vnp_HashSecret);
    const signed = hmac.update(signData, "utf-8").digest("hex");

    const isValid = secureHash === signed;

    const orderId = vnp_Params["vnp_TxnRef"]; // Mã đơn hàng từ VNPay (chính là order_id gửi lên)
    const rspCode = vnp_Params["vnp_ResponseCode"];
    const vnpAmount = Number(vnp_Params["vnp_Amount"]) / 100;
    const vnpTransactionId = vnp_Params["vnp_TransactionNo"];

    // B2. Tìm đơn hàng
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy đơn hàng.",
      });
    }

    // B3. Tìm phương thức thanh toán
    const payment = await Payment.findOne({
      _id: order.payment_id,
      isActive: true,
      isDelete: false,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy phương thức thanh toán.",
      });
    }

    // B4. Kiểm tra và cập nhật trạng thái
    if (isValid) {
      if (rspCode === "00") {
        // Thanh toán thành công
        order.deliveryStatus = "Đã xác nhận";
        payment.status = "Đã thanh toán";
        payment.amount = vnpAmount;
        payment.transactionId = vnpTransactionId;
      } else {
        // Thanh toán thất bại
        order.deliveryStatus = "Đã hủy";
        payment.status = "Chưa thanh toán";
      }

      payment.updatedAt = new Date();
      await order.save();
      await payment.save();

      return res.redirect("http://localhost:3000"); // Hoặc URL trang chủ frontend của bạn

      // return res.status(200).json({
      //   success: true,
      //   message: "Xử lý callback thành công.",
      //   redirectUrl: `${process.env.REACT_CLIENT_URL}/homepage`,
      // });
    } else {
      return res.status(400).json({
        success: false,
        message: "Chữ ký không hợp lệ.",
      });
    }
  } catch (error) {
    console.error("Lỗi callback VNPay:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ nội bộ.",
    });
  }
};

const vnpayRefund = async (req, res) => {
  try {
    const { orderId, transDate, amount, transType, user } = req.body;
    console.log("Refund Request:", req.body);
    if (!orderId || !transDate || !amount || !transType || !user) {
      return res.status(400).json({
        success: false,
        message: "Thiếu thông tin cần thiết để hoàn tiền.",
      });
    }
    // Thiết lập múi giờ cho Việt Nam
    process.env.TZ = "Asia/Ho_Chi_Minh";
    const date = new Date();

    const config = require("config");

    const vnp_TmnCode = config.get("vnp_TmnCode");
    const secretKey = config.get("vnp_HashSecret");
    const vnp_Api = config.get("vnp_Api");

    const vnp_TxnRef = orderId;
    const vnp_TransactionDate = transDate;
    const vnp_Amount = amount;
    const vnp_TransactionType = transType; // 02: Hoàn toàn, 03: Một phần
    const vnp_CreateBy = user;

    const vnp_RequestId = moment(date).format("HHmmss");
    const vnp_Version = "2.1.0";
    const vnp_Command = "refund";
    const vnp_OrderInfo = "Hoàn tiền giao dịch mã: " + vnp_TxnRef;
    const vnp_IpAddr =
      req.headers["x-forwarded-for"] ||
      req.connection.remoteAddress ||
      req.socket?.remoteAddress ||
      req.connection?.socket?.remoteAddress;

    const vnp_CreateDate = moment(date).format("YYYYMMDDHHmmss");
    const vnp_TransactionNo = "0";

    const data =
      vnp_RequestId +
      "|" +
      vnp_Version +
      "|" +
      vnp_Command +
      "|" +
      vnp_TmnCode +
      "|" +
      vnp_TransactionType +
      "|" +
      vnp_TxnRef +
      "|" +
      vnp_Amount +
      "|" +
      vnp_TransactionNo +
      "|" +
      vnp_TransactionDate +
      "|" +
      vnp_CreateBy +
      "|" +
      vnp_CreateDate +
      "|" +
      vnp_IpAddr +
      "|" +
      vnp_OrderInfo;

    const hmac = crypto.createHmac("sha512", secretKey);
    const vnp_SecureHash = hmac
      .update(Buffer.from(data, "utf-8"))
      .digest("hex");

    const dataObj = {
      vnp_RequestId,
      vnp_Version,
      vnp_Command,
      vnp_TmnCode,
      vnp_TransactionType,
      vnp_TxnRef,
      vnp_Amount,
      vnp_TransactionNo,
      vnp_CreateBy,
      vnp_OrderInfo,
      vnp_TransactionDate,
      vnp_CreateDate,
      vnp_IpAddr,
      vnp_SecureHash,
    };

    request(
      {
        url: vnp_Api,
        method: "POST",
        json: true,
        body: dataObj,
      },
      function (error, response, body) {
        if (error) {
          console.error("Refund Error:", error);
          return res
            .status(500)
            .json({ success: false, message: "Lỗi khi hoàn tiền." });
        }
        return res.status(200).json({
          success: true,
          message: "Gửi yêu cầu hoàn tiền thành công.",
          data: body,
        });
      }
    );
  } catch (error) {
    console.error("Refund Exception:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi máy chủ trong quá trình hoàn tiền.",
    });
  }
};

module.exports = {
  createQRCode,
  checkPayment,
  vnpayReturn,
  vnpayRefund,
};
