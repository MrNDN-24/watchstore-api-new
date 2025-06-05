const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const authMiddleware = require("../middleware/authMiddleware"); // Import middleware
const bcrypt = require("bcrypt");
var nodemailer = require("nodemailer");
const client = new OAuth2Client(process.env.GG_CLIENT_ID);
const axios = require("axios");
const Activity = require("../models/Activity");

// Đăng ký người dùng

exports.register = async (req, res) => {
  const { username, email, password, name, phone } = req.body;

  try {
    const user = new User({ username, email, password, name, phone });
    await user.save();
    res.status(201).json({ message: "Người dùng đã đăng ký thành công" });
  } catch (err) {
    const errors = {};
    if (err.errors) {
      for (let field in err.errors) {
        errors[field] = err.errors[field].message; // Lưu thông báo lỗi cho từng trường
      }
    }
    res.status(400).json({ message: "Đăng ký thất bại", errors });
  }
};

// Đăng nhập người dùng
exports.login = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login", username, password);

  try {
    const user = await User.findOne({ username });

    if (!user || user.isDelete) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa" });
    }

    if (!(await user.comparePassword(password))) {
      return res
        .status(401)
        .json({ message: "Thông tin đăng nhập không hợp lệ" });
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await Activity.create({
      userId: user._id,
      activityType: "login",
      targetModel: "User",
      description: `Người dùng ${
        user.name || user.username
      } đăng nhập vào cửa hàng.`,
    });
    res.status(200).json({ message: "Đăng nhập thành công", token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Đăng nhập qua Google
exports.googleLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Thiếu token Google" });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const { email, name, picture } = ticket.getPayload();

    let user = await User.findOne({ email });

    if (user && user.isDelete) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    if (user && !user.isActive) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa" });
    }

    if (!user) {
      user = new User({
        username: name,
        email,
        avatar: picture,
        isGoogleUser: true,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await Activity.create({
      userId: user._id,
      activityType: "login",
      targetModel: "User",
      description: `Người dùng ${
        user.name || user.username
      } đăng nhập vào cửa hàng.`,
    });
    res.status(200).json({ message: "Đăng nhập thành công", token: jwtToken });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//Login FB
exports.facebookLogin = async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ message: "Thiếu access token Facebook" });
  }

  try {
    // Gọi Facebook Graph API để lấy thông tin user
    const fbResponse = await axios.get(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`
    );

    const { email, name, picture } = fbResponse.data;

    if (!email) {
      return res.status(400).json({
        message: "Không lấy được email từ Facebook, vui lòng cấp quyền email",
      });
    }

    let user = await User.findOne({ email });

    if (user && user.isDelete) {
      return res.status(401).json({ message: "Tài khoản không tồn tại" });
    }

    if (user && !user.isActive) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa" });
    }

    if (!user) {
      user = new User({
        username: name,
        email,
        avatar: picture?.data?.url || "",
        isFaceBookUser: true,
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    await Activity.create({
      userId: user._id,
      activityType: "login",
      targetModel: "User",
      description: `Người dùng ${
        user.name || user.username
      } đăng nhập vào cửa hàng.`,
    });
    res.status(200).json({ message: "Đăng nhập thành công", token: jwtToken });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Lỗi xác thực Facebook" });
  }
};

// exports.adminLogin = async (req, res) => {
//   const { username, password, role } = req.body;

//   try {
//     const user = await User.findOne({ username, role });  // Tìm theo username và role
//     if (!user || !(await user.comparePassword(password))) {
//       return res.status(401).json({ message: "Thông tin đăng nhập không hợp lệ: Tài khoản hoặc mật khẩu sai!" });
//     }

//     // Kiểm tra nếu tài khoản bị xóa
//     if (user.isDelete) {
//       return res.status(403).json({ message: "Tài khoản này không còn tồn tại!" });
//     }

//     // Kiểm tra nếu tài khoản bị khóa
//     if (!user.isActive) {
//       return res.status(403).json({ message: "Tài khoản đang bị khóa!" });
//     }

//     // Kiểm tra vai trò hợp lệ
//     if (!["admin", "salesperson", "deliverystaff"].includes(user.role)) {
//       return res.status(403).json({ message: "Truy cập bị từ chối!" });
//     }

//     const jwtToken = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
//       expiresIn: "1d",
//     });

//     res.status(200).json({
//       message: "Đăng nhập thành công",
//       token: jwtToken,
//       role: user.role,
//       userId: user._id,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
exports.adminLogin = async (req, res) => {
  const { username, password, role } = req.body;

  try {
    const user = await User.findOne({ username, role }); // Tìm theo username và role
    if (!user) {
      return res.status(401).json({
        message: "Tài khoản không tồn tại hoặc vai trò không hợp lệ!",
      });
    }

    if (!(await user.comparePassword(password))) {
      return res.status(401).json({ message: "Sai mật khẩu!" });
    }

    if (user.isDelete) {
      return res
        .status(403)
        .json({ message: "Tài khoản này không còn tồn tại!" });
    }

    if (!user.isActive) {
      return res.status(403).json({ message: "Tài khoản đang bị khóa!" });
    }

    if (!["admin", "salesperson", "deliverystaff"].includes(user.role)) {
      return res
        .status(403)
        .json({ message: "Truy cập bị từ chối: Vai trò không hợp lệ!" });
    }

    const jwtToken = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    return res.status(200).json({
      message: "Đăng nhập thành công",
      token: jwtToken,
      role: user.role,
      userId: user._id,
    });
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ message: "Lỗi hệ thống, vui lòng thử lại!" });
  }
};

exports.sendEmailAdmin = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email, isGoogleUser: false });
    console.log("email", email);

    if (!user) {
      return res
        .status(403)
        .json({ message: "Không tìm thấy email người dùng" });
    }

    const token = jwt.sign({ id: user._id }, "jwt_secret_key", {
      expiresIn: "1d",
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    var mailOptions = {
      from: "violympichongkhoa@gmail.com",
      to: `${user.email}`,
      subject: "Reset Password Link",
      text: `${process.env.REACT_ADMIN_URL}/change-password/${user._id}/${token}`,
    };

    // Gửi email
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ message: "Gửi email thất bại", error: error.message });
      } else {
        // Chỉ gửi response thành công sau khi email đã được gửi thành công
        return res.status(200).json({
          checksend: "Success",
          message: "Link đổi mật khẩu đã được gửi đến email của bạn",
        });
      }
    });
  } catch (error) {
    // Lỗi chung khi thực thi bất kỳ phần nào
    return res.status(500).json({ message: error.message });
  }
};

exports.resetPasswordAdmin = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    // Xác minh token
    const decoded = jwt.verify(token, "jwt_secret_key");
    if (!decoded) {
      return res
        .status(401)
        .json({ status: "Error", message: "Invalid token" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu trong cơ sở dữ liệu
    const updatedUser = await User.findByIdAndUpdate(
      { _id: id },
      { password: hashedPassword },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "Error", message: "User not found" });
    }

    // Thành công
    res
      .status(200)
      .json({ status: "Success", message: "Password reset successfully" });
  } catch (err) {
    // Xử lý lỗi
    if (err.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ status: "Error", message: "Invalid token" });
    }
    res.status(500).json({ status: "Error", message: err.message });
  }
};

exports.sendEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email, isGoogleUser: false });
    if (!user) {
      return res
        .status(403)
        .json({ message: "Không tìm thấy email người dùng" });
    }
    const token = jwt.sign({ id: user._id }, "jwt_secret_key", {
      expiresIn: "1d",
    });

    var transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    var mailOptions = {
      from: "violympichongkhoa@gmail.com",
      to: `${user.email}`,
      subject: "Reset Password Link",
      text: `${process.env.REACT_CLIENT_URL}/reset_password/${user._id}/${token}`,
    };

    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
      } else {
        return res.send({ Status: "Success" });
      }
    });
    res.status(200).json({
      message: "Đăng nhập thành công",
      token: token,
      data: mailOptions,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id, token } = req.params;
    const { password } = req.body;

    // Xác minh token
    const decoded = jwt.verify(token, "jwt_secret_key");
    if (!decoded) {
      return res
        .status(401)
        .json({ status: "Error", message: "Invalid token" });
    }

    // Mã hóa mật khẩu mới
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cập nhật mật khẩu trong cơ sở dữ liệu
    const updatedUser = await User.findByIdAndUpdate(
      { _id: id },
      { password: hashedPassword },
      { new: true } // Trả về tài liệu đã cập nhật
    );

    if (!updatedUser) {
      return res
        .status(404)
        .json({ status: "Error", message: "User not found" });
    }

    // Thành công
    res
      .status(200)
      .json({ status: "Success", message: "Password reset successfully" });
  } catch (err) {
    // Xử lý lỗi token hết hạn hoặc không hợp lệ
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({
        status: "Error",
        message: "Token đã hết hạn",
      });
    }
    if (err.name === "JsonWebTokenError") {
      return res.status(401).json({
        status: "Error",
        message: "Token không hợp lệ",
      });
    }

    // Xử lý các lỗi khác
    return res.status(500).json({
      status: "Error",
      message: err.message,
    });
  }
};

exports.logout = async (req, res) => {
  try {
    const userId = req.user?.id;
    const userName = req.user?.name || "Người dùng";

    // Ghi nhận hoạt động đăng xuất
    if (userId) {
      await Activity.create({
        userId,
        activityType: "logout",
        targetModel: "User",
        description: `${userName} đã đăng xuất.`,
      });
    }

    return res.status(200).json({ message: "Đăng xuất thành công" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi khi đăng xuất", error: error.message });
  }
};
