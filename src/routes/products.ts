import {
  createtNewProduct,
  updateProduct,
  deleteProduct,
  deleteProductImage,
  getProductDetail,
  getListings,
  getLatestProducts,
  getProductsByCategory,
  searchProduct,
} from "@/controllers/product";
import {fileParser} from "@/middlewares/fileParser";
import {validate} from "@/middlewares/validate";
import {productSchema} from "@/utils/validationSchema";
import {Router} from "express";

const router = Router();

router.post("/list", fileParser, validate(productSchema), createtNewProduct);
router.patch("/:id", fileParser, validate(productSchema), updateProduct);
router.delete("/:id", deleteProduct);
router.delete("/:productId/:imageId", deleteProductImage);

router.get("/detail/:id", getProductDetail);
router.get("/by-category/:category", getProductsByCategory);
router.get("/latest", getLatestProducts);
router.get("/listings", getListings);
router.get("/search", searchProduct);

export default router;
