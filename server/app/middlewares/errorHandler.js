module.exports = (err, req, res, next) => {
  console.error(err);

  if (res.headersSent) return next(err);

  const status = err.statusCode || 500;
  return res.status(status).json({
    message: err.message || "Server error",
    details: err.details || undefined
  });
};
