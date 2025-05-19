const Product = require("../models/Product");
const Order = require("../models/Order");
// Thêm sản phẩm mới
exports.createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    console.log("Sản phẩm đã được tạo:", product);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
// Cập nhật trạng thái hoạt động của sản phẩm
exports.updateProductActive = async (req, res) => {
  try {
    const { isActive } = req.body;

    // Kiểm tra nếu không gửi trường `isActive`
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        message: "Trường 'isActive' là bắt buộc và phải có giá trị true/false",
      });
    }

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: isActive },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    res.status(200).json({
      success: true,
      message: "Trạng thái sản phẩm đã được cập nhật thành công",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật trạng thái sản phẩm",
      error: error.message,
    });
  }
};

//Lấy toàn bộ danh sách sản phẩm
// exports.getAllProducts = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1; // Trang hiện tại, mặc định là 1
//     const limit = parseInt(req.query.limit) || 4; // Số lượng bản ghi mỗi trang, mặc định là 5
//     const skip = (page - 1) * limit;

//     const totalProducts = await Product.countDocuments({ isDelete: false }); // Tổng số sản phẩm
//     const products = await Product.find({ isDelete: false })
//       .populate({
//         path: "image_ids",
//         match: { isPrimary: true },
//       })
//       .skip(skip)
//       .limit(limit);

//     // Chuyển đổi kết quả để lấy ảnh chính cho mỗi sản phẩm
//     const result = products.map((product) => {
//       const primaryImage = product.image_ids[0];
//       const imageUrl = primaryImage ? primaryImage.image_url : "Ảnh Trống";
//       return {
//         ...product.toObject(),
//         imageUrl: imageUrl,
//       };
//     });

//     res.status(200).json({
//       total: totalProducts,
//       page,
//       limit,
//       totalPages: Math.ceil(totalProducts / limit),
//       data: result,
//     });
//   } catch (error) {
//     console.error("Error in getAllProducts:", error);
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch products",
//       error: error.message,
//     });
//   }
// };
exports.getAllProducts = async (req, res) => {
  try {
    const { page, limit, search } = req.query; // Get page, limit, and search query from request
    const query = { isDelete: false };

    // If a search term is provided, modify the query to search by name or other fields
    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search by name
    }

    const skip = (page - 1) * limit;

    // Count total products with the search filter applied
    const totalProducts = await Product.countDocuments(query);

    // Find products with the applied search filter and pagination
    const products = await Product.find(query)
      .populate({
        path: "image_ids",
        match: { isPrimary: true },
      })
      .skip(skip)
      .limit(parseInt(limit));

    // Format products to include primary image URL
    const result = products.map((product) => {
      const primaryImage = product.image_ids[0];
      const imageUrl = primaryImage ? primaryImage.image_url : "No Image";
      return {
        ...product.toObject(),
        imageUrl: imageUrl,
      };
    });

    res.status(200).json({
      total: totalProducts,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(totalProducts / limit),
      data: result,
    });
  } catch (error) {
    console.error("Error in getAllProducts:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch products",
      error: error.message,
    });
  }
};

//Lấy sản phẩm thông qua ID
exports.getProductById = async (req, res) => {
  try {
    const { id } = req.params;

    // Tìm sản phẩm theo ID, chỉ lấy những sản phẩm chưa bị xóa
    const product = await Product.findOne({ _id: id, isDelete: false })
      .populate("category_ids")
      .populate("brand_id")
      .populate("style_ids")
      .populate({
        path: "image_ids",
        match: { isPrimary: true }, // Lấy ảnh chính
      });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Lấy ảnh chính
    const primaryImage = product.image_ids[0];
    const imageUrl = primaryImage ? primaryImage.image_url : "Ảnh Trống";

    // Chuẩn bị kết quả trả về
    const result = {
      ...product.toObject(),
      imageUrl: imageUrl,
    };

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch product",
      error: error.message,
    });
  }
};

// Xóa sản phẩm (logic delete)
// exports.deleteProduct = async (req, res) => {
//   try {
//     const product = await Product.findByIdAndUpdate(
//       req.params.id,
//       { isDelete: true },
//       { new: true }
//     );
//     if (!product)
//       return res.status(404).json({ message: "Sản phẩm không tồn tại" });
//     res.status(200).json({ message: "Sản phẩm đã được xóa" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };
exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    if (!productId) {
      return res.status(400).json({ message: "ID sản phẩm không hợp lệ" });
    }

    // Kiểm tra sản phẩm
    const product = await Product.findById(productId);
    if (!product || product.isDelete) {
      return res
        .status(404)
        .json({ message: "Sản phẩm không tồn tại hoặc đã bị xóa" });
    }

    // Kiểm tra sản phẩm có trong đơn hàng với các trạng thái không cho phép xóa
    const existingOrders = await Order.find({
      "products.product_id": productId, // Sửa từ "items.product" thành "products.product_id"
      deliveryStatus: { $in: ["Chờ xử lý", "Đã xác nhận", "Đang vận chuyển"] }, // Sửa "status" thành "deliveryStatus"
    });

    if (existingOrders.length > 0) {
      return res.status(400).json({
        message:
          "Không thể xóa sản phẩm này vì đang có trong đơn hàng ở trạng thái xử lý",
      });
    }

    // Đánh dấu sản phẩm là đã bị xóa
    product.isDelete = true;
    await product.save();

    res.status(200).json({ message: "Sản phẩm đã được xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa sản phẩm:", error);
    res.status(500).json({ message: "Có lỗi xảy ra", error });
  }
};

// Cập nhật thông tin sản phẩm
exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Kiểm tra nếu không có dữ liệu cần cập nhật
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "Dữ liệu cập nhật không hợp lệ" });
    }

    // Cập nhật sản phẩm
    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true, // Trả về đối tượng sau khi đã được cập nhật
      runValidators: true, // Chạy validation của schema
    });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    res.status(200).json({
      success: true,
      message: "Cập nhật thông tin sản phẩm thành công",
      data: updatedProduct,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Lỗi khi cập nhật sản phẩm",
      error: error.message,
    });
  }
};
