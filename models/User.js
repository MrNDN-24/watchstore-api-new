const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mongooseSequence = require("mongoose-sequence")(mongoose);

const userSchema = new mongoose.Schema(
  {
    userID: { type: Number, unique: true },
    username: {
      type: String,
      required: [true, "Tên đăng nhập là bắt buộc"],
      unique: true,
      minlength: [3, "Tên đăng nhập phải có ít nhất 3 ký tự"],
    },
    name: {
      type: String,
      minlength: [3, "Tên phải có ít nhất 3 ký tự"],
    },
    email: {
      type: String,
      required: [true, "Email là bắt buộc"],
      unique: true,
      match: [/.+\@.+\..+/, "Email không hợp lệ"],
    },
    password: {
      type: String,
      required: function () {
        return !this.isGoogleUser && !this.isFaceBookUser;
      },
      minlength: [6, "Mật khẩu phải có ít nhất 6 ký tự"],
    },
    isGoogleUser: {
      type: Boolean,
      default: false,
    },
    isFaceBookUser: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
    },
    phone: {
      type: String,
      match: [/^[0-9]{10,15}$/, "Số điện thoại không hợp lệ"],
    },
    role: {
      type: String,
      enum: ["admin", "customer", "salesperson", "deliverystaff"],
      default: "customer",
    },
    address_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
    },
    rank: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum", "diamond"],
      default: "bronze",
    },
    totalSpendingLast3Months: {
      type: Number,
      default: 0,
    },

    isDelete: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.plugin(mongooseSequence, { inc_field: "userID" });
// Middleware để băm mật khẩu trước khi lưu
userSchema.pre("save", async function (next) {
  if (this.isModified("password") && !this.isGoogleUser) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Phương thức xác thực mật khẩu
userSchema.methods.comparePassword = function (password) {
  return bcrypt.compare(password, this.password);
};

// Phương thức để tạo token
userSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email },
    process.env.JWT_SECRET,
    { expiresIn: "1h" }
  );
};

module.exports = mongoose.model("User", userSchema);
