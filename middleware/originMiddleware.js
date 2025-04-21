const ALLOWED_ORIGIN = "https://spinbazar.m108.eu/";

const originMiddleware = (req, res, next) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  if (
    origin !== ALLOWED_ORIGIN &&
    referer?.startsWith(ALLOWED_ORIGIN) !== true
  ) {
    return res.status(403).json({
      message: `Access denied: Invalid origin [${origin}]. `,
      messageHU: `Hozzáférés megtagadva: Érvénytelen kérés [${origin}]`,
    });
  }

  next();
};

module.exports = originMiddleware;
