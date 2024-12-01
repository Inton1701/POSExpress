const mongoose = require('mongoose');
const SubCategory = require('../models/SubCategory');
const Category = require('../models/Category');
const asyncHandler = require('express-async-handler');

const subCategoryController = {
  // Display all subcategories
  getAllSubCategories: asyncHandler(async (req, res) => {
    const subCategoryList = await SubCategory.find().populate('category', 'name'); // Populates category name
    res.status(200).json({ subCategoryList });
  }),

  // Add subcategory
  addSubCategory: asyncHandler(async (req, res) => {
    const { name, abbreviation, category } = req.body;
    if (!name || !abbreviation || !category) {
      return res.status(400).json({ message: "Name, abbreviation, and category are required" });
    }

    // Validate category
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(404).json({ message: "Category not found" });
    }

    const createdSubCategory = await SubCategory.create({ name, abbreviation, category });
    res.status(201).json({ createdSubCategory });
  }),

  // Get a subcategory
  getSubCategory: asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id).populate('category', 'name');
    if (!subCategory) {
      res.status(404);
      throw new Error('Subcategory not found');
    }
    res.status(200).json({ subCategory });
  }),

  // Update a subcategory by ID
  editSubCategory: asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      res.status(404);
      throw new Error('Subcategory not found');
    }

    const updatedSubCategory = await SubCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    ).populate('category', 'name'); // Populate category name on update
    res.status(200).json({ updatedSubCategory });
  }),

  // Delete a subcategory
  deleteSubCategory: asyncHandler(async (req, res) => {
    const subCategory = await SubCategory.findById(req.params.id);
    if (!subCategory) {
      res.status(404);
      throw new Error('Subcategory not found');
    }
    await SubCategory.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: `${req.params.id} is successfully deleted` });
  }),

  // Set subcategory status (active or inactive)
  setSubCategoryStatus: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { isActive } = req.body; // true or false

    // Validate the input
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const subCategory = await SubCategory.findById(id);
    if (!subCategory) {
      res.status(404);
      throw new Error('Subcategory not found');
    }

    // Update the subcategory status
    subCategory.isActive = isActive;
    const updatedSubCategory = await subCategory.save();

    res.status(200).json({
      message: `SubCategory ${isActive ? 'activated' : 'deactivated'}`,
      updatedSubCategory
    });
  })
};

module.exports = subCategoryController;
