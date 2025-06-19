const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const getStatistics = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    // Tổng số khách hàng (role: customer)
    const totalCustomers = await User.countDocuments({
      role: "customer",
      isDelete: false,
    });

    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({ isDelete: false });

    // Đơn hàng chưa xác nhận
    const pendingOrders = await Order.countDocuments({
      deliveryStatus: "Chờ xử lý",
    });

    // Đơn hàng giao thành công
    const deliveredOrders = await Order.countDocuments({
      deliveryStatus: "Đã giao",
      updatedAt: {
        $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      },
    });
    // Lấy tất cả đơn hàng đã giao
    const orders = await Order.find({ deliveryStatus: "Đã giao" })
      .populate("products.product_id", "price discount_price")
      .populate("discountCode");

    // Loại bỏ đơn hàng trùng
    const uniqueOrdersMap = new Map();
    orders.forEach((order) => {
      uniqueOrdersMap.set(order._id.toString(), order);
    });
    const uniqueOrders = Array.from(uniqueOrdersMap.values());

    const monthlyMap = {};

    uniqueOrders.forEach((order) => {
      const updatedAt = new Date(order.updatedAt);
      const month = updatedAt.getMonth() + 1;
      const year = updatedAt.getFullYear();
      const key = `${month}/${year}`;
      //     if (month === 6 && year === selectedYear) {
      //   console.log(
      //     `[JUNE DEBUG] Mã đơn hàng: ${order.orderCode || order._id}, UpdatedAt: ${updatedAt.toISOString()}`
      //   );
      // }

      let originalTotal = 0;
      let productDiscountTotal = 0;
      let actualProductTotal = 0;

      order.products.forEach((item) => {
        const product = item.product_id;
        if (!product) return;

        originalTotal += item.quantity * product.price;

        if (product.discount_price && product.discount_price < product.price) {
          productDiscountTotal +=
            item.quantity * (product.price - product.discount_price);
          actualProductTotal += item.quantity * product.discount_price;
        } else {
          actualProductTotal += item.quantity * product.price;
        }
      });

      const couponDiscount = order.discountCode?.discountValue || 0;
      const totalAfterDiscount = order.total_price;

      if (!monthlyMap[key]) {
        monthlyMap[key] = {
          name: key,
          doanhThu: 0,
          originalTotal: 0,
          productDiscount: 0,
          couponDiscount: 0,
          actualProductTotal: 0,
        };
      }

      monthlyMap[key].doanhThu += totalAfterDiscount;
      monthlyMap[key].originalTotal += originalTotal;
      monthlyMap[key].productDiscount += productDiscountTotal;
      monthlyMap[key].couponDiscount += couponDiscount;
      monthlyMap[key].actualProductTotal += actualProductTotal;
    });

    // Tạo dữ liệu theo 12 tháng
    const revenueData = [];
    for (let month = 1; month <= 12; month++) {
      const key = `${month}/${selectedYear}`;
      revenueData.push({
        name: key,
        doanhThu: monthlyMap[key]?.doanhThu || 0,
        originalTotal: monthlyMap[key]?.originalTotal || 0,
        productDiscount: monthlyMap[key]?.productDiscount || 0,
        couponDiscount: monthlyMap[key]?.couponDiscount || 0,
        actualProductTotal: monthlyMap[key]?.actualProductTotal || 0,
        totalDiscount:
          (monthlyMap[key]?.productDiscount || 0) +
          (monthlyMap[key]?.couponDiscount || 0),
      });
    }

    // Lấy thống kê tháng gần nhất có dữ liệu (nếu có)
    const monthStats = [...revenueData]
      .reverse()
      .find((item) => item.doanhThu > 0 || item.originalTotal > 0);

    const monthTotal = monthStats?.doanhThu || 0;
    const monthOriginal = monthStats?.originalTotal || 0;
    const monthProductDiscount = monthStats?.productDiscount || 0;
    const monthCouponDiscount = monthStats?.couponDiscount || 0;
    const monthActualProductTotal = monthStats?.actualProductTotal || 0;

    res.json({
      totalCustomers,
      totalProducts,
      pendingOrders,
      deliveredOrders,
      revenueData,
      monthTotal,
      monthOriginal,
      monthProductDiscount,
      monthCouponDiscount,
      monthActualProductTotal,
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy thống kê",
      error: error.message,
    });
  }
};

