import {Document, model, Schema} from "mongoose";

export const Categories = [
  "Electronics",
  "Clothing",
  "Shoes",
  "Home & Kitchen",
  "Sports",
  "Beauty",
  "Books",
  "Toys",
  "Groceries",
  "Jewelry",
];

type ProductImage = {
  url: string;
  id: string;
};

interface ProductDocument extends Document {
  owner: Schema.Types.ObjectId;
  name: string;
  price: number;
  purchasingDate: Date;
  category: string;
  description: string;
  images?: ProductImage[];
  thumbnail?: string;
}

const productSchema = new Schema<ProductDocument>(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    purchasingDate: {
      type: Date,
      required: true,
    },
    category: {
      type: String,
      enum: Categories,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    images: [
      {
        url: {
          type: String,
        },
        id: {
          type: String,
        },
        _id: false,
      },
    ],
    thumbnail: String,
  },
  {
    timestamps: true,
  }
);

const ProductModel = model<ProductDocument>("Product", productSchema);
export default ProductModel;
