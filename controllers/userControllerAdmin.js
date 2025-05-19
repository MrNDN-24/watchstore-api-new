const User = require('../models/User');
const bcrypt = require("bcrypt");
// Thêm người dùng mới
exports.createUser = async (req, res) => {
    try {
      const { username, name, email, password, phone, role, avatar } = req.body;
  
      // Kiểm tra xem người dùng đã tồn tại chưa
      const existingUser = await User.findOne({ $or: [{ email }, { username }] });
      if (existingUser) {
        return res.status(400).json({ message: 'Tên đăng nhập hoặc email đã tồn tại' });
      }
  
      // Nếu không có mật khẩu, tạo mật khẩu mặc định
      const defaultPassword = password || '123456'; // Thay đổi mật khẩu mặc định nếu cần
  
      // Tạo người dùng mới
      const user = new User({
        username,
        name,
        email,
        password: defaultPassword,
        phone,
        role,
        avatar
      });
  
      await user.save();
      res.status(201).json({ message: 'Người dùng đã được tạo thành công', user });
    } catch (error) {
      res.status(500).json({ message: 'Có lỗi xảy ra', error });
    }
  };
  

// Sửa thông tin người dùng
exports.updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, phone, role, avatar, isActive } = req.body;

    // Kiểm tra người dùng có tồn tại không và không phải là customer
    const user = await User.findById(userId);
    if (!user || user.role === 'customer') {
      return res.status(400).json({ message: 'Không thể sửa người dùng này' });
    }

    // Cập nhật thông tin người dùng
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.role = role || user.role;
    user.avatar = avatar || user.avatar;
    user.isActive = isActive !== undefined ? isActive : user.isActive;

    await user.save();
    res.status(200).json({ message: 'Thông tin người dùng đã được cập nhật', user });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
};

// Xóa người dùng
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Kiểm tra người dùng có tồn tại không và không phải là customer
    const user = await User.findById(userId);
    if (!user || user.role === 'customer') {
      return res.status(400).json({ message: 'Không thể xóa người dùng này' });
    }

    // Xóa người dùng
    user.isDelete = true;
    await user.save();
    res.status(200).json({ message: 'Người dùng đã bị xóa' });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
};
  
// exports.getAllUsers = async (req, res) => {
//   try {
//     if (!req.user) {
//       return res.status(401).json({ message: 'Thông tin người dùng không hợp lệ' });
//     }

//     console.log('Người dùng từ req.user:', req.user);

//     const currentAdminId = req.user.id; // Lấy ID của admin hiện tại

//     const { page = 1, limit = 5 } = req.query; // Lấy tham số page và limit từ query
//     const skip = (page - 1) * limit; // Tính số mục cần bỏ qua

//     const [users, total] = await Promise.all([
//       User.find({
//         _id: { $ne: currentAdminId },
//         role: { $ne: 'customer' },
//       })
//         .skip(skip)
//         .limit(parseInt(limit)), // Thêm skip và limit để phân trang
//       User.countDocuments({
//         _id: { $ne: currentAdminId },
//         role: { $ne: 'customer' },
//       }), // Đếm tổng số người dùng thỏa mãn điều kiện
//     ]);

//     res.status(200).json({
//       users,
//       total,
//       page: parseInt(page),
//       totalPages: Math.ceil(total / limit),
//     });
//   } catch (error) {
//     console.error('Lỗi:', error);
//     res.status(500).json({ message: 'Có lỗi xảy ra', error: error.message });
//   }
// };
exports.getAllUsers = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Thông tin người dùng không hợp lệ' });
    }

    const currentAdminId = req.user.id; // Lấy ID của admin hiện tại
    const { page = 1, limit = 5, search } = req.query; // Lấy tham số page, limit và search từ query

    const query = { 
      _id: { $ne: currentAdminId },
      role: { $ne: 'customer' },
    };

    if (search) {
      query.name = { $regex: search, $options: "i" }; // Tìm kiếm không phân biệt hoa thường
    }

    if (page && limit) {
      const skip = (page - 1) * limit;

      const totalUsers = await User.countDocuments(query);
      const users = await User.find(query).skip(skip).limit(parseInt(limit));

      res.status(200).json({
        success: true,
        total: totalUsers,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalUsers / limit),
        users,
      });
    } else {
      const users = await User.find(query);

      res.status(200).json({
        success: true,
        total: users.length,
        page: 1,
        limit: users.length,
        totalPages: 1,
        users,
      });
    }
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
};

// Lấy thông tin người dùng theo ID
exports.getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'Người dùng không tồn tại' });
    }

    res.status(200).json({ message: 'Thông tin người dùng', user });
  } catch (error) {
    res.status(500).json({ message: 'Có lỗi xảy ra', error });
  }
};

exports.updateUserById = async (req, res) => {
  try {
    const {userId}  = req.params;
    const { name, phone, email } = req.body;

    let avatarUrl;
    if (req.file && req.file.path) {
      avatarUrl = req.file.path; // Nếu có ảnh mới từ Cloudinary
    } else {
      const existingUser = await User.findById(userId);
      avatarUrl = existingUser ? existingUser.avatar : null;
    }

    const updatedFields = { name, phone, email, updated_at: Date.now() };
    if (avatarUrl) updatedFields.avatar = avatarUrl;
   
    const updatedUser = await User.findByIdAndUpdate(userId, updatedFields, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    } 

    res.status(200).json({ message: "Thông tin người dùng đã được cập nhật", user: updatedUser });
  } catch (error) {
    console.error("Error in updateUserById:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật thông tin người dùng" });
  }
};


exports.updatePassword = async (req, res) => {
  try {
    const { userId } = req.params;
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "Người dùng không tồn tại" });
    }

    // Kiểm tra mật khẩu hiện tại
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Mật khẩu hiện tại không đúng" });
    }

    // Cập nhật mật khẩu mới (middleware sẽ tự động băm mật khẩu)
    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Mật khẩu đã được cập nhật thành công" });
  } catch (error) {
    console.error("Error in updatePassword:", error);
    res.status(500).json({ error: "Có lỗi xảy ra khi cập nhật mật khẩu" });
  }
};


