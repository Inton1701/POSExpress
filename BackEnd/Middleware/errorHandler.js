const errorHandler =(err, req, res, next)=>{
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.json({meesage: err.message});
}

module.exports = errorHandler;