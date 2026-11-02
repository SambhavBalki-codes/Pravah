export const asyncHandler = (theFunction) => (req, res, next) => {
  return Promise.resolve(theFunction(req, res, next)).catch(next);
};