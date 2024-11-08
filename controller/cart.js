const express = require("express");
const User = require("../model/user");
const Cart = require("../model/cart");
const Product = require("../model/product");
const router = express.Router();
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, isAdmin } = require("../middleware/auth");

// Add Product to Cart
router.post(
  "/cart/add",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { productId, quantity } = req.body;

      if (quantity <= 0) {
        return next(
          new ErrorHandler("Quantity must be a positive integer.", 400)
        );
      }

      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        cart = new Cart({ user: req.user._id, products: [] });
      }

      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );

      if (productIndex > -1) {
        cart.products[productIndex].quantity += quantity;
      } else {
        cart.products.push({ product: productId, quantity });
      }

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Product added to cart successfully.",
        cart,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);
// Update Cart
router.put(
  "/cart/update",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { productId, quantity } = req.body;

      if (quantity < 0) {
        return next(
          new ErrorHandler("Quantity must be a non-negative integer.", 400)
        );
      }

      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return next(new ErrorHandler("Cart not found", 404));
      }

      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );
      if (productIndex === -1) {
        return next(new ErrorHandler("Product not found in cart", 404));
      }

      if (quantity === 0) {
        cart.products.splice(productIndex, 1);
      } else {
        cart.products[productIndex].quantity = quantity;
      }

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Cart updated successfully.",
        cart,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);
// Delete Product from Cart
router.delete(
  "/cart/delete",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { productId } = req.body;

      const product = await Product.findById(productId);
      if (!product) {
        return next(new ErrorHandler("Product not found", 404));
      }

      let cart = await Cart.findOne({ user: req.user._id });
      if (!cart) {
        return next(new ErrorHandler("Cart not found", 404));
      }

      const productIndex = cart.products.findIndex(
        (item) => item.product.toString() === productId
      );
      if (productIndex === -1) {
        return next(new ErrorHandler("Product not found in cart", 404));
      }

      cart.products.splice(productIndex, 1);

      await cart.save();

      res.status(200).json({
        success: true,
        message: "Product removed from cart successfully.",
        cart,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);
// Get Cart
router.get(
  "/cart",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    try {
      let cart = await Cart.findOne({ user: req.user._id }).populate(
        "products.product"
      );
      if (!cart || cart.products.length === 0) {
        return res.status(200).json({
          success: true,
          message: "Your cart is empty.",
          cart: [],
        });
      }

      let totalAmount = 0;
      cart.products.forEach((item) => {
        totalAmount += item.product.discountPrice * item.quantity;
      });

      res.status(200).json({
        success: true,
        cart,
        totalAmount,
      });
    } catch (error) {
      return next(new ErrorHandler(error.message || "Server Error", 500));
    }
  })
);
module.exports = router;
