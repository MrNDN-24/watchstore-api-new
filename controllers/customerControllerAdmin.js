const User = require("../models/User");
const Address = require("../models/Address");  // Đảm bảo import model đúng cách
const Order = require("../models/Order");

// Xóa khách hàng (cập nhật isDelete thành true)
// exports.deleteCustomer = async (req, res) => {
//   try {
//     const { customerId } = req.params;

//     if (!customerId) {
//       return res.status(400).json({ message: "ID khách hàng không hợp lệ" });
//     }

//     // Tìm khách hàng
//     const customer = await User.findOne({ _id: customerId, isDelete: false });
//     if (!customer || customer.role !== "customer") {
//       return res.status(404).json({ message: "Khách hàng không tồn tại hoặc đã bị xóa" });
//     }

//     // Cập nhật isDelete thành true
//     customer.isDelete = true;
//     await customer.save();

//     res.status(200).json({ message: "Khách hàng đã bị xóa thành công", customer });
//   } catch (error) {
//     console.error(error); // In lỗi chi tiết để dễ debug
//     res.status(500).json({ message: "Có lỗi xảy ra", error });
//   }
// };
exports.deleteCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    }

    // Tìm khách hàng
    const customer = await User.findOne({ _id: customerId, isDelete: false });
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ message: "Khách hàng không tồn tại hoặc đã bị xóa" });
    }

    // Kiểm tra đơn hàng liên quan
    const activeOrders = await Order.find({
      user_id: customerId,
      deliveryStatus: { $in: ["Chờ xử lý", "Đã xác nhận", "Đang vận chuyển"] },
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        message: "Không thể xóa khách hàng vì họ có đơn hàng đang xử lý",
      });
    }

    // Cập nhật isDelete thành true
    customer.isDelete = true;
    await customer.save();

    res.status(200).json({ message: "Khách hàng đã bị xóa thành công", customer });
  } catch (error) {
    console.error(error); // In lỗi chi tiết để dễ debug
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};



// exports.updateCustomerStatus = async (req, res) => {
//     try {
//       const { customerId } = req.params;
//       const { isActive } = req.body;
  
//       if (!customerId) {
//         return res.status(400).json({ message: "ID khách hàng không hợp lệ" });
//       }
  
//       // Kiểm tra khách hàng
//       const customer = await User.findOne({ _id: customerId, isDelete: false });
//       if (!customer || customer.role !== "customer") {
//         return res.status(404).json({ message: "Khách hàng không tồn tại hoặc đã bị xóa" });
//       }
  
//       // Cập nhật trạng thái
//       customer.isActive = isActive !== undefined ? isActive : customer.isActive;
//       await customer.save();
//       res.status(200).json({ message: "Trạng thái khách hàng đã được cập nhật", customer });
//     } catch (error) {
//       console.error(error); // In lỗi chi tiết để dễ debug
//       res.status(500).json({ message: "Có lỗi xảy ra", error });
//     }
//   };
exports.updateCustomerStatus = async (req, res) => {
  try {
    const { customerId } = req.params;
    const { isActive } = req.body;

    if (!customerId) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    }

    // Kiểm tra khách hàng
    const customer = await User.findOne({ _id: customerId, isDelete: false });
    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ message: "Khách hàng không tồn tại hoặc đã bị xóa" });
    }

    // Kiểm tra đơn hàng liên quan
    const activeOrders = await Order.find({
      user_id: customerId,
      deliveryStatus: { $in: ["Chờ xử lý", "Đã xác nhận", "Đang vận chuyển"] },
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        message: "Không thể khóa khách hàng vì họ có đơn hàng đang xử lý",
      });
    }

    // Cập nhật trạng thái
    customer.isActive = isActive !== undefined ? isActive : customer.isActive;
    await customer.save();

    res.status(200).json({ message: "Trạng thái khách hàng đã được cập nhật", customer });
  } catch (error) {
    console.error(error); // In lỗi chi tiết để dễ debug
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};

  

// Lấy danh sách khách hàng không bị xóa
// exports.getAllCustomers = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
//     const limit = parseInt(req.query.limit) || 5; // Số lượng bản ghi mỗi trang, mặc định là 5
//     const skip = (page - 1) * limit;

//     // Tổng số khách hàng (có `role: customer` và `isDelete: false`)
//     const totalCustomers = await User.countDocuments({
//       role: "customer",
//       isDelete: false,
//     });

//     // Lấy danh sách khách hàng theo phân trang
//     const customers = await User.find({
//       role: "customer",
//       isDelete: false,
//     })
//       .skip(skip)
//       .limit(limit)
//       .populate({
//         path: "address_id",
//         model: "Address", // Đảm bảo populate đúng model Address
//       });

//     // Trả về kết quả
//     res.status(200).json({
//       total: totalCustomers,
//       page,
//       limit,
//       totalPages: Math.ceil(totalCustomers / limit),
//       customers,
//     });
//   } catch (error) {
//     console.error("Error in getAllCustomers:", error);
//     res.status(500).json({ message: "Có lỗi xảy ra", error });
//   }
// };
exports.getAllCustomers = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const query = { role: "customer", isDelete: false };
    if (search) {
      query.username = { $regex: search, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }

    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalCustomers = await User.countDocuments(query);
      const customers = await User.find(query)
        .skip(skip)
        .limit(parseInt(limit))
        .populate({
          path: "address_id",
          model: "Address",
        });

      res.status(200).json({
        success: true,
        total: totalCustomers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCustomers / limit),
        customers,
      });
    } else {
      const customers = await User.find(query).populate({
        path: "address_id",
        model: "Address",
      });

      res.status(200).json({
        success: true,
        total: customers.length,
        page: 1,
        limit: customers.length,
        totalPages: 1,
        customers,
      });
    }
  } catch (error) {
    console.error("Error in getAllCustomers:", error);
    res.status(500).json({ error: "Failed to fetch customers" });
  }
};

// Lấy thông tin khách hàng theo ID
exports.getCustomerById = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({ message: "ID khách hàng không hợp lệ" });
    }

    // Tìm khách hàng theo ID và đảm bảo khách hàng chưa bị xóa
    const customer = await User.findOne({ _id: customerId, isDelete: false }).populate({
      path: "address_id",
      model: "Address", // Đảm bảo populate đúng model Address
    });

    if (!customer || customer.role !== "customer") {
      return res.status(404).json({ message: "Khách hàng không tồn tại hoặc đã bị xóa" });
    }

    // Trả về thông tin khách hàng
    res.status(200).json({ customer });
  } catch (error) {
    console.error(error); // In lỗi chi tiết để dễ debug
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};
