import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";

const config: Config = {
    darkMode: ["class"],
    content: [
        // Código principal dentro de src/
        "./src/app/**/*.{ts,tsx,js,jsx}",
        "./src/components/**/*.{ts,tsx,js,jsx}",
        "./src/context/**/*.{ts,tsx,js,jsx}",
        "./src/hooks/**/*.{ts,tsx,js,jsx}",
        "./src/services/**/*.{ts,tsx,js,jsx}",
        // Si usas lib, utils, o pages legacy:
        "./src/lib/**/*.{ts,tsx,js,jsx}",
        "./src/pages/**/*.{ts,tsx,js,jsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: { "2xl": "1200px" },
        },
        extend: {
            fontFamily: {
                sans: ["var(--font-sans)", ...fontFamily.sans],
                heading: ["var(--font-heading)", ...fontFamily.sans],
            },
            colors: {
                /* tus variables de color… */
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};

export default config;
