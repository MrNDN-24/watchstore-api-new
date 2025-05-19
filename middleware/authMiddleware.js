const jwt = require('jsonwebtoken');
const User= require("../models/User");
// Middleware để kiểm tra token
// exports.authMiddleware = (req, res, next) => {
//   const token = req.header('Authorization')?.split(' ')[1];
//   if (!token) {
//     return res.status(401).json({ message: 'No token provided, authorization denied' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     req.user = decoded; // Gán thông tin người dùng vào req để sử dụng trong các route tiếp theo
//     next();
//   } catch (err) {
//     return res.status(401).json({ message: 'Token is not valid', error: err.message }); // Thêm thông tin lỗi
//   }
// };



// Middleware để kiểm tra token
exports.authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Gán thông tin người dùng vào req để sử dụng trong các route tiếp theo
    next();
  } catch (err) {
    // Kiểm tra lỗi nếu token đã hết hạn
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired', error: err.message });
    }
    // Xử lý lỗi khác như token không hợp lệ
    return res.status(401).json({ message: 'Token is not valid', error: err.message });
  }
};

// exports.verifyUser = async (req, res, next) => {
//   const token = req.header("Authorization")?.replace("Bearer ", "");
//   const data = jwt.verify(token, process.env.JWT_SECRET);
//   console.log(data);
//   try {
//     const user = await User.findById(data.id);
//     if (!user) {
//       res.status(404).send({ error: "Không tìm thấy user" });
//     }
//     req.user = user;
//     req.token = token;
//     // console.log(token);
//     // console.log(data);
//     // console.log("User", user);
//     next();
//   } catch (error) {
//     res.status(401).send({ error: "Not authorized to access this resource" });
//   }
// };
exports.verifyUser = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  
  try {
    const data = jwt.verify(token, process.env.JWT_SECRET);
    console.log(data);

    const user = await User.findById(data.id);
    if (!user) {
      return res.status(404).send({ error: "Không tìm thấy user" });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    // Kiểm tra lỗi nếu token hết hạn
    if (error.name === 'TokenExpiredError') {
      return res.status(401).send({ error: "Token expired, please login again" });
    }
    // Nếu token không hợp lệ hoặc có lỗi khác
    res.status(401).send({ error: "Not authorized to access this resource", details: error.message });
  }
};

exports.formatUserData = (req, res, next) => {
  try {
    // Kiểm tra nếu có updatedUserData trong body
    if (req.body.updatedUserData) {
      // Lấy dữ liệu từ updatedUserData
      const userData = req.body.updatedUserData;

      // Tạo object mới với format mong muốn
      const formattedUserData = {
        _id: userData._id || "",
        username: userData.username || "",
        email: userData.email || "",
        password: userData.password || "",
        isGoogleUser: userData.isGoogleUser || false,
        role: userData.role || "customer",
        avatar: userData.avatar || "",
        createdAt: userData.createdAt || new Date().toISOString(),
        updatedAt: userData.updatedAt || new Date().toISOString(),
        __v: userData.__v || 0,
        name: userData.name || "",
      };

      // Gán lại vào req.body
      req.body = formattedUserData;
    }
    console.log("Request body", req.body);
    next();
  } catch (error) {
    console.error("Error in formatUserData middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Error formatting user data",
    });
  }
};
