module.exports = async (req, res) => {
  res.status(200).json({ message: 'hello from serverless function', path: req.url });
};
