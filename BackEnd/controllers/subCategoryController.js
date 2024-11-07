const SubCategory = require("../models/SubCategory");
const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");

const subcategory = {
    // get all subcategories
    getAllSubcategories: asyncHandler(async (req, res) => {
        const subcategoryList = await Subcategory.find().populate('categoryId', 'name');
        res.status(200).json({ subcategoryList });
    }),

    // gdd subcategory
    addSubcategory: asyncHandler(async (req, res) => {
        const { name, categoryId, description } = req.body;
        if (!name || !categoryId) {
            return res.status(400).json({ message: "Name and category ID are required" });
        }
        
        const categoryExists = await Category.findById(categoryId);
        if (!categoryExists) {
            return res.status(404).json({ message: "Category not found" });
        }

        const createdSubcategory = await Subcategory.create({ name, categoryId, description });
        res.status(201).json({ createdSubcategory });
    }),

    // get subcategory by ID
    getSubcategory: asyncHandler(async (req, res) => {
        const subcategory = await Subcategory.findById(req.params.id).populate('categoryId', 'name');
        if (!subcategory) {
            res.status(404);
            throw new Error("Subcategory not found");
        }
        res.status(200).json({ subcategory });
    }),

    // update subcategory by ID
    editSubcategory: asyncHandler(async (req, res) => {
        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            res.status(404);
            throw new Error("Subcategory not found");
        }

        const updatedSubcategory = await Subcategory.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        ).populate('categoryId', 'name');

        res.status(200).json({ updatedSubcategory });
    }),

    // Delete subcategory by ID
    deleteSubcategory: asyncHandler(async (req, res) => {
        const subcategory = await Subcategory.findById(req.params.id);
        if (!subcategory) {
            res.status(404);
            throw new Error("Subcategory not found");
        }
        
        await Subcategory.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: `${req.params.id} is successfully deleted` });
    })
};

module.exports = subcategory;
