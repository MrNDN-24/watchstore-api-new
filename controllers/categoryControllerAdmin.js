const Category = require('../models/Category');
const Product = require('../models/Product');
// Thêm mới danh mục
const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const newCategory = new Category({ name, description });
    await newCategory.save();
    return res.status(201).json({ message: 'Thêm danh mục thành công', category: newCategory });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi thêm danh mục', error: err });
  }
};

// Sửa danh mục
const updateCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId, 
      { name, description },
      { new: true } // Trả về đối tượng đã được cập nhật
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: 'Danh mục không tìm thấy' });
    }

    return res.status(200).json({ message: 'Cập nhật danh mục thành công', category: updatedCategory });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi cập nhật danh mục', error: err });
  }
};

// Cập nhật trạng thái isActive của danh mục
// const updateStatus = async (req, res) => {
//   try {
//     const { categoryId } = req.params; // lấy categoryId trực tiếp từ tham số URL
//     const { isActive } = req.body;  // Trạng thái mới của isActive

//     const updatedCategory = await Category.findByIdAndUpdate(
//       categoryId, 
//       { isActive }, 
//       { new: true }
//     );

//     if (!updatedCategory) {
//       return res.status(404).json({ error: "Brand not found" });
//     }

//     res.status(200).json(updatedCategory);
//   } catch (error) {
//     console.error("Error in updateBrandActive:", error);
//     res.status(500).json({ error: "Failed to update brand status" });
//   }
// };
const updateStatus = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { isActive } = req.body;

    // Cập nhật trạng thái của category
    const updatedCategory = await Category.findByIdAndUpdate(
      categoryId,
      { isActive },
      { new: true }
    );

    if (!updatedCategory) {
      return res.status(404).json({ message: "Danh mục không tìm thấy." });
    }

    // Cập nhật trạng thái isActive của các sản phẩm liên kết
    await Product.updateMany(
      { category_ids: categoryId },
      { isActive: isActive }
    );

    return res.status(200).json({
      message: `Danh mục và sản phẩm liên kết đã được ${isActive ? "mở" : "khóa"} thành công.`,
      updatedCategory,
    });
  } catch (err) {
    console.error("Lỗi khi cập nhật trạng thái danh mục:", err);
    return res.status(500).json({ message: "Lỗi khi cập nhật trạng thái danh mục.", error: err });
  }
};





// Xóa danh mục (soft delete)
// const deleteCategory = async (req, res) => {
//   try {
//     const { categoryId } = req.params;
//     const category = await Category.findById(categoryId);

//     if (!category) {
//       return res.status(404).json({ message: 'Danh mục không tìm thấy' });
//     }

//     category.isDelete = true; // Mark as deleted (soft delete)
//     await category.save();

//     return res.status(200).json({ message: 'Xóa danh mục thành công' });
//   } catch (err) {
//     return res.status(500).json({ message: 'Lỗi khi xóa danh mục', error: err });
//   }
// };
const deleteCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Kiểm tra nếu có sản phẩm liên kết với category
    const linkedProducts = await Product.find({ category_ids: categoryId, isDelete: false });
    if (linkedProducts.length > 0) {
      return res.status(400).json({ message: "Không thể xóa danh mục vì có sản phẩm liên kết." });
    }

    // Soft delete category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: "Danh mục không tìm thấy." });
    }

    category.isDelete = true;
    await category.save();

    return res.status(200).json({ message: "Xóa danh mục thành công." });
  } catch (err) {
    console.error("Lỗi khi xóa danh mục:", err);
    return res.status(500).json({ message: "Lỗi khi xóa danh mục.", error: err });
  }
};


// API lấy danh mục với phân trang
// const getCategories = async (req, res) => {
//   try {
//     const page = req.query.page ? parseInt(req.query.page) : null; // Nếu không có `page`, không phân trang
//     const limit = req.query.limit ? parseInt(req.query.limit) : null; // Nếu không có `limit`, không phân trang
    
//     if (page && limit) {
//       const skip = (page - 1) * limit;

//       const [categories, total] = await Promise.all([
//         Category.find({ isDelete: false })
//           .skip(skip)
//           .limit(limit),
//         Category.countDocuments({ isDelete: false }),
//       ]);

//       return res.status(200).json({
//         success: true,
//         categories,
//         total,
//         page: parseInt(page),
//         totalPages: Math.ceil(total / limit),
//       });
//     } else {
//       // Nếu không có phân trang, lấy tất cả danh mục
//       const categories = await Category.find({ isDelete: false });

//       return res.status(200).json({
//         success: true,
//         categories,
//         total: categories.length,
//         page: 1,
//         limit: categories.length,
//         totalPages: 1,
//       });
//     }
//   } catch (err) {
//     return res.status(500).json({ message: "Lỗi khi lấy danh mục", error: err });
//   }
// };

const getCategories = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const query = { isDelete: false };
    if (search) {
      query.name = { $regex: search, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }

    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalCategories = await Category.countDocuments(query);
      const categories = await Category.find(query).skip(skip).limit(parseInt(limit));

      res.status(200).json({
        success: true,
        total: totalCategories,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCategories / limit),
        categories,
      });
    } else {
      const categories = await Category.find(query);

      res.status(200).json({
        success: true,
        total: categories.length,
        page: 1,
        limit: categories.length,
        totalPages: 1,
        categories,
      });
    }
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};

// Lấy danh mục theo ID
const getCategoryById = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const category = await Category.findById(categoryId);

    if (!category) {
      return res.status(404).json({ message: 'Danh mục không tìm thấy' });
    }

    return res.status(200).json({ category });
  } catch (err) {
    return res.status(500).json({ message: 'Lỗi khi lấy danh mục', error: err });
  }
};

module.exports = { addCategory, updateCategory, updateStatus, deleteCategory, getCategories, getCategoryById };
