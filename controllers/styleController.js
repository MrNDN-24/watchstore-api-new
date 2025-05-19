const Style = require("../models/Style");

const getAllStyle = async (req, res) => {
  try {
    const styles = await Style.find({ isActive: true, isDelete: false }).sort({
      createdAt: -1,
    });
    if (styles) {
      return res.status(200).json({
        success: true,
        message: "Styles retrieved successfully",
        data: styles,
      });
    } else {
      return res.status(404).json({
        success: true,
        message: "Không tìm thấy style",
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Failed to retrieve styles",
      error: error.message,
    });
  }
};

module.exports = getAllStyle;
