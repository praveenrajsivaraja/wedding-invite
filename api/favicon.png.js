// Simple handler for favicon requests to prevent 404 errors
module.exports = async (req, res) => {
    res.status(204).end(); // No Content - browser will use default favicon
};
