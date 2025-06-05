const Review = require("../models/Review"); // Import model Review
const Order = require("../models/Order");
const mongoose = require("mongoose");
const Product = require("../models/Product");
const axios = require("axios");
//Hàm chỉnh sửa rating
const updateRating = async (productId) => {
  try {
    // Lấy tất cả các đánh giá chưa bị xóa và còn hoạt động của sản phẩm
    const reviews = await Review.find({
      product_id: productId,
      isActive: true,
      isDelete: false,
    });

    if (reviews.length === 0) {
      // Nếu không có đánh giá, ta đặt rating sản phẩm về 0 hoặc giá trị mặc định khác
      await Product.findByIdAndUpdate(productId, { product_rating: 0 });
      return "No reviews found, product rating set to 0";
    }

    // Tính toán tổng điểm rating
    const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);

    // Tính rating trung bình
    const averageRating = totalRating / reviews.length;

    // Cập nhật product_rating trong product
    await Product.findByIdAndUpdate(productId, {
      product_rating: averageRating,
    });

    return `Product rating updated to ${averageRating}`;
  } catch (err) {
    console.error("Error updating product rating:", err);
    throw new Error("Error updating product rating");
  }
};

// Hàm addReview
const addReview = async (req, res) => {
  try {
    // Lấy user_id từ req.user.id (đã xác thực từ middleware)
    const user_id = req.user.id;

    // Lấy rating và comment từ request body
    const { order_id, rating, comment, product_id } = req.body;

    const order = await Order.findById(order_id);
    console.log("Order", order);


    // Kiểm tra xem rating có hợp lệ hay không (trong khoảng 1-5)
    if (rating < 1 || rating > 5) {
      return res
        .status(400)
        .json({ message: "Rating must be between 1 and 5" });
    }
    // ✅ Gọi Flask API kiểm tra toxic
    const response = await axios.post("https://nhanne24-toxic-comment.hf.space/predict", {
      sentence: comment,
    });

    const isToxic = response.data.toxic;
    if (isToxic === 1) {
      return res.status(400).json({
        message: "Nội dung đánh giá chứa ngôn từ độc hại. Vui lòng chỉnh sửa.",
      });
    }

    await order.markProductAsReviewed(product_id);

    // Tạo một review mới
    const newReview = new Review({
      product_id,
      user_id, // Chuyển đổi user_id thành ObjectId
      rating,
      comment,
    });

    // Lưu review vào cơ sở dữ liệu
    await newReview.save();

    const product = await Product.findById(product_id);
    await product.updateRating();
    // Trả về phản hồi thành công
    return res
      .status(201)
      .json({ message: "Review added successfully", review: newReview });
  } catch (error) {
    // Nếu có lỗi, trả về lỗi
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

const getReviewById = async (req, res) => {
  try {
    // Lấy ID từ request parameters
    const id = req.params.id;
    let { page = 1, limit = 5, sortBy = "rating", order = "desc" } = req.query;

    // Kiểm tra ID có hợp lệ hay không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    // Tìm review theo ID
    const review = await Review.findById(id)
      .populate("user_id")
      .sort({ [sortBy]: order === "desc" ? 1 : -1 }) // Sắp xếp theo điều kiện
      .skip((page - 1) * limit) // Phân trang
      .limit(limit);

    // Kiểm tra nếu không tìm thấy review hoặc review bị xóa
    if (!review || review.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy review",
      });
    }

    // Trả về thông tin review
    return res.status(200).json({
      success: true,
      review,
    });
  } catch (error) {
    console.error("Lỗi khi lấy review:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin review",
    });
  }
};

const getReviewsProduct = async (req, res) => {
  try {
    // Lấy ID từ request parameters
    const id = req.params.id;
    // console.log("Product id", id);

    // Kiểm tra ID có hợp lệ hay không
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "ID không hợp lệ",
      });
    }

    let { page = 1, limit = 5, sortBy = "rating", order = "desc" } = req.query;
    const condition = {
      product_id: id,
      isDelete: false, // Điều kiện chưa bị xóa
    };

    // Tìm review theo product id

    const [reviews, totalReviews] = await Promise.all([
      Review.find(condition)
        .populate("user_id")
        .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sắp xếp theo điều kiện
        .skip((page - 1) * limit) // Phân trang
        .limit(limit),
      Review.countDocuments(condition), // Đếm tổng số sản phẩm
    ]);

    const pageSize = Math.ceil(totalReviews / limit);

    // const review = await Review.find({ product_id: id })
    //   .populate("user_id")
    //   .sort({ [sortBy]: order === "asc" ? 1 : -1 }) // Sắp xếp theo điều kiện
    //   .skip((page - 1) * limit) // Phân trang
    //   .limit(limit);

    // Kiểm tra nếu không tìm thấy review hoặc review bị xóa
    if (!reviews || reviews.isDelete) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy review",
      });
    }

    // Trả về thông tin review
    return res.status(200).json({
      success: true,
      data: {
        content: reviews,
        pagination: {
          page,
          limit,
          pageSize,
          total: totalReviews,
        },
      },
    });
  } catch (error) {
    console.error("Lỗi khi lấy review:", error);
    return res.status(500).json({
      success: false,
      message: "Lỗi khi lấy thông tin review",
    });
  }
};

module.exports = { getReviewById, addReview, getReviewsProduct };
