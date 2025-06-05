const Favourite = require("../models/Favourite");

// Lấy danh sách sản phẩm yêu thích
const getFavouritesByUserId = async (req, res) => {
  try {
    const userId = req.user.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "Bạn phải đăng nhập để xem danh sách yêu thích",
      });
    }

    const favourites = await Favourite.find({ user_id: userId }).populate(
      "product_id"
    );
    // Trường hợp không có sản phẩm yêu thích nào
    if (!favourites || favourites.length === 0) {
      return res.status(200).json({
        success: true,
        message: "Người dùng chưa có sản phẩm yêu thích nào",
        data: [],
      });
    }

    return res.status(200).json({
      success: true,
      message: "Lấy danh sách sản phẩm yêu thích thành công",
      data: favourites.map((fav) => fav.product_id),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể lấy danh sách yêu thích",
      error: error.message,
    });
  }
};

const addToFavourite = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;

    console.log("userId", userId);
    console.log("productId", productId);

    const io = req.app.get("io");

    if (!userId || !productId) {
      return res.status(400).json({
        success: false,
        message: "Thông tin không hợp lệ",
      });
    }

    // Tìm document favourite của user
    let favourite = await Favourite.findOne({ user_id: userId });

    console.log("favourite", favourite);

    if (!favourite) {
      // Nếu chưa có document, tạo mới với product_id là mảng chứa productId
      favourite = new Favourite({ user_id: userId, product_id: [productId] });
    } else {
      // Nếu có rồi, kiểm tra xem productId đã tồn tại trong mảng chưa
      if (favourite.product_id.includes(productId)) {
        return res.status(400).json({
          success: false,
          message: "Sản phẩm đã có trong danh sách yêu thích",
        });
      }
      // Thêm productId vào mảng
      favourite.product_id.push(productId);
    }

    await favourite.save();

    io.to(userId).emit("favourite:update", { userId });

    return res.status(201).json({
      success: true,
      message: "Đã thêm sản phẩm vào danh sách yêu thích",
      data: favourite,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể thêm sản phẩm vào yêu thích",
      error: error.message,
    });
  }
};

// Xoá sản phẩm khỏi yêu thích
const removeFromFavourite = async (req, res) => {
  try {
    const userId = req.user.id;
    const productId = req.params.id;
    const io = req.app.get("io");

    // Tìm document favourite của user
    const favourite = await Favourite.findOne({ user_id: userId });

    if (!favourite) {
      return res.status(404).json({
        success: false,
        message: "Danh sách yêu thích không tồn tại",
      });
    }

    // Kiểm tra xem productId có trong mảng không
    if (!favourite.product_id.includes(productId)) {
      return res.status(404).json({
        success: false,
        message: "Sản phẩm không có trong danh sách yêu thích",
      });
    }

    // Loại bỏ productId khỏi mảng product_id
    favourite.product_id = favourite.product_id.filter(
      (id) => id.toString() !== productId
    );

    await favourite.save();

    io.to(userId).emit("favourite:update", { userId });

    return res.status(200).json({
      success: true,
      message: "Đã xoá sản phẩm khỏi danh sách yêu thích",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Không thể xoá sản phẩm khỏi yêu thích",
      error: error.message,
    });
  }
};

module.exports = {
  getFavouritesByUserId,
  addToFavourite,
  removeFromFavourite,
};
