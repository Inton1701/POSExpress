const Unit = require("../models/Units");
const asyncHandler = require("express-async-handler");

const unitController = {
    // Get all units
    getAllUnits: asyncHandler(async (req, res) => {
        const unitList = await Unit.find({status:{ $ne: 'deleted' }});

        if(!unitList){
            return res.status(404).json({success: false, message: 'Units not found'});
        }
        res.status(200).json({ success: true, unitList });
    }),

    // Add a new unit
    addUnit: asyncHandler(async (req, res) => {
        const { name, shortname } = req.body;
        if (!name || !shortname) {
            return res.status(400).json({ message: "All fields are required" });
        }
        const createdUnit = await Unit.create({ name, shortname });
        res.status(201).json({ success:true, message: 'unit successfully added!',createdUnit });
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
            res.status(404).json({ success: false, message: "Unit not found" });
            return;
        }
        const updatedUnit = await Unit.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        if(!updatedUnit) {
            return res.status(404).json({success: false, message: 'failed to update unit'});
        }
        res.status(200).json({success: true, message: 'unit successfully update!', updatedUnit });
    }),

    softDeleteUnit: asyncHandler(async (req, res) => {
        try {
            const unit = await Unit.findById(req.params.id);

            if (!unit) {
                return res.status(404).json({ success: false, message: "unit not found" });
            }

            unit.status = req.body.status;
            unit.deletedAt = req.body.deletedAt;
            await unit.save();

            res.status(200).json({ success: true, message: "unit deleted successfully" });
        } catch (error) {
            res.status(500).json({ success: false, message: "Error deleting unit", error: error.message });
        }
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
