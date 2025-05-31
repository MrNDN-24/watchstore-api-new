// get
const Product = require("../models/Product"); // Đường dẫn có thể thay đổi tùy cấu trúc dự án
const ProductImage = require("../models/ProductImage");

const createProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    console.log("Sản phẩm đã được tạo:", product);
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAllProducts = async (req, res) => {
  try {
    let { page, limit = 5 } = req.query;
    console.log("Page", page);
    console.log("Limit", limit);

    // Sử dụng `find` để lấy tất cả các sản phẩm, có thể bổ sung thêm các tùy chọn phân trang hoặc sắp xếp nếu cần
    const products = await Product.find()
      .skip(page * limit - limit) // Bỏ qua sản phẩm theo số lượng trang
      .limit(limit)
      .sort({ createdAt: -1 }); // Sắp xếp theo thời gian tạo mới nhất
    // console.log(productsWithPrimaryImage);
    // Tính tổng số sản phẩm để phân trang
    const totalProducts = await Product.countDocuments();

    // Tính số trang tổng cộng
    const pageSize = Math.ceil(totalProducts / limit) || 1;
    // console.log("total product", totalProducts);
    // console.log("page size:", pageSize);
    // console.log("-------------------------------------------------");
    // Trả về danh sách sản phẩm
    res.status(200).json({
      success: true,
      data: {
        content: products, // Danh sách sản phẩm
        pagination: {
          page, // Trang hiện tại
          limit, // Số sản phẩm mỗi trang
          pageSize, // Tổng số trang
          total: totalProducts, // Tổng số sản phẩm
        },
      },
    });

    // res.status(200).json({
    //   success: true,
    //   data: products, // Danh sách sản phẩm
    // });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

const getProducts = async (req, res) => {
  try {
    let {
      page = 1,
      limit = 5,
      name,
      category_ids,
      brand_ids,
      style_ids,
      price,
      sortBy = "sold",
      order = "desc",
    } = req.query;
    console.log("Query: ", req.query);

    // Chuyển đổi sang số
    page = parseInt(page);
    limit = parseInt(limit);

    // Xây dựng điều kiện tìm kiếm
    const condition = {
      isActive: true, // Chỉ lấy sản phẩm đang hoạt động
      isDelete: false, // Lọc sản phẩm chưa bị xóa
      ...(category_ids && {
        category_ids: {
          $in:
            typeof category_ids === "string"
              ? JSON.parse(category_ids)
              : category_ids,
        },
      }),
      ...(brand_ids && {
        brand_id: {
          // Thay vì brand_ids, dùng brand_id để tìm kiếm trong model
          $in:
            typeof brand_ids === "string" ? JSON.parse(brand_ids) : brand_ids, // Chuyển mảng brand_ids thành điều kiện lọc
        },
      }),
      ...(style_ids && {
        style_ids: {
          $in:
            typeof style_ids === "string" ? JSON.parse(style_ids) : style_ids,
        },
      }),
      ...(name && {
        name: {
          $regex: name,
          $options: "i", // Không phân biệt chữ hoa chữ thường
        },
      }),
    };
    if (price) {
      if (price.price_max) {
        condition.price = {
          $lte: price.price_max,
        };
      }
      if (price.price_min) {
        condition.price = condition.price
          ? {
              ...condition.price,
              $gte: price.price_min,
            }
          : {
              $gte: price.price_min,
            };
      }
    }

    // console.log("Price", price.price_min);

    // console.log("Condition: ", condition);

    // Tìm sản phẩm theo các điều kiện đã xây dựng
    const [products, totalProducts] = await Promise.all([
      Product.find(condition)
        .populate("category_ids") // Nếu cần, có thể popuplate các trường liên quan
        .populate("brand_id")
        .populate("style_ids")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sắp xếp theo điều kiện
        .skip((page - 1) * limit) // Phân trang
        .limit(limit),
      Product.countDocuments(condition), // Đếm tổng số sản phẩm
    ]);

    if (!products || products.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    const pageSize = Math.ceil(totalProducts / limit);

    return res.status(200).json({
      success: true,
      message: "Lấy sản phẩm thành công",
      data: {
        content: products,
        pagination: {
          page,
          limit,
          pageSize,
          total: totalProducts,
        },
      },
    });
  } catch (error) {
    console.error("Error in getProducts:", error.stack);
    res.status(500).json({
      message: "Lỗi khi lấy danh sách sản phẩm",
      error: error.message,
    });
  }
};

// const getMainImageProduct = async (product) => {
//   const image = await ProductImage.findById(product.primary_image);
//   // console.log(image);
//   // console.log("Anh chinh", image.image_url);
//   // product.primary_image = image.image_url;
//   // console.log("sp", product.primary_image);

//   // console.log(product);
//   return image.image_url;
// };

const getProductImages = async (req, res) => {
  try {
    const id = req.params.id;
    // console.log(id);
    let product = await Product.findById(id);
    // console.log("Product", product);
    if (!product) {
      res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }
    const ids = product.image_ids;
    // console.log("Image ids:", ids);

    // const images = ids.map(id => ProductImage.findById(id));

    const images = await Promise.all(
      product.image_ids.map(async (id) => {
        const image = await ProductImage.findById(id);
        if (!image) {
          throw new Error(`Không tìm thấy hình ảnh với id: ${id}`);
        }
        return image;
      })
    );

    // console.log("Anh:", images);
    res.status(200).json({
      success: true,
      data: images,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

const getProductById = async (req, res) => {
  try {
    // Sử dụng `find` để lấy tất cả các sản phẩm, có thể bổ sung thêm các tùy chọn phân trang hoặc sắp xếp nếu cần
    const id = req.params.id;
    // console.log(id);
    let product = await Product.findById(id).populate("brand_id");
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy sản phẩm",
      });
    }

    // Trả về danh sách sản phẩm
    return res.status(200).json({
      product,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

// const getProductImages = async (req, res) => {
//   try {
//     // Sử dụng `find` để lấy tất cả các sản phẩm, có thể bổ sung thêm các tùy chọn phân trang hoặc sắp xếp nếu cần
//     const id = req.params.id;
//     // console.log(id);
//     const images = await ProductImage.find({ id });
//     if (!images) {
//       return res.status(404).json({
//         success: false,
//         message: "Không tìm thấy sản phẩm",
//       });
//     }

//     // Trả về danh sách ảnh
//     return res.status(200).json(images);
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       success: false,
//       message: "Lỗi khi lấy danh sách sản phẩm",
//     });
//   }
// };

const getProductChatBot = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true, isDelete: false })
      .populate("brand_id")
      .populate("category_ids")
      .populate("style_ids")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm cho chatbot",
    });
  }
};

const getTopSellingProduct = async (req, res) => {
  try {
    const topProduct = await Product.find({ isActive: true, isDelete: false })
      .sort({ sold: -1 })
      .limit(1)
      .populate({
        path: "image_ids",
        select: "image_url isPrimary -_id",
        match: { isActive: true, isDelete: false, isPrimary: true }, // Chỉ lấy ảnh isPrimary
      })
      .lean();

    if (!topProduct || topProduct.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy sản phẩm bán chạy." });
    }

    res.status(200).json({ data: topProduct[0] });
  } catch (error) {
    console.error("Lỗi khi lấy sản phẩm bán chạy:", error);
    res.status(500).json({ message: "Lỗi server khi lấy sản phẩm bán chạy." });
  }
};

module.exports = {
  getAllProducts,
  getProductById,
  getProductImages,
  getProducts,
  createProduct,
  getProductChatBot,
  getTopSellingProduct,
};
