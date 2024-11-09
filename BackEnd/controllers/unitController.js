const Unit = require("../models/Units");
const asyncHandler = require("express-async-handler");

const unitController = {
    // Get all units
    getAllUnits: asyncHandler(async (req, res) => {
        const unitList = await Unit.find();
        res.status(200).json({ unitList });
    }),

    // Add a new unit
    addUnit: asyncHandler(async (req, res) => {
        const { name, abbreviation } = req.body;
        if (!name || !abbreviation) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const createdUnit = await Unit.create({ name, abbreviation });
        res.status(201).json({ createdUnit });
    }),

    // Get unit by ID
    getUnit: asyncHandler(async (req, res) => {
        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            res.status(404).json({ message: "Unit not found" });
            return;
        }
        res.status(200).json({ unit });
    }),

    // Update unit by ID
    editUnit: asyncHandler(async (req, res) => {
        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            res.status(404).json({ message: "Unit not found" });
            return;
        }
        const updatedUnit = await Unit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.status(200).json({ updatedUnit });
    }),

    // Delete unit by ID
    deleteUnit: asyncHandler(async (req, res) => {
        const unit = await Unit.findById(req.params.id);
        if (!unit) {
            res.status(404).json({ message: "Unit not found" });
            return;
        }
        await Unit.deleteOne({ _id: req.params.id });
        res.status(200).json({ message: '${req.params.id} is successfully deleted' });
    })
}

module.exports = unitController;
