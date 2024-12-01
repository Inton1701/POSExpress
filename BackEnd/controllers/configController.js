const { configDotenv } = require("dotenv");
const Config = require("../models/Config");
const asyncHandler = require("express-async-handler");

const config ={
    addConfig:asyncHandler( async (req, res) => {
        const { googleID, status} = req.body;
        if(!googleID || !status){
           return res.status(400).json({message:"All fields are required!"})
        } 
        const createConfig = Config.create({googleID: googleID, status: status});
        res.status(201).json({createConfig});
    }), 
    getConfig: asyncHandler(async (req, res) => {
        const config = await Config.findById(req.params.id);
        if (!config) {
            res.status(404);
            throw new Error('Category not found');
        }
        res.status(201).json({ category });
    }),
    editConfig: asyncHandler(async (req, res) => {
        const config = await Config.findById(req.params.id);
        if (!config) {
            res.status(404);
            throw new Error('Config not found');
        }
        config.googleID = req.body.googleID;
        config.status = req.body.status;
        await config.save();
        res.status(200).json({ config });
    })
}