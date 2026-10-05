// one place for the success json shape so all responses look the same
const sendSuccess = (res, statusCode, data) => {
  res.status(statusCode).json({ success: true, data });
};
module.exports = sendSuccess;
