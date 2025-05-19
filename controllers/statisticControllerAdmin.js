const User = require("../models/User");
const Product = require("../models/Product");
const Order = require("../models/Order");

const getStatistics = async (req, res) => {
  try {
    // Tổng số khách hàng (role: customer)
    const totalCustomers = await User.countDocuments({ role: "customer", isDelete: false });
    // Tổng số sản phẩm
    const totalProducts = await Product.countDocuments({ isDelete: false });
    // Đơn hàng chưa xác nhận
    const pendingOrders = await Order.countDocuments({
      deliveryStatus: "Chờ xử lý",
    });
    // Đơn hàng giao thành công
    const deliveredOrders = await Order.countDocuments({
      deliveryStatus: "Đã giao",
    });

  
    // Lấy doanh thu theo tháng
    const monthlyRevenue = await Order.aggregate([
      { $match: { deliveryStatus: "Đã giao" } },
      {
        $project: {
          month: { $month: "$updatedAt" },
          year: { $year: "$updatedAt" }, 
          total_price: 1,
        },
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalRevenue: { $sum: "$total_price" },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    // Tạo danh sách các tháng từ tháng 1 đến tháng 12
    const allMonths = [];
    const currentYear = new Date().getFullYear();
    for (let month = 1; month <= 12; month++) {
      allMonths.push({ month, year: currentYear });
    }

    // Ghép dữ liệu doanh thu vào các tháng
    const revenueData = allMonths.map(({ month, year }) => {
      const revenue = monthlyRevenue.find(
        (item) => item._id.month === month && item._id.year === year
      );
      return {
        name: `${month}/${year}`,
        doanhThu: revenue ? revenue.totalRevenue : 0,
      };
    });

    // Lấy doanh thu của tháng hiện tại
    const currentMonthRevenue = monthlyRevenue.find(
      (item) =>
        item._id.month === new Date().getMonth() + 1 &&
        item._id.year === currentYear
    );

    const monthTotal = currentMonthRevenue
      ? currentMonthRevenue.totalRevenue
      : 0;
    res.json({
      totalCustomers,
      totalProducts,
      revenueData, 
      pendingOrders,
      deliveredOrders,
      monthTotal, 
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Lỗi khi lấy thống kê", error: error.message });
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
      const discountValue = order.discountCode ? order.discountCode.discountValue : 0; // Lấy giá trị giảm giá
      const totalDiscountPerProduct = discountValue / order.products.length; // Phân bổ giảm giá cho mỗi sản phẩm

      order.products.forEach((item) => {
        const productId = item.product_id._id.toString();
        const productCode = item.product_id.productCode;
        const productName = item.product_id.name;
        const productPrice = item.product_id.discount_price || item.product_id.price; // Dùng discount_price nếu có, nếu không dùng price

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


// const getTopProducts = async (req, res) => {
//   try {
//     // Lấy tất cả các đơn hàng đã giao
//     const orders = await Order.find({ deliveryStatus: "Đã giao" })
//       .populate("products.product_id", "productCode name price") // Lấy mã, tên và giá sản phẩm
//       .populate("discountCode"); // Lấy thông tin giảm giá nếu có

//     // Tạo một đối tượng để lưu dữ liệu của các sản phẩm
//     const productDataMap = {};

//     // Duyệt qua từng đơn hàng để tổng hợp dữ liệu
//     orders.forEach((order) => {
//       const discountValue = order.discountCode ? order.discountCode.discountValue : 0; // Lấy giá trị giảm giá
//       const totalDiscountPerProduct = discountValue / order.products.length; // Phân bổ giảm giá cho mỗi sản phẩm

//       order.products.forEach((item) => {
//         const productId = item.product_id._id.toString();
//         const productCode = item.product_id.productCode;
//         const productName = item.product_id.name;
//         const productPrice = item.product_id.price;

//         // Tính doanh thu của sản phẩm trong đơn hàng này
//         const revenue = item.quantity * (productPrice - totalDiscountPerProduct);

//         if (!productDataMap[productId]) {
//           productDataMap[productId] = {
//             productCode,
//             name: productName,
//             sold: 0,
//             totalRevenue: 0,
//           };
//         }

//         // Cộng dồn doanh thu và số lượng đã bán
//         productDataMap[productId].sold += item.quantity;
//         productDataMap[productId].totalRevenue += revenue;
//       });
//     });

//     // Chuyển đổi đối tượng thành mảng và sắp xếp theo doanh thu
//     const topProducts = Object.values(productDataMap)
//       .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sắp xếp giảm dần theo doanh thu
//       .slice(0, 10); // Lấy top 10 sản phẩm

//     // Dữ liệu cho biểu đồ
//     const chartData = topProducts.map((product) => ({
//       productCode: product.productCode,
//       sold: product.sold,
//     }));

//     // Dữ liệu cho bảng
//     const tableData = topProducts.map((product) => ({
//       productCode: product.productCode,
//       name: product.name,
//       sold: product.sold,
//       totalRevenue: product.totalRevenue,
//     }));

//     res.json({ chartData, tableData });
//   } catch (error) {
//     res.status(500).json({
//       message: "Lỗi khi lấy dữ liệu top sản phẩm",
//       error: error.message,
//     });
//   }
// };


module.exports = {
  getStatistics,
  getTopProducts,
};
// const getTopProducts = async (req, res) => {
//   try {
//     // Sản phẩm bán chạy (dựa trên sold)
//     const bestSellingProducts = await Product.find({})
//       .sort({ sold: -1 }) // Sắp xếp giảm dần theo sold
//       .limit(5) 
//       .select("name sold"); // Chỉ lấy các trường cần thiết

//     res.json({
//       bestSellingProducts,
//     });
//   } catch (error) {
//     res
//       .status(500)
//       .json({
//         message: "Lỗi khi lấy sản phẩm bán nhiều nhất",
//         error: error.message,
//       });
//   }
// };
// const getTopProducts = async (req, res) => {
//   try {
//     // Lấy tất cả các đơn hàng đã giao
//     const orders = await Order.find({ deliveryStatus: "Đã giao" })
//       .populate("products.product_id", "name price") // Lấy tên và giá từ sản phẩm
//       .populate("discountCode"); // Lấy thông tin mã giảm giá nếu có

//     // Tạo một đối tượng để lưu doanh thu theo sản phẩm
//     const productRevenueMap = {};

//     // Duyệt qua từng đơn hàng để tính doanh thu
//     orders.forEach((order) => {
//       const discountValue = order.discountCode ? order.discountCode.discountValue : 0; // Lấy giá trị giảm giá
//       const totalDiscountPerProduct = discountValue / order.products.length; // Phân bổ giảm giá cho mỗi sản phẩm

//       order.products.forEach((item) => {
//         const productId = item.product_id._id.toString();
//         const productName = item.product_id.name;
//         const productPrice = item.product_id.price;

//         // Tính doanh thu của sản phẩm trong đơn hàng này
//         const revenue = item.quantity * (productPrice - totalDiscountPerProduct);

//         if (!productRevenueMap[productId]) {
//           productRevenueMap[productId] = {
//             name: productName,
//             sold: 0,
//             totalRevenue: 0,
//           };
//         }

//         // Cộng dồn doanh thu và số lượng đã bán
//         productRevenueMap[productId].sold += item.quantity;
//         productRevenueMap[productId].totalRevenue += revenue;
//       });
//     });

//     // Chuyển đổi đối tượng thành mảng và sắp xếp theo doanh thu
//     const topProducts = Object.values(productRevenueMap)
//       .sort((a, b) => b.totalRevenue - a.totalRevenue) // Sắp xếp giảm dần theo doanh thu
//       .slice(0, 5); // Lấy top 5 sản phẩm

//     res.json({ topProducts });
//   } catch (error) {
//     res.status(500).json({
//       message: "Lỗi khi lấy sản phẩm bán nhiều nhất",
//       error: error.message,
//     });
//   }
// };
