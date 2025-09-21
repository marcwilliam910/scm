import ProductModel, {Categories} from "../models/product";
import {RequestHandler} from "express";
import cloudinaryUploader, {cloudinaryApi} from "../cloudinary";
import {UploadApiResponse} from "cloudinary";
import {isValidObjectId} from "mongoose";
import {User} from "../models/user";
import mongoose from "mongoose";

type Product = {
  id: string;
  name: string;
  price: string;
  purchasingDate: string;
  category: string;
  description: string;
  images: {
    url: string;
    id: string;
  }[];
  thumbnail: string;
  seller: {
    id: string;
    name: string;
    avatar: any;
  };
};

function imageUploader(filepath: string): Promise<UploadApiResponse> {
  return cloudinaryUploader.upload(filepath, {
    folder: `products`,
    width: 1280,
    height: 720,
    crop: "fill",
  });
}

export const createtNewProduct: RequestHandler = async (req, res) => {
  const {name, price, purchasingDate, category, description} = req.body.fields;
  const {images} = req.body.files;

  if (!name || !price || !purchasingDate || !category || !description)
    return res.status(400).json({message: "All fields are required"});

  let invalidImageType = false;
  const isMultipleImages = Array.isArray(images);

  if (isMultipleImages && images.length > 5) {
    return res.status(400).json({
      message: "You can upload a maximum of 5 images",
    });
  }

  if (isMultipleImages) {
    for (const img of images) {
      if (!img.mimetype.startsWith("image/")) {
        invalidImageType = true;
        break;
      }
    }
  } else {
    if (!images.mimetype.startsWith("image/")) {
      invalidImageType = true;
    }
  }

  if (invalidImageType) {
    return res.status(400).json({
      message: "Invalid file type, must be an image",
    });
  }

  const newProduct: any = new ProductModel({
    owner: req.body.user.id,
    name,
    price,
    purchasingDate,
    category,
    description,
  });

  if (isMultipleImages) {
    const uploadPromises = images.map((img) => imageUploader(img.filepath));
    const uploadedImages = await Promise.all(uploadPromises);
    newProduct.images = uploadedImages.map((img) => ({
      url: img.secure_url,
      id: img.public_id,
    }));
    newProduct.thumbnail = newProduct.images[0].url;
  } else {
    const uploadedImage = await imageUploader(images.filepath);
    newProduct.images = [
      {url: uploadedImage.secure_url, id: uploadedImage.public_id},
    ];
    newProduct.thumbnail = newProduct.images[0].url;
  }

  await newProduct.save();

  const formattedProduct: Product = {
    id: newProduct._id.toString(),
    name: newProduct.name,
    price: newProduct.price.toString(),
    purchasingDate: newProduct.purchasingDate.toISOString(),
    category: newProduct.category,
    description: newProduct.description,
    images: newProduct.images,
    thumbnail: newProduct.thumbnail,
    seller: {
      id: req.body.user.id,
      name: req.body.user.name,
      avatar: {
        url: req.body.user.avatar.url,
        id: req.body.user.avatar.id,
      },
    },
  };

  res
    .status(201)
    .json({message: "Product successfully created", product: formattedProduct});
};

export const updateProduct: RequestHandler = async (req, res) => {
  const {name, price, purchasingDate, category, description, thumbnail} =
    req.body.fields;

  const {id} = req.params;

  if (!id) return res.status(400).json({message: "Product ID is required"});
  if (!isValidObjectId(id))
    return res.status(400).json({message: "Invalid Product ID"});

  const product = await ProductModel.findOneAndUpdate(
    {_id: id, owner: new mongoose.Types.ObjectId(req.body.user.id)},
    {
      name,
      price: price ? Number(price) : undefined,
      purchasingDate: purchasingDate ? new Date(purchasingDate) : undefined,
      category,
      description,
    },
    {new: true}
  );

  if (!product) return res.status(404).json({message: "Product not found"});
  let needsSave = false;

  if (thumbnail) {
    product.thumbnail = thumbnail;
    needsSave = true;
  }

  const {images} = req.body.files;

  // Only process images if they exist
  if (images) {
    const isMultipleImages = Array.isArray(images);

    // Check if adding new images would exceed limit
    const newImageCount = isMultipleImages ? images.length : 1;
    const imageCount = product.images?.length || 0;
    if (imageCount + newImageCount > 5) {
      return res.status(400).json({
        message: "You can upload a maximum of 5 images total",
      });
    }

    // Validate image types
    let invalidImageType = false;
    if (isMultipleImages) {
      for (const img of images) {
        if (!img.mimetype.startsWith("image/")) {
          invalidImageType = true;
          break;
        }
      }
    } else {
      if (!images.mimetype.startsWith("image/")) {
        invalidImageType = true;
      }
    }

    if (invalidImageType) {
      return res.status(400).json({
        message: "Invalid file type, must be an image",
      });
    }

    // Upload and add images
    if (isMultipleImages) {
      const uploadPromises = images.map((img) => imageUploader(img.filepath));
      const uploadedImages = await Promise.all(uploadPromises);
      const updatedImages = uploadedImages.map((img) => ({
        url: img.secure_url,
        id: img.public_id,
      }));
      if (product.images) product.images.push(...updatedImages);
      else product.images = updatedImages;
    } else {
      const uploadedImage = await imageUploader(images.filepath);
      if (product.images)
        product.images.push({
          url: uploadedImage.secure_url,
          id: uploadedImage.public_id,
        });
      else
        product.images = [
          {url: uploadedImage.secure_url, id: uploadedImage.public_id},
        ];
    }

    // set thumbnail if there is no thumbnail
    if (thumbnail === "" || !thumbnail)
      product.thumbnail = product.images[0].url;

    needsSave = true;
  }

  if (needsSave) {
    await product.save();
  }

  res.status(200).json({
    message: "Product successfully updated",
    updatedProduct: product,
  });
};

