/**
 * 404 Not Found Handler for unregistered API routes
 */
const notFound = (req, res, next) => {
  const error = new Error('Route not found');
  res.status(404);
  next(error);
};

/**
 * Global Error Handling Middleware returning standardized JSON responses
 */
const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  if (err.name === 'ValidationError' || err.name === 'CastError' || err.type === 'entity.parse.failed') statusCode = 400;
  if (err.code === 11000) statusCode = 409;
  if (err.type === 'entity.too.large') statusCode = 413;
  if (statusCode < 400 || statusCode > 599) statusCode = 500;
  if (statusCode >= 500) console.error('[API Error]', err.message);

  res.status(statusCode).json({
    success: false,
    message: process.env.NODE_ENV === 'production' && statusCode >= 500 ? 'Internal Server Error' : (err.message || 'Internal Server Error'),
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = {
  notFound,
  errorHandler
};
