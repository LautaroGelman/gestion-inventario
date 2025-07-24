// src/components/pages/LoginPage.tsx
'use client';

import { useState, useEffect, FormEvent, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { login as apiLogin } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Package,
    ShieldCheck,
    Zap,
    HeartHandshake,
    CircleUserRound,
    Lock,
    Mail
} from 'lucide-react';
import { motion, Variants, useAnimation } from 'framer-motion';

/* --------------------------------------------------------------------------
 * Sistema de partículas
 * -------------------------------------------------------------------------- */
interface Particle {
    id: number;
    x: number;
    y: number;
    size: number;
    delay: number;
}

const SingleParticle = ({ x, y, size, delay }: Omit<Particle, 'id'>) => {
    const controls = useAnimation();

    // Explosión única ➜ rebote lento infinito
    useEffect(() => {
        const run = async () => {
            await controls.start({
                x,
                y,
                scale: 1,
                opacity: 1,
                transition: { duration: 2, delay, ease: 'easeOut' }
            });
            controls.start({
                x: [x - 12, x + 12],
                y: [y - 12, y + 12],
                transition: {
                    duration: 8,
                    ease: 'easeInOut',
                    repeat: Infinity,
                    repeatType: 'mirror'
                }
            });
        };
        run();
    }, [controls, x, y, delay]);

    return (
        <motion.span
            className="absolute left-1/2 top-1/2 rounded-full bg-white/20 backdrop-blur-sm"
            style={{ width: size, height: size }}
            initial={{ scale: 0.3, opacity: 0, x: 0, y: 0 }}
            animate={controls}
        />
    );
};

const FloatingParticles = () => {
    const particles: Particle[] = useMemo(
        () =>
            Array.from({ length: 18 }).map((_, i) => ({
                id: i,
                x: (Math.random() - 0.5) * 1200, // cubren toda la pantalla
                y: (Math.random() - 0.5) * 900,
                size: 6 + Math.random() * 14,
                delay: Math.random() * 0.7
            })),
        []
    );

    return (
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
            {particles.map(({ id, ...rest }) => (
                <SingleParticle key={id} {...rest} />
            ))}
        </div>
    );
};

/* --------------------------------------------------------------------------
 * Variantes de animación
 * -------------------------------------------------------------------------- */
const cardVariant: Variants = {
    hidden: { opacity: 0, scale: 0.92, y: 30 },
    show: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } }
};

const leftContainer: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: { staggerChildren: 0.12, delayChildren: 0.2 }
    }
};

const leftItem: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
};

/* --------------------------------------------------------------------------
 * Página de Login
 * -------------------------------------------------------------------------- */
