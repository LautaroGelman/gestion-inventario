// next.config.js
const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config) {
        // Alias '@' → '<root>/src'
        config.cache = false;
        config.resolve.alias["@"] = path.resolve(__dirname, "src");
        return config;
    },

    // Proxy de /api/* a tu backend para evitar CORS y mantener llamadas relativas
    async rewrites() {
        return [
            {
                source: "/api/:path*",
                destination:
                    process.env.NODE_ENV === "development"
                        ? "http://localhost:8080/api/:path*"      // Tu Spring Boot en dev
                        : "https://api.tu-dominio.com/api/:path*", // API real en producción
            },
        ];
    },
};

module.exports = nextConfig;
