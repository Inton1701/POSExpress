const Category = require("../models/Category");
const asyncHandler = require("express-async-handler");

const category = {
    // get all categories
    getAllCategories: asyncHandler(async (req, res) => {
        const categoryList = await Category.find();
        res.status(201).json({ categoryList });
    }),

    // add category
    addCategory: asyncHandler(async (req, res) => {
        const { name, description } = req.body;
        if (!name || !description) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const createdCategory = await Category.create({ name: name, description: description });
        res.status(201).json({ createdCategory });
    }),

    // get category by id
    getCategory: asyncHandler(async (req, res) => {
        const category = await Category.findById(req.params.id);
        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }
        res.status(201).json({ category });
    }),

    // update category by id
    editCategory: asyncHandler(async (req, res) => {
        const category = await Category.findById(req.params.id);
        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(201).json({ updatedCategory });
    }),

    // delete category by id
    deleteCategory: asyncHandler(async (req, res) => {
        const category = await Category.findById(req.params.id);
        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }
        await Category.deleteOne({ _id: req.params.id });
        res.status(201).json(`${req.params.id} is successfully deleted`);
    }),

    // set category status (active or inactive)
    setCategoryStatus: asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { isActive } = req.body; // true or false
        
        // Validate the input
        if (typeof isActive !== 'boolean') {
            return res.status(400).json({ message: "isActive must be a boolean" });
        }

        const category = await Category.findById(id);
        if (!category) {
            res.status(404);
            throw new Error('Category not found');
        }

        // Update the category status (on/off)
        category.isActive = isActive;
        const updatedCategory = await category.save();
        
        res.status(200).json({
            message: `Category ${isActive ? 'activated' : 'deactivated'}`,
            updatedCategory
        });
    })
};

module.exports = category;
