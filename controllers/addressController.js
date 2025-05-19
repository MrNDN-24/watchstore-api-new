const User = require("../models/User");
const Address = require("../models/Address");

exports.getUserAddress = async (req, res) => {
  try {
    const id = req.user.id;

    const address = await Address.findOne({ user_id: id });
    console.log("Address", address);
    if (!address) {
      return res.status(404).json({
        success: true,
        message: "Không tìm thấy địa chỉ",
      });
    }
    return res.status(200).json({
      success: true,
      data: address,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Lỗi khi lấy danh sách sản phẩm",
    });
  }
};

// exports.updateUserAddress = async (req, res) => {
//   const { _id, addressLine, district, city, ward } = req.body;

//   const userId = req.user.id;

//   const address = await Address.findById(_id);
//   // console.log(_id);
//   if (address) {
//     address.addressLine = addressLine || address.addressLine;
//     address.district = district || address.district;
//     address.city = city || address.city;
//     address.ward = ward || address.ward;

//     const updatedAddress = await address.save();
//     // console.log("Address cập nhật", address);
//     return res.status(200).json({
//       updatedAddress,
//       message: "Cập nhật thành công",
//     });
//   } else {
//     return res.status(404).json({ message: "Address not found" });
//   }
// };

// exports.updateUserAddress = async (req, res) => {
//   try {
//     const { addressLine, district, city, ward } = req.body;
//     const userId = req.user.id; // Lấy user_id từ req.user.id

//     // Tìm kiếm địa chỉ của user
//     let address = await Address.findOne({ user: userId });

//     if (address) {
//       // Nếu địa chỉ tồn tại, cập nhật thông tin
//       address.addressLine = addressLine || address.addressLine;
//       address.district = district || address.district;
//       address.city = city || address.city;
//       address.ward = ward || address.ward;
//     } else {
//       // Nếu địa chỉ không tồn tại, tạo địa chỉ mới
//       address = new Address({
//         user: userId,
//         addressLine,
//         district,
//         city,
//         ward,
//       });
//     }

//     // Lưu địa chỉ
//     const updatedAddress = await address.save();

//     return res.status(200).json({
//       updatedAddress,
//       message: "Cập nhật thành công",
//     });
//   } catch (error) {
//     console.error(error);
//     return res.status(500).json({
//       message: "Đã có lỗi xảy ra",
//       error: error.message,
//     });
//   }
// };

exports.updateUserAddress = async (req, res) => {
  try {
    const { _id, addressLine, district, city, ward } = req.body; 
    const userId = req.user.id; // Lấy user_id từ req.user.id

    let address;
    if (_id) {
      // Nếu có _id, tìm và cập nhật địa chỉ theo _id
      address = await Address.findById(_id);

      if (!address) {
        return res.status(404).json({
          success: false,
          message: "Địa chỉ không tồn tại",
        });
      }

      // Cập nhật thông tin địa chỉ
      address.addressLine = addressLine || address.addressLine;
      address.district = district || address.district;
      address.city = city || address.city;
      address.ward = ward || address.ward;
    } else {
      // Nếu không có _id, tạo địa chỉ mới
      address = new Address({
        user: userId,
        addressLine,
        district,
        city,
        ward,
      });
    }

    // Lưu địa chỉ
    const updatedAddress = await address.save();

    // Cập nhật trường address_id của user
    await User.findByIdAndUpdate(userId, {
      address_id: updatedAddress._id,
    });

    return res.status(200).json({
      updatedAddress,
      message: "Cập nhật thành công",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Đã có lỗi xảy ra",
      error: error.message,
    });
  }
};
