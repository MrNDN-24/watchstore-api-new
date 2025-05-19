const { CloudinaryStorage } = require("multer-storage-cloudinary");
const User = require("../models/User");
const uploadCloud = require("../config/cloudinary");
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate("address_id");
    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUser = async (req, res) => {
  try {
    const users = await User.find().select({ password: 0, __v: 0 }).lean();
    if (users.length > 0) {
      return res.status(200).json(users);
    } else {
      return res.status(404).json({ message: "User not found" });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateUserProfile = async (req, res) => {
  const { _id, name, email, password, avatar, phone } = req.body;
  console.log("Request body", req.body);
  // console.log("Avatar ne`:", avatar);
  const user = await User.findById(_id);
  // console.log(_id);
  if (user) {
    user.name = name || user.name;
    user.email = email || user.email;
    user.updatedAt = Date.now();
    user.password = password || user.password;
    user.phone = phone || user.phone;
    if (avatar) {
      user.avatar = avatar;
    }

    const updatedUser = await user.save();
    // console.log("User cập nhật", user);
    const newToken = await updatedUser.generateAuthToken();
    return res.status(200).json({
      updatedUser,
      token: newToken,
      message: "Cập nhật thành công",
    });
  } else {
    return res.status(404).json({ message: "User not found" });
  }
};

exports.uploadImageToCloudinary = async (req, res) => {
  // try {
  //   const { avatars, documents } = req.files;

  //   res.status(200).json({
  //     message: "Upload successful",
  //     avatars: avatars ? avatars.map((file) => file.path) : [],
  //     documents: documents ? documents.map((file) => file.path) : [],
  //   });
  // } catch (error) {
  //   console.error("Error uploading files:", error.message);
  //   res.status(500).json({ error: error.message });
  // }

  try {

    const fileData = req.file;
    console.log("fileData", fileData.path);
    // console.log("Req:", req.file);
    // console.log("Body:", req.body);
    // uploadCloud.uploader.upload(image, {
    //   uploadpresetL: "watchstore",
    //   allowed_formats: ["png", "jpg", "jpeg", "webp", "svg", "ico", "jfif"],
    // });
    // console.log("Upload thanh cong");
    const avatar = fileData.path;
    return res.status(200).json({ avatar });
  } catch (error) {
    return res.status(500).json("Lỗi sv");
  }
};
