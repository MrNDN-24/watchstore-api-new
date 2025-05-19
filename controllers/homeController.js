const Brand = require("../models/Brand"); // Đường dẫn có thể thay đổi tùy cấu trúc dự án

const getAllBrands = async (req, res) => {
  try {
    // Sử dụng `find` để lấy tất cả các sản phẩm, có thể bổ sung thêm các tùy chọn phân trang hoặc sắp xếp nếu cần
    const brands = await Brand.find();

    res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

module.exports = { getAllBrands };
