export const sendSuccess = (res, data, message = "Success") => {
    return res.status(200).json({
        success: true,
        message,
        data: data || {}, 
        timestamp: new Date().toISOString()
    });
};

export const sendError = (res, error, code = 500) => {
    return res.status(code).json({
        success: false,
        message: error.message || error,
        data: null,
        timestamp: new Date().toISOString()
    });
};
