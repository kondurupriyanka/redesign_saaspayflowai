import { Logo } from './Logo';
import { Mail, Lock, User, ArrowRight, Loader2, Eye, EyeOff, Star, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { BackgroundPaths } from './ui/BackgroundPaths';
import { testimonials } from '@/data/testimonials';
import { signInWithGoogle, supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

export function AuthPage() {
        const navigate = useNavigate();
        const { isAuthenticated, isLoading: authLoading } = useAuth();
        const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
        const [email, setEmail] = useState('');
        const [password, setPassword] = useState('');
        const [fullName, setFullName] = useState('');
        const [isLoading, setIsLoading] = useState(false);
        const [showPassword, setShowPassword] = useState(false);
        const [currentTestimonial, setCurrentTestimonial] = useState(0);
        const [error, setError] = useState<string | null>(null);
        const [confirmationSent, setConfirmationSent] = useState(false);

        // Redirect if already authenticated
        useEffect(() => {
                if (isAuthenticated && !authLoading) {
                        navigate('/dashboard', { replace: true });
                }
        }, [isAuthenticated, authLoading, navigate]);

        // Auto-rotate testimonials every 6 seconds
        useEffect(() => {
                const interval = setInterval(() => {
                        setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
                }, 6000);
                return () => clearInterval(interval);
        }, []);

        const handleGoogleSignIn = async () => {
                setError(null);
                setIsLoading(true);
                try {
                        await signInWithGoogle();
                        // Should redirect to Google, so no need to set loading false
                } catch (err: any) {
                        console.error('Google sign-in error:', err);
                        setError(err.message || 'Failed to sign in with Google. Please try again.');
                        setIsLoading(false);
                }
        };

        const handleAuthSubmit = async (e: React.FormEvent) => {
                e.preventDefault();
                setError(null);
                setIsLoading(true);
                try {
                        if (authMode === 'signup') {
                                const { data, error: signUpError } = await supabase.auth.signUp({
                                        email,
                                        password,
                                        options: {
                                                data: { full_name: fullName },
                                                emailRedirectTo: `${window.location.origin}/auth/callback`,
                                        },
                                });
                                if (signUpError) throw signUpError;
                                if (data.user) {
                                        setConfirmationSent(true);
                                }
                        } else {
                                const { data, error: signInError } = await supabase.auth.signInWithPassword({
                                        email,
                                        password,
                                });
                                if (signInError) throw signInError;
                                if (data.user) {
                                        setTimeout(() => navigate('/dashboard', { replace: true }), 100);
                                }
                        }
                } catch (err: any) {
                        console.error('Auth error:', err);
                        setError(err.message || 'Authentication failed. Please try again.');
                } finally {
                        setIsLoading(false);
                }
        };

        const formErrors = useMemo(() => {
                const errors: Record<string, string> = {};
                if (email && !email.includes('@')) errors.email = 'Invalid email';
                if (authMode === 'signup' && fullName && fullName.length < 2) errors.fullName = 'Name required';
                if (password && password.length < 8) errors.password = 'Min 8 characters';
                return errors;
        }, [authMode, email, password, fullName]);

        const testimonial = testimonials[currentTestimonial];

        if (authLoading) {
                return (
                        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
                                <div className="relative group">
                                        <div className="absolute inset-x-0 bottom-0 bg-primary/20 h-2 -z-10 group-hover:bg-primary/30 transition-colors blur-xl" />
                                        <Loader2 className="w-10 h-10 animate-spin text-primary relative z-10" />
                                </div>
                        </div>
                );
        }

        return (
                <main className="relative min-h-screen w-full bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
                        {/* Animated background gradients */}
                        <BackgroundPaths />
                        
                        {/* Floating gradient orbs */}
                        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl opacity-30 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20 translate-x-1/3 translate-y-1/3 pointer-events-none" />

                        <div className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
                                <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
                                        
                                        {/* LEFT: Testimonials Carousel */}
                                        <div className="order-2 lg:order-1 flex flex-col justify-center">
                                                <div className="space-y-6">
                                                        {/* Testimonial Card - Glassmorphic */}
                                                        <div className="relative">
                                                                {/* Blur background */}
                                                                <div className="absolute inset-0 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl" />
                                                                
                                                                {/* Content */}
                                                                <div className="relative p-8 space-y-6">
                                                                        {/* Star Rating */}
                                                                        <div className="flex gap-1.5">
                                                                                {[...Array(5)].map((_, i) => (
                                                                                        <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                                                                                ))}
                                                                        </div>

                                                                        {/* Testimonial Text */}
                                                                        <p className="text-lg font-medium leading-relaxed text-foreground/90 min-h-24">
                                                                                "{testimonial.feedback}"
                                                                        </p>

                                                                        {/* User Info */}
                                                                        <div className="flex items-center gap-4 pt-4 border-t border-white/10">
                                                                                <img
                                                                                        src={testimonial.avatar}
                                                                                        alt={testimonial.name}
                                                                                        className="w-12 h-12 rounded-full object-cover ring-2 ring-primary/30"
                                                                                />
                                                                                <div className="flex-1">
                                                                                        <p className="font-semibold text-foreground">{testimonial.name}</p>
                                                                                        <p className="text-sm text-muted-foreground">{testimonial.role} • {testimonial.location}</p>
                                                                                </div>
                                                                        </div>
                                                                </div>
                                                        </div>

                                                        {/* Navigation Dots */}
                                                        <div className="flex justify-center gap-2">
                                                                {testimonials.map((_, i) => (
                                                                        <button
                                                                                key={i}
                                                                                onClick={() => setCurrentTestimonial(i)}
                                                                                className={`h-2 rounded-full transition-all duration-300 ${
                                                                                        i === currentTestimonial ? 'w-8 bg-primary' : 'w-2 bg-primary/30 hover:bg-primary/50'
                                                                                }`}
                                                                                aria-label={`Go to testimonial ${i + 1}`}
                                                                        />
                                                                ))}
                                                        </div>
                                                </div>
                                        </div>

                                        {/* RIGHT: Signup Form */}
                                        <div className="order-1 lg:order-2 flex flex-col justify-center">
                                                <div className="space-y-8">

                                                        {/* Email confirmation sent screen */}
                                                        {confirmationSent ? (
                                                                <div className="text-center space-y-6 py-8">
                                                                        <div className="w-16 h-16 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center mx-auto">
                                                                                <CheckCircle2 className="w-8 h-8 text-primary" />
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                                <h2 className="text-3xl font-bold text-white">Check your inbox</h2>
                                                                                <p className="text-white/60 text-base leading-relaxed">
                                                                                        We've sent a confirmation link to<br />
                                                                                        <span className="font-semibold text-white/90">{email}</span>
                                                                                </p>
                                                                                <p className="text-white/40 text-sm">Click the link in the email to activate your account. Check your spam folder if you don't see it.</p>
                                                                        </div>
                                                                        <button
                                                                                onClick={() => { setConfirmationSent(false); setAuthMode('login'); }}
                                                                                className="text-sm text-primary hover:underline font-medium"
                                                                        >
                                                                                Already confirmed? Sign in
                                                                        </button>
                                                                </div>
                                                        ) : (
                                                        <>
                                                        {/* Header */}
                                                        <div className="space-y-4">
                                                                <div className="inline-flex items-center justify-center rounded-2xl bg-primary/10 backdrop-blur-xl border border-primary/20 px-4 py-3">
                                                                        <Logo size="lg" />
                                                                </div>
                                                                <div className="space-y-2">
                                                                        <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
                                                                                {authMode === 'signup' ? 'Get started instantly' : 'Welcome back'}
                                                                        </h1>
                                                                        <p className="text-muted-foreground text-lg">
                                                                                {authMode === 'signup'
                                                                                        ? 'Join 5000+ freelancers getting paid on time'
                                                                                        : 'Access your dashboard'}
                                                                        </p>
                                                                </div>
                                                        </div>

                                                        {/* Error Message */}
                                                        {error && (
                                                                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                                                                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                                                                        <p className="text-sm text-red-500">{error}</p>
                                                                </div>
                                                        )}

                                                        {/* Google Auth Button */}
                                                        <Button 
                                                                type="button"
                                                                onClick={handleGoogleSignIn}
                                                                disabled={isLoading}
                                                                size="lg"
                                                                className="w-full h-12 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold text-base shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl disabled:opacity-50"
                                                        >
                                                                {isLoading ? (
                                                                        <Loader2 className="w-5 h-5 animate-spin" />
                                                                ) : (
                                                                        <>
                                                                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                                                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                                                                </svg>
                                                                                Continue with Google
                                                                        </>
                                                                )}
                                                        </Button>

                                                        {/* Demo Auth Button */}
                                                        {/* Divider */}
                                                        <div className="flex items-center gap-4">
                                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                                                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Or use your account</span>
                                                                <div className="flex-1 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
                                                        </div>

                                                        {/* Form - Glassmorphic */}
                                                        <form onSubmit={handleAuthSubmit} className="space-y-4">
                                                                {authMode === 'signup' && (
                                                                        <div>
                                                                                <label className="text-sm font-medium text-foreground mb-2 block">Full Name</label>
                                                                                <div className="relative">
                                                                                        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                                                                        <Input
                                                                                                placeholder="John Doe"
                                                                                                value={fullName}
                                                                                                onChange={(e) => setFullName(e.target.value)}
                                                                                                className="h-11 pl-12 bg-white/5 border border-white/10 backdrop-blur-sm focus:bg-white/10 focus:border-primary/50 rounded-xl transition-all"
                                                                                                required
                                                                                        />
                                                                                </div>
                                                                                {formErrors.fullName && <p className="text-xs text-red-400 mt-1">{formErrors.fullName}</p>}
                                                                        </div>
                                                                )}

                                                                <div>
                                                                        <label className="text-sm font-medium text-foreground mb-2 block">Email Address</label>
                                                                        <div className="relative">
                                                                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                                                                <Input
                                                                                        placeholder="you@example.com"
                                                                                        type="email"
                                                                                        value={email}
                                                                                        onChange={(e) => setEmail(e.target.value)}
                                                                                        className="h-11 pl-12 bg-white/5 border border-white/10 backdrop-blur-sm focus:bg-white/10 focus:border-primary/50 rounded-xl transition-all"
                                                                                        required
                                                                                />
                                                                        </div>
                                                                        {formErrors.email && <p className="text-xs text-red-400 mt-1">{formErrors.email}</p>}
                                                                </div>

                                                                <div>
                                                                        <label className="text-sm font-medium text-foreground mb-2 block">Password</label>
                                                                        <div className="relative">
                                                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                                                                                <Input
                                                                                        placeholder="••••••••"
                                                                                        type={showPassword ? 'text' : 'password'}
                                                                                        value={password}
                                                                                        onChange={(e) => setPassword(e.target.value)}
                                                                                        className="h-11 pl-12 pr-12 bg-white/5 border border-white/10 backdrop-blur-sm focus:bg-white/10 focus:border-primary/50 rounded-xl transition-all"
                                                                                        required
                                                                                />
                                                                                <button
                                                                                        type="button"
                                                                                        onClick={() => setShowPassword(!showPassword)}
                                                                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                                                                >
                                                                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                                                                </button>
                                                                        </div>
                                                                        {formErrors.password && <p className="text-xs text-red-400 mt-1">{formErrors.password}</p>}
                                                                </div>

                                                                {/* Submit Button */}
                                                                <Button
                                                                        type="submit"
                                                                        disabled={isLoading}
                                                                        className="w-full h-12 mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground font-semibold rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 disabled:opacity-50"
                                                                >
                                                                        {isLoading ? (
                                                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                                        ) : (
                                                                                <div className="flex items-center gap-2">
                                                                                        {authMode === 'signup' ? 'Create Account' : 'Sign In'}
                                                                                        <ArrowRight className="w-4 h-4" />
                                                                                </div>
                                                                        )}
                                                                </Button>
                                                        </form>

                                                        {/* Toggle Auth Mode */}
                                                        <div className="text-center">
                                                                <button
                                                                        onClick={() => {
                                                                                setAuthMode(authMode === 'signup' ? 'login' : 'signup');
                                                                                setEmail('');
                                                                                setPassword('');
                                                                                setFullName('');
                                                                        }}
                                                                        className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                                                                >
                                                                        {authMode === 'signup' ? 'Already have an account?' : 'Need an account?'}{' '}
                                                                        <span className="text-primary font-semibold hover:underline">
                                                                                {authMode === 'signup' ? 'Sign in' : 'Sign up'}
                                                                        </span>
                                                                </button>
                                                        </div>

                                                        {/* Legal Text */}
                                                        <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                                                By continuing, you agree to our{' '}
                                                                <Link to="/terms" className="text-primary hover:underline">
                                                                        Terms of Service
                                                                </Link>{' '}
                                                                and{' '}
                                                                <Link to="/privacy" className="text-primary hover:underline">
                                                                        Privacy Policy
                                                                </Link>
                                                        </p>
                                                        </>
                                                        )}
                                                </div>
                                        </div>
                                </div>
                        </div>
                </main>
        );
}