export const deleteProduct: RequestHandler = async (req, res) => {
  const {id} = req.params;

  if (!id) return res.status(400).json({message: "Product ID is required"});
  if (!isValidObjectId(id))
    return res.status(400).json({message: "Invalid Product ID"});

  const product = await ProductModel.findOneAndDelete({
    _id: id,
    owner: req.body.user.id,
  });

  if (!product) return res.status(404).json({message: "Product not found"});

  //   loop images id here
  if (product.images && product.images.length > 0) {
    const ids = product.images.map((img) => img.id);
    await cloudinaryApi.delete_resources(ids);
  }

  res.status(204).json({message: "Product successfully deleted"});
};

export const deleteProductImage: RequestHandler = async (req, res) => {
  const {productId, imageId} = req.params;

  if (!productId && !imageId)
    return res
      .status(400)
      .json({message: "Product ID and Image ID is required"});
  if (!isValidObjectId(productId))
    return res.status(400).json({message: "Invalid Product ID"});

  const product = await ProductModel.findOneAndUpdate(
    {
      _id: productId,
      owner: req.body.user.id,
    },
    {
      $pull: {
        images: {
          id: imageId,
        },
      },
    },
    {
      new: true,
    }
  );

  if (!product) return res.status(404).json({message: "Product not found"});

  if (product.thumbnail?.includes(imageId)) {
    const images = product.images;
    if (images && images.length > 0) product.thumbnail = images[0].url;
    else product.thumbnail = "";
    await product.save();
  }

  await cloudinaryUploader.destroy(imageId);

  res.status(200).json({message: "Image successfully deleted", product});
};

export const getProductDetail: RequestHandler = async (req, res) => {
  const {id} = req.params;

  if (!id) return res.status(400).json({message: "Product ID is required"});
  if (!isValidObjectId(id))
    return res.status(400).json({message: "Invalid Product ID"});

  const product = await ProductModel.findById(id).populate<{owner: User}>(
    "owner"
  );

  if (!product) return res.status(404).json({message: "Product not found"});

  const returnProduct = {
    id: product._id,
    name: product.name,
    price: product.price,
    purchasingDate: product.purchasingDate,
    category: product.category,
    description: product.description,
    images: product.images?.map(({url}) => url),
    thumbnail: product.thumbnail,
    seller: {
      id: product.owner._id,
      name: product.owner.name,
      avatar: product.owner.avatar?.url,
    },
  };

  res.status(200).json({
    message: "Product found",
    product: returnProduct,
  });
};

export const getProductsByCategory: RequestHandler = async (req, res) => {
  const {category} = req.params;
  const {page = "1", limit = "10"} = req.query;

  if (!category) return res.status(400).json({message: "Category is required"});
  if (!Categories.includes(category))
    return res.status(400).json({message: "Invalid category"});

  const products = await ProductModel.find({category})
    .sort("-createdAt")
    .skip((+page - 1) * +limit)
    .limit(+limit);

  const listings = products.map((product) => ({
    id: product._id,
    name: product.name,
    price: product.price,
    purchasingDate: product.purchasingDate,
    category: product.category,
    description: product.description,
  }));

  res.status(200).json({
    message: "Products found",
    products: listings,
  });
};

export const getLatestProducts: RequestHandler = async (req, res) => {
  const {page = "1", limit = "10"} = req.query;

  const products = await ProductModel.find()
    .populate<{owner: User}>("owner")
    .sort("-createdAt")
    .skip((+page - 1) * +limit)
    .limit(+limit);

  const listings = products.map((product) => ({
    id: product._id,
    name: product.name,
    price: product.price,
    purchasingDate: product.purchasingDate,
    category: product.category,
    description: product.description,
    images: product.images,
    thumbnail: product.thumbnail || "",
    seller: {
      id: product.owner._id,
      name: product.owner.name,
      avatar: {
        url: product.owner.avatar?.url,
        id: product.owner.avatar?.id,
      },
    },
  }));

  res.status(200).json({
    products: listings,
  });
};

export const getListings: RequestHandler = async (req, res) => {
  const {page = "1", limit = "10"} = req.query;
  const user = req.body.user;

  const products = await ProductModel.find({owner: user.id})
    .sort("-createdAt")
    .skip((+page - 1) * +limit)
    .limit(+limit);

  const listings = products.map((product) => ({
    id: product._id,
    name: product.name,
    price: product.price,
    purchasingDate: product.purchasingDate,
    category: product.category,
    description: product.description,
    images: product.images,
    thumbnail: product.thumbnail || "",
    seller: {
      id: user.id,
      name: user.name,
      avatar: {
        url: user.avatar?.url,
        id: user.avatar?.id,
      },
    },
  }));

  res.status(200).json({
    products: listings,
  });
};

export const searchProduct: RequestHandler = async (req, res) => {
  const {query} = req.query as {query: string};

  if (query.trim() === "") res.status(200).json({products: []});
  const products = (await ProductModel.find({
    name: {$regex: query, $options: "i"},
  }).populate<{owner: User}>({path: "owner", select: "name avatar"})) as any[];

  const formattedProduct: Product[] = products.map((product) => ({
    id: product._id,
    name: product.name,
    price: product.price,
    purchasingDate: product.purchasingDate,
    category: product.category,
    description: product.description,
    images: product.images,
    thumbnail: product.thumbnail || "",
    seller: {
      id: product.owner._id,
      name: product.owner.name,
      avatar: {
        url: product.owner.avatar?.url,
        id: product.owner.avatar?.id,
      },
    },
  }));

  res.status(200).json({products: formattedProduct});
};
