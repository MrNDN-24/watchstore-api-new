const Category = require("../models/Category");

const getAllCategory = async (req, res) => {
  try {
    const categories = await Category.find({
      isActive: true,
      isDelete: false,
    }).sort({
      createdAt: -1,
    });
    if (categories) {
      return res.status(200).json({
        success: true,
        message: "Categories retrieved successfully",
        data: categories,
      });
    } else {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy category",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

module.exports = getAllCategory;