export default function LoginPage(): JSX.Element {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const { user, loading, login } = useAuth();

    useEffect(() => {
        if (loading) return;
        if (user) router.replace('/');
    }, [user, loading, router]);

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            const response = await apiLogin({ username, password });
            const token = response.data?.token;
            if (!token) throw new Error('No se recibió un token válido.');
            login(token);
        } catch (err: any) {
            const msg =
                err.response?.data?.message || err.message || 'Credenciales inválidas. Por favor, intente de nuevo.';
            console.error(err);
            setError(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (loading || user) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-950 text-white">
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className="relative flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-[#1e1b4b] via-[#312e81] to-[#4f46e5] p-4">
            {/* Partículas de fondo */}
            <FloatingParticles />

            <motion.div
                variants={cardVariant}
                initial="hidden"
                animate="show"
                className="relative w-full max-w-4xl lg:max-w-7xl rounded-2xl bg-black/25 shadow-2xl backdrop-blur-lg lg:grid lg:grid-cols-2"
            >
                {/* Columna izquierda */}
                <motion.div
                    variants={leftContainer}
                    initial="hidden"
                    animate="show"
                    className="relative hidden flex-col justify-between overflow-hidden rounded-l-2xl p-10 text-white lg:flex"
                >
                    {/* Píldora */}
                    <motion.span
                        variants={leftItem}
                        className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm font-medium text-indigo-200"
                    >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
                        Bienvenido de nuevo
                    </motion.span>

                    <div>
                        <motion.div variants={leftItem} className="flex items-center gap-2 text-xl font-semibold">
                            <Package className="h-7 w-7 text-indigo-200" />
                            <span>GES-ERP</span>
                        </motion.div>

                        <motion.h1 variants={leftItem} className="mt-8 text-5xl font-extrabold leading-tight tracking-tight">
                            Accede a tu <br />
                            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Cuenta
              </span>
                        </motion.h1>

                        <motion.p variants={leftItem} className="mt-4 text-lg text-indigo-200">
                            Tu espacio de trabajo digital te espera para continuar impulsando tu negocio.
                        </motion.p>
                    </div>

                    {/* Beneficios */}
                    <div className="relative mt-10 grid grid-cols-3 gap-6 text-center">
                        {[
                            { Icon: ShieldCheck, title: 'Acceso Seguro', desc: 'Seguridad bancaria.' },
                            { Icon: Zap, title: 'Respuesta Rápida', desc: 'Acceso instantáneo.' },
                            { Icon: HeartHandshake, title: 'Diseño Intuitivo', desc: 'Fácil de usar.' }
                        ].map(({ Icon, title, desc }) => (
                            <motion.div key={title} variants={leftItem} className="space-y-2">
                                <Icon className="mx-auto h-8 w-8 text-indigo-300" />
                                <h3 className="font-semibold">{title}</h3>
                                <p className="text-sm text-indigo-200">{desc}</p>
                            </motion.div>
                        ))}
                    </div>

                    {/* Círculo decorativo */}
                    <span className="pointer-events-none absolute -bottom-28 -right-28 h-72 w-72 rounded-full bg-purple-700/20 blur-3xl" />
                </motion.div>

                {/* Columna derecha */}
                <div className="relative flex items-center justify-center overflow-hidden rounded-r-2xl p-8 md:p-12">
                    <div className="relative w-full">
                        <div className="text-center text-white">
                            <CircleUserRound className="mx-auto h-12 w-12 text-indigo-300" />
                            <h2 className="mt-4 text-2xl font-bold">Bienvenido de Nuevo</h2>
                            <p className="text-indigo-200">Por favor, inicia sesión para continuar.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="mt-8 grid gap-6">
                            {/* Usuario */}
                            <div className="grid gap-2 text-white">
                                <Label htmlFor="username">Correo Electrónico</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="username"
                                        type="email"
                                        name="username"
                                        placeholder="nombre@ejemplo.com"
                                        className="border-indigo-400 bg-white/10 pl-10 focus:ring-indigo-400"
                                        required
                                        value={username}
                                        onChange={(e) => setUsername(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Contraseña */}
                            <div className="grid gap-2 text-white">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Contraseña</Label>
                                    <a
                                        href="#"
                                        className="ml-auto inline-block text-sm text-indigo-300 underline hover:text-indigo-200"
                                    >
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                                    <Input
                                        id="password"
                                        type="password"
                                        name="password"
                                        className="border-indigo-400 bg-white/10 pl-10 focus:ring-indigo-400"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            {/* Error */}
                            {error && (
                                <p className="rounded-md bg-red-900/50 p-2 text-center text-sm text-red-400">
                                    {error}
                                </p>
                            )}

                            {/* Botón */}
                            <Button
                                type="submit"
                                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 py-3 text-base font-bold text-white hover:from-purple-600 hover:to-pink-600"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Verificando...' : 'Iniciar Sesión'}
                            </Button>
                        </form>

                        {/* Registro */}
                        <div className="mt-6 text-center text-sm text-indigo-200">
                            ¿No tienes una cuenta?{' '}
                            <a href="#" className="font-semibold text-indigo-100 underline hover:text-white">
                                Regístrate aquí
                            </a>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
