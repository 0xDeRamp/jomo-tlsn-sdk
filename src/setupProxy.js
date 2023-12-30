module.exports = function (app) {
  app.use(function (req, res, next) {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  });
};