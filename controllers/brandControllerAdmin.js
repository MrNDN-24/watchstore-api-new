const Brand = require('../models/Brand');
const Product = require("../models/Product");
exports.addBrand = async (req, res) => {
  try {
    const { name, description } = req.body;
    let imageUrl = null;

    // Kiểm tra nếu ảnh đã tải lên thành công qua Cloudinary
    if (req.file && req.file.path) {
      imageUrl = req.file.path; // URL ảnh từ Cloudinary
    }

    // Tạo thương hiệu mới trong cơ sở dữ liệu
    const newBrand = new Brand({
      name,
      description,
      image_url: imageUrl,
     
    });

    await newBrand.save();
    res.status(201).json(newBrand);
  } catch (error) {
    console.error("Error in addBrand:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};



//CHƯA SEARCH
// exports.getAllBrands = async (req, res) => {
//   try {
//     const page = req.query.page ? parseInt(req.query.page) : null; // Nếu không có `page`, sẽ không phân trang
//     const limit = req.query.limit ? parseInt(req.query.limit) : null; // Nếu không có `limit`, sẽ không phân trang
    
//     if (page && limit) {
//       const skip = (page - 1) * limit;

//       const totalBrands = await Brand.countDocuments({ isDelete: false }); // Tổng số thương hiệu
//       const brands = await Brand.find({ isDelete: false })
//         .skip(skip)
//         .limit(limit);

//       res.status(200).json({
//         success: true,
//         total: totalBrands,
//         page,
//         limit,
//         totalPages: Math.ceil(totalBrands / limit),
//         brands,
//       });
//     } else {
//       // Nếu không có phân trang, lấy tất cả thương hiệu
//       const brands = await Brand.find({ isDelete: false });

//       res.status(200).json({
//         success: true,
//         total: brands.length,
//         page: 1,
//         limit: brands.length,
//         totalPages: 1,
//         brands,
//       });
//     }
//   } catch (error) {
//     console.error("Error in getAllBrands:", error);
//     res.status(500).json({ error: "Failed to fetch brands" });
//   }
// };


//SEARCH
exports.getAllBrands = async (req, res) => {
  try {
    const { page, limit, search } = req.query;

    const query = { isDelete: false };
    if (search) {
      query.name = { $regex: search, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }

    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalBrands = await Brand.countDocuments(query);
      const brands = await Brand.find(query).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        total: totalBrands,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalBrands / limit),
        brands,
      });
    } else {
      const brands = await Brand.find(query);

      res.status(200).json({
        success: true,
        total: brands.length,
        page: 1,
        limit: brands.length,
        totalPages: 1,
        brands,
      });
    }
  } catch (error) {
    console.error("Error in getAllBrands:", error);
    res.status(500).json({ error: "Failed to fetch brands" });
  }
};


exports.updateBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    const { name, description } = req.body;

    let imageUrl;
    if (req.file && req.file.path) {
      imageUrl = req.file.path;  // Nếu có ảnh mới
    } else {
      const existingBrand = await Brand.findById(brandId);
      imageUrl = existingBrand ? existingBrand.image_url : null;
    }

    const updatedFields = { name, description, updated_at: Date.now() };
    if (imageUrl) updatedFields.image_url = imageUrl;

    const updatedBrand = await Brand.findByIdAndUpdate(brandId, updatedFields, { new: true });

    if (!updatedBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.status(200).json(updatedBrand);
  } catch (error) {
    console.error("Error in updateBrand:", error);
    res.status(500).json({ error: "Failed to update brand" });
  }
};

// exports.updateBrandActive = async (req, res) => {
//   try {
    
//     const brandId = req.params.id;
//     const { isActive } = req.body;  // Trạng thái mới của isActive

//     const updatedBrand = await Brand.findByIdAndUpdate(
//       brandId, 
//       { isActive }, 
//       { new: true }
//     );

//     if (!updatedBrand) {
//       return res.status(404).json({ error: "Brand not found" });
//     }

//     res.status(200).json(updatedBrand);
//   } catch (error) {
//     console.error("Error in updateBrandActive:", error);
//     res.status(500).json({ error: "Failed to update brand status" });
//   }
// };
exports.updateBrandActive = async (req, res) => {
  try {
    const brandId = req.params.id;
    const { isActive } = req.body; // Trạng thái mới của isActive

    // Cập nhật trạng thái của brand
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { isActive },
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    // Cập nhật trạng thái của tất cả sản phẩm thuộc brand
    await Product.updateMany(
      { brand_id: brandId }, // Giả sử field liên kết brand trong Product là `brand_id`
      { isActive } // Cập nhật trạng thái `isActive` theo trạng thái của brand
    );

    res.status(200).json({
      message: `Brand and associated products updated successfully`,
      updatedBrand,
    });
  } catch (error) {
    console.error("Error in updateBrandActive:", error);
    res.status(500).json({ error: "Failed to update brand and product status" });
  }
};


// exports.deleteBrand = async (req, res) => {
//   try {
//     const brandId = req.params.id;
//     const updatedBrand = await Brand.findByIdAndUpdate(
//       brandId,
//       { isDelete: true },  // Cập nhật isDelete thành true thay vì xóa hoàn toàn
//       { new: true }
//     );

//     if (!updatedBrand) {
//       return res.status(404).json({ error: "Brand not found" });
//     }

//     res.status(200).json({ message: "Brand marked as deleted successfully" });
//   } catch (error) {
//     console.error("Error in deleteBrand:", error);
//     res.status(500).json({ error: "Failed to delete brand" });
//   }
// };
exports.deleteBrand = async (req, res) => {
  try {
    const brandId = req.params.id;

    // Kiểm tra xem có sản phẩm nào liên kết với thương hiệu không
    const productCount = await Product.countDocuments({ brand_id: brandId });

    if (productCount > 0) {
      return res.status(400).json({ error: "Không thể xóa thương hiệu vì còn sản phẩm liên kết." });
    }

    // Nếu không có sản phẩm liên kết, đánh dấu thương hiệu là đã xóa
    const updatedBrand = await Brand.findByIdAndUpdate(
      brandId,
      { isDelete: true },  // Cập nhật isDelete thành true thay vì xóa hoàn toàn
      { new: true }
    );

    if (!updatedBrand) {
      return res.status(404).json({ error: "Thương hiệu không tồn tại" });
    }

    res.status(200).json({ message: "Thương hiệu đã được đánh dấu là xóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa thương hiệu:", error);
    res.status(500).json({ error: "Không thể xóa thương hiệu" });
  }
};


exports.getBrand = async (req, res) => {
  try {
    const brandId = req.params.id;
    const brand = await Brand.findById(brandId);

    if (!brand) {
      return res.status(404).json({ error: "Brand not found" });
    }

    res.status(200).json(brand);
  } catch (error) {
    console.error("Error in getBrand:", error);
    res.status(500).json({ error: "Failed to fetch brand" });
  }
};