const getTopProducts = async (req, res) => {
  try {
    // Lấy tất cả các đơn hàng đã giao
    const orders = await Order.find({ deliveryStatus: "Đã giao" })
      .populate("products.product_id", "productCode name price discount_price") // Lấy mã, tên, giá gốc và giá khuyến mãi
      .populate("discountCode"); // Lấy thông tin giảm giá nếu có

    // Tạo một đối tượng để lưu dữ liệu của các sản phẩm
    const productDataMap = {};

    // Duyệt qua từng đơn hàng để tổng hợp dữ liệu
    orders.forEach((order) => {
      const discountValue = order.discountCode
        ? order.discountCode.discountValue
        : 0; // Lấy giá trị giảm giá
      const totalDiscountPerProduct = discountValue / order.products.length; // Phân bổ giảm giá cho mỗi sản phẩm

      order.products.forEach((item) => {
        const productId = item.product_id._id.toString();
        const productCode = item.product_id.productCode;
        const productName = item.product_id.name;
        const productPrice =
          item.product_id.discount_price || item.product_id.price; // Dùng discount_price nếu có, nếu không dùng price

        // Tính doanh thu của sản phẩm trong đơn hàng này
        const revenue = item.quantity * productPrice;

        if (!productDataMap[productId]) {
          productDataMap[productId] = {
            productCode,
            name: productName,
            sold: 0,
            totalRevenue: 0,
          };
        }

        // Cộng dồn doanh thu và số lượng đã bán
        productDataMap[productId].sold += item.quantity;
        productDataMap[productId].totalRevenue += revenue;
      });
    });

    // Chuyển đổi đối tượng thành mảng và sắp xếp theo doanh thu
    const topProducts = Object.values(productDataMap)
      .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sắp xếp giảm dần theo doanh thu
      .slice(0, 10); // Lấy top 10 sản phẩm

    // Dữ liệu cho biểu đồ
    const chartData = topProducts.map((product) => ({
      productCode: product.productCode,
      sold: product.sold,
    }));

    // Dữ liệu cho bảng
    const tableData = topProducts.map((product) => ({
      productCode: product.productCode,
      name: product.name,
      sold: product.sold,
      totalRevenue: product.totalRevenue,
    }));

    res.json({ chartData, tableData });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy dữ liệu top sản phẩm",
      error: error.message,
    });
  }
};
const getAvailableYears = async (req, res) => {
  try {
    const years = await Order.aggregate([
      {
        $match: { isDelete: false },
      },
      {
        $group: {
          _id: { $year: "$createdAt" },
        },
      },
      {
        $sort: { _id: 1 },
      },
      {
        $project: {
          year: "$_id",
          _id: 0,
        },
      },
    ]);
    res.json(years.map((y) => y.year));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Không lấy được danh sách năm" });
  }
};

// Trong file API (backend)
const getOrdersByYear = async (req, res) => {
  try {
    const { year } = req.query;
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();

    const orders = await Order.find({
      deliveryStatus: "Đã giao",
      updatedAt: {
        $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
        $lt: new Date(`${selectedYear + 1}-01-01T00:00:00.000Z`),
      },
    })
      .populate("products.product_id", "name price discount_price")
      .populate("discountCode", "code discountValue")
      .populate("user_id", "name email")
      .lean();

    res.json(orders);
  } catch (error) {
    res.status(500).json({
      message: "Lỗi khi lấy danh sách đơn hàng",
      error: error.message,
    });
  }
};

module.exports = {
  getStatistics,
  getTopProducts,
  getAvailableYears,
  getOrdersByYear,
};
