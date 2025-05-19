const Style = require('../models/Style');
const Product = require('../models/Product');
// Thêm mới style
const addStyle = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newStyle = new Style({ name, description });
    await newStyle.save();
    return res.status(201).json({ message: 'Thêm style thành công', style: newStyle });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi thêm style', error: err });
  }
};

// Sửa style
const updateStyle = async (req, res) => {
  try {
    const { styleId } = req.params;
    const { name, description } = req.body;
    const updatedStyle = await Style.findByIdAndUpdate(
      styleId, 
      { name, description },
      { new: true } // Trả về đối tượng đã được cập nhật
    );

    if (!updatedStyle) {
      return res.status(404).json({ message: 'Style không tìm thấy' });
    }

    return res.status(200).json({ message: 'Cập nhật style thành công', style: updatedStyle });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật style', error: err });
  }
};

// // Cập nhật trạng thái isActive của style
// const updateStatus = async (req, res) => {
//   try {
//     const { styleId } = req.params; // lấy styleId trực tiếp từ tham số URL
//     const { isActive } = req.body;  // Trạng thái mới của isActive

//     const updatedStyle = await Style.findByIdAndUpdate(
//       styleId, 
//       { isActive }, 
//       { new: true }
//     );

//     if (!updatedStyle) {
//       return res.status(404).json({ error: "Style không tìm thấy" });
//     }

//     res.status(200).json(updatedStyle);
//   } catch (error) {
//     console.error("Error in updateStyleActive:", error);
//     res.status(500).json({ error: "Lỗi khi cập nhật trạng thái style" });
//   }
// };

// // Xóa style (soft delete)
// const deleteStyle = async (req, res) => {
//   try {
//     const { styleId } = req.params;
//     const style = await Style.findById(styleId);

//     if (!style) {
//       return res.status(404).json({ message: 'Style không tìm thấy' });
//     }

//     style.isDelete = true; // Đánh dấu là đã xóa (soft delete)
//     await style.save();

//     return res.status(200).json({ message: 'Xóa style thành công' });
//   } catch (err) {
//     return res.status(500).json({ message: 'Lỗi khi xóa style', error: err });
//   }
// };
// Cập nhật trạng thái isActive của style
const updateStatus = async (req, res) => {
  try {
    const { styleId } = req.params; // lấy styleId trực tiếp từ tham số URL
    const { isActive } = req.body;  // Trạng thái mới của isActive

    const style = await Style.findById(styleId);
    if (!style) {
      return res.status(404).json({ error: "Style không tìm thấy" });
    }

    // Cập nhật trạng thái
    style.isActive = isActive;

    // Nếu khóa style, khóa tất cả sản phẩm liên kết với style
    if (!isActive) {
      await Product.updateMany(
        { style_ids: styleId },
        { isActive: false }
      );
    }

    await style.save();

    res.status(200).json({ message: "Cập nhật trạng thái style thành công", style });
  } catch (error) {
    console.error("Error in updateStyleActive:", error);
    res.status(500).json({ error: "Lỗi khi cập nhật trạng thái style" });
  }
};

// Xóa style (soft delete)
const deleteStyle = async (req, res) => {
  try {
    const { styleId } = req.params;

    // Kiểm tra style có tồn tại
    const style = await Style.findById(styleId);
    if (!style) {
      return res.status(404).json({ message: "Style không tìm thấy" });
    }

    // Kiểm tra nếu có sản phẩm liên kết với style thì không cho xóa
    const linkedProducts = await Product.find({ style_ids: styleId, isDelete: false });
    if (linkedProducts.length > 0) {
      return res.status(400).json({
        message: "Không thể xóa style vì có sản phẩm liên kết với style này",
      });
    }

    // Đánh dấu style là đã xóa (soft delete)
    style.isDelete = true;
    await style.save();

    res.status(200).json({ message: "Xóa style thành công" });
  } catch (err) {
    console.error("Lỗi khi xóa style:", err);
    res.status(500).json({ message: "Lỗi khi xóa style", error: err });
  }
};

// CHƯA SEARCH
// const getStyles = async (req, res) => {
//   try {
//     const { page, limit } = req.query;

//     if (page && limit) {
//       // Nếu có page và limit, thực hiện phân trang
//       const skip = (parseInt(page) - 1) * parseInt(limit); // Tính số mục cần bỏ qua

//       const [styles, total] = await Promise.all([
//         Style.find({ isDelete: false }) // Lấy danh sách style chưa bị xóa
//           .skip(skip)
//           .limit(parseInt(limit)),
//         Style.countDocuments({ isDelete: false }) // Đếm tổng số style chưa bị xóa
//       ]);

//       res.status(200).json({
//         success: true,
//         styles,
//         total,
//         page: parseInt(page),
//         totalPages: Math.ceil(total / parseInt(limit)), // Tính tổng số trang
//       });
//     } else {
//       // Nếu không có page hoặc limit, lấy tất cả styles
//       const styles = await Style.find({ isDelete: false });

//       res.status(200).json({
//         success: true,
//         styles,
//         total: styles.length,
//         page: 1,
//         limit: styles.length,
//         totalPages: 1, // Không phân trang, tổng số trang là 1
//       });
//     }
//   } catch (err) {
//     return res.status(500).json({ message: 'Lỗi khi lấy style', error: err });
//   }
// };

const getStyles = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const query = { isDelete: false };
    if (search) {
      query.name = { $regex: search, $options: "i" }; // Case-insensitive search
    }

    if (page && limit) {
      const skip = (parseInt(page) - 1) * parseInt(limit); // Calculate number of items to skip

      const [styles, total] = await Promise.all([
        Style.find(query) // Fetch styles that match the query
          .skip(skip)
          .limit(parseInt(limit)),
        Style.countDocuments(query) // Count total styles that match the query
      ]);

      res.status(200).json({
        success: true,
        styles,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)), // Calculate total pages
      });
    } else {
      // If no page or limit, fetch all styles
      const styles = await Style.find(query);

      res.status(200).json({
        success: true,
        styles,
        total: styles.length,
        page: 1,
        limit: styles.length,
        totalPages: 1, // Single page if no pagination
      });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Error fetching styles', error: err });
  }
};


// Lấy style theo ID
const getStyleById = async (req, res) => {
  try {
    const { styleId } = req.params;
    const style = await Style.findById(styleId);

    if (!style) {
      return res.status(404).json({ message: 'Style không tìm thấy' });
    }

    return res.status(200).json({ style });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi lấy style', error: err });
  }
};

module.exports = { addStyle, updateStyle, updateStatus, deleteStyle, getStyles, getStyleById };
