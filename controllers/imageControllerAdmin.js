
const Product = require('../models/Product');
const ProductImage = require('../models/ProductImage');

exports.addImage = async (req, res) => {
    try {
        const { productId } = req.body;
        let imageUrl = null;

        if (req.file && req.file.path) {
            imageUrl = req.file.path;
        }

        // Tạo mới hình ảnh
        const newImage = new ProductImage({
            image_url: imageUrl,
            description: req.body.description,
            isPrimary: req.body.isPrimary || false
        });

        await newImage.save();
        console.log("New image saved:", newImage);

        // Cập nhật product với image_ids mới
        const product = await Product.findById(productId);
        if (product) {
            product.image_ids.push(newImage._id);
            await product.save();
            console.log("Product updated with new image ID:", product);
        } else {
            return res.status(404).json({ error: "Product not found" });
        }

        res.status(201).json(newImage);
    } catch (error) {
        console.error("Error in addImage:", error);
        res.status(500).json({ error: "Failed to upload image" });
    }
};



exports.getImagesByProduct = async (req, res) => {
    try {
        const productId = req.params.productId;
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ error: "Product not found" });
        }

        // Lấy tất cả hình ảnh của sản phẩm từ ProductImage
        const images = await ProductImage.find({ 
            _id: { $in: product.image_ids }, // Truy vấn những hình ảnh có _id nằm trong image_ids của sản phẩm
            isDelete: false 
        });

        res.status(200).json(images);
    } catch (error) {
        console.error("Error in getImagesByProduct:", error);
        res.status(500).json({ error: "Failed to fetch images" });
    }
};

exports.deleteImage = async (req, res) => {
    try {
        const imageId = req.params.id;
        
        // Cập nhật trạng thái isDelete của hình ảnh
        const updatedImage = await ProductImage.findByIdAndUpdate(imageId, { isDelete: true }, { new: true });

        if (!updatedImage) {
            return res.status(404).json({ error: "Image not found" });
        }

        const product = await Product.findOne({ image_ids: imageId });
        if (product) {
            product.image_ids.pull(imageId);  
            await product.save();
        }

        res.status(200).json({ message: "Image marked as deleted successfully" });
    } catch (error) {
        console.error("Error in deleteImage:", error);
        res.status(500).json({ error: "Failed to delete image" });
    }
};

exports.updateImage = async (req, res) => {
    try {
        const imageId = req.params.id;
        const { description, isPrimary } = req.body;
        let imageUrl;
        if (req.file && req.file.path) {
            imageUrl = req.file.path;  
        } else {
            const existingImage = await ProductImage.findById(imageId);
            imageUrl = existingImage ? existingImage.image_url : null;
        }
        // if (isPrimary) {
        //     const primaryImage = await ProductImage.findOne({ isPrimary: true });
        //     if (primaryImage && primaryImage._id.toString() !== imageId) {
        //         // return res.status(400).json({ error: "Only one image can be primary. Please set another image as non-primary before setting this one as primary." });
        //         console.log("Only one image can be primary. Please set another image as non-primary before setting this one as primary.");
        //         return;  
        //     }
        // }
        if (isPrimary) {
            const imageToUpdate = await ProductImage.findById(imageId);
            const primaryImage = await ProductImage.findOne({
                isPrimary: true,
                _id: { $ne: imageId }, // Không tính ảnh đang chỉnh sửa
                _id: { $in: imageToUpdate.product_id ? [imageToUpdate.product_id] : [] }, // Chỉ kiểm tra trong ảnh thuộc cùng sản phẩm
            });
        
            if (primaryImage) {
                return res.status(400).json({ 
                    error: "Only one image can be primary for a product. Please set another image as non-primary first." 
                });
            }
        }

        const updatedFields = { description, isPrimary };
        if (imageUrl) updatedFields.image_url = imageUrl;

        const updatedImage = await ProductImage.findByIdAndUpdate(imageId, updatedFields, { new: true });

        if (!updatedImage) {
            return res.status(404).json({ error: "Image not found" });
        }

        res.status(200).json(updatedImage);
    } catch (error) {
        console.error("Error in updateImage:", error);
        res.status(500).json({ error: "Failed to update image" });
    }
};
