// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Next.js detecta automáticamente la carpeta /app, no hace falta desactivar cache
    webpack(config) {
        // Alias '@' → '<root>/src'
        config.resolve.alias['@'] = path.resolve(__dirname, 'src');
        return config;
    },

    // Proxy de /api/* a tu backend para evitar CORS y mantener llamadas relativas
    async rewrites() {
        return [
            {
                source: '/api/:path*',
                destination:
                    process.env.NODE_ENV === 'development'
                        ? 'http://localhost:8080/api/:path*'                           // dev
                        : `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,            // prod: e.g. https://api.tu-dominio.com
            },
        ];
    },
};

module.exports = nextConfig;
