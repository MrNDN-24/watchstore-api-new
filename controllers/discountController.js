const Discount = require("../models/Discount");
const User = require("../models/User");

//1. Lấy danh sách mã giảm giá theo ranks khách hàng
const RANK_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"];

const getDiscounts = async (req, res) => {
  try {
    const currentDate = new Date();
    const { page = 1, limit = 3, type } = req.query;
    const pageNumber = parseInt(page);
    const pageSize = parseInt(limit);

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng." });
    }

    const userRank = user.rank || "bronze";
    const RANK_ORDER = ["bronze", "silver", "gold", "platinum", "diamond"];
    const rankIndex = RANK_ORDER.indexOf(userRank);

    if (rankIndex === -1) {
      return res.status(400).json({ message: "Rank người dùng không hợp lệ." });
    }

    const allowedRanks = RANK_ORDER.slice(0, rankIndex + 1);

    let filter = {
      isActive: true,
      isDelete: false,
      applicableRanks: { $in: allowedRanks },
    };

    if (type === "ongoing") {
      filter.startDate = { $lte: currentDate };
      filter.expirationDate = { $gt: currentDate };
    } else if (type === "upcoming") {
      filter.startDate = { $gt: currentDate };
    } else {
      return res.status(400).json({ message: "Tham số type không hợp lệ." });
    }

    const totalCount = await Discount.countDocuments(filter);

    const discounts = await Discount.find(filter)
      .sort({ startDate: 1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize);

    const totalPages = Math.ceil(totalCount / pageSize);

    res.status(200).json({
      discounts,
      totalPages,
      currentPage: pageNumber,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách mã giảm giá." });
  }
};

// const getDiscounts = async (req, res) => {
//   try {
//     const currentDate = new Date(); // Lấy ngày hiện tại

//     // Truy vấn voucher đang diễn ra
//     const ongoingDiscounts = await Discount.find({
//       isActive: true,
//       isDelete: false, // Không lấy voucher đã bị xóa
//       startDate: { $lte: currentDate }, // Voucher đã bắt đầu (startDate <= hiện tại)
//       expirationDate: { $gt: currentDate }, // Voucher chưa hết hạn (expirationDate > hiện tại)
//     }).sort({ startDate: 1 }); // Sắp xếp theo ngày bắt đầu (tăng dần)

//     // Truy vấn voucher sắp diễn ra (startDate > hiện tại)
//     const upcomingDiscounts = await Discount.find({
//       isDelete: false,
//       isActive: true, // Không lấy voucher đã bị xóa
//       startDate: { $gt: currentDate }, // Voucher chưa bắt đầu (startDate > hiện tại)
//     }).sort({ startDate: 1 }); // Sắp xếp theo ngày bắt đầu (tăng dần)

//     // Trả về 2 loại voucher
//     res.status(200).json({
//       ongoingDiscounts,
//       upcomingDiscounts,
//     });
//   } catch (error) {
//     console.error(error);
//     res
//       .status(500)
//       .json({ message: "Đã có lỗi xảy ra khi lấy danh sách mã giảm giá." });
//   }
// };

// 2. Kiểm tra mã giảm giá có hợp lệ với người dùng không
const validateDiscountForUser = async (req, res) => {
  try {
    const { code } = req.params;
    const userId = req.user.id;

    // Lấy thông tin người dùng để biết rank
    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "Không tìm thấy người dùng." });
    }

    const userRank = user.rank || "bronze";

    const discount = await Discount.findOne({ code, isDelete: false });
    if (!discount) {
      return res
        .status(404)
        .json({ success: false, message: "Mã giảm giá không tồn tại." });
    }

    const isValid = await discount.isValidForUser(userId, userRank);
    if (isValid) {
      res
        .status(200)
        .json({ success: true, message: "Mã giảm giá hợp lệ.", discount });
    } else {
      res.status(400).json({
        success: false,
        message: "Mã giảm giá không hợp lệ cho người dùng này.",
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Đã có lỗi xảy ra khi kiểm tra mã giảm giá.",
    });
  }
};

const rankPriority = {
  bronze: 1,
  silver: 2,
  gold: 3,
  platinum: 4,
  diamond: 5,
};

const getSuitableDiscount = async (req, res) => {
  try {
    const currentDate = new Date();

    if (!req.user || !req.user._id) {
      return res
        .status(401)
        .json({ message: "Không xác định được người dùng." });
    }

    const user = await User.findById(req.user._id);
    console.log("user:", user);
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng." });

    const userRank = user.rank || "bronze";
    const userRankPriority = rankPriority[userRank];

    // Lấy danh sách rank phù hợp với userRank (rankPriority <= userRankPriority)
    const allowedRanks = Object.entries(rankPriority)
      .filter(([rank, priority]) => priority <= userRankPriority)
      .map(([rank]) => rank);

    // Lấy voucher có applicableRanks trong allowedRanks
    const discounts = await Discount.find({
      isActive: true,
      isDelete: false,
      applicableRanks: { $in: allowedRanks },
      startDate: { $lte: currentDate },
      expirationDate: { $gt: currentDate },
      usedBy: { $ne: user._id },
    });
    console.log("allowedRanks:", allowedRanks);
    console.log("discounts:", discounts);

    if (discounts.length === 0) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy mã giảm giá phù hợp." });
    }

    // Sắp xếp ưu tiên theo rank giảm dần (cao nhất trong allowedRanks) và discountValue giảm dần
    discounts.sort((a, b) => {
      const aRanks = Array.isArray(a.applicableRanks) ? a.applicableRanks : [];
      const bRanks = Array.isArray(b.applicableRanks) ? b.applicableRanks : [];

      const aRankPriority = Math.max(
        ...aRanks.map((r) => rankPriority[r] || 0)
      );
      const bRankPriority = Math.max(
        ...bRanks.map((r) => rankPriority[r] || 0)
      );

      const rankDiff = bRankPriority - aRankPriority;
      if (rankDiff !== 0) return rankDiff;

      return b.discountValue - a.discountValue;
    });

    const bestDiscount = discounts[0];

    res.status(200).json({
      message: "Lấy mã giảm giá phù hợp thành công.",
      data: {
        discount: bestDiscount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi khi lấy mã giảm giá." });
  }
};

module.exports = {
  getDiscounts,
  validateDiscountForUser,
  getSuitableDiscount,
};
