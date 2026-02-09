const defaultOrigins = [
  "https://inventory-v1-two.vercel.app",
  "http://localhost:3000",
];

const getAllowedOrigins = () => {
  const raw = process.env.CORS_ORIGINS || "";
  const envOrigins = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return envOrigins.length > 0 ? envOrigins : defaultOrigins;
};

const isOriginAllowed = (origin) => {
  const allowedOrigins = getAllowedOrigins();
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  if (process.env.ALLOW_VERCEL_PREVIEW === "true") {
    try {
      const url = new URL(origin);
      if (url.hostname.endsWith(".vercel.app")) {
        return true;
      }
    } catch (error) {
      return false;
    }
  }

  return false;
};

const getCorsOptions = () => ({
  origin: (origin, callback) => {
    if (!origin) {
      return callback(null, true);
    }
    if (isOriginAllowed(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
});

module.exports = {
  getAllowedOrigins,
  getCorsOptions,
  isOriginAllowed
};
