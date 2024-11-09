const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const dotenv = require("dotenv").config();
const routes = require("./routes/routes")
const cors = require('cors')
const errorHandler = require("./Middleware/errorHandler");
const connectDB = require("./config/dbConnection")
const path = require("path");
app.use(cors());
connectDB();
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));
app.use("/", routes);

app.use(errorHandler);

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
})