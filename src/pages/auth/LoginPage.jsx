import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

export default function LoginPage({ mode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();

  const isRegister = mode === "register" || location.pathname === "/auth/register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [infoMsg, setInfoMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setInfoMsg("");

    if (!email || !password || (isRegister && !fullName)) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    setLoading(true);

    try {
      if (isRegister) {
        const data = await signUp({ email, password, fullName });
        // If session exists right away (auto-confirm enabled), navigate to dashboard
        if (data?.session) {
          navigate("/dashboard");
        } else {
          setInfoMsg("Registration successful! Please check your email to confirm your account.");
        }
      } else {
        await signIn({ email, password });
        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMsg(err.message || "An error occurred during authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2.5 mb-8 justify-center">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-on-primary font-semibold text-[16px]">R</span>
          </div>
          <span className="font-headline-md text-headline-md text-on-surface">Retrivium</span>
        </div>
        <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl p-6 shadow-sm">
          <h1 className="text-headline-sm text-on-surface mb-1">
            {isRegister ? "Create an Account" : "Welcome back"}
          </h1>
          <p className="text-body-sm text-on-surface-variant mb-6">
            {isRegister
              ? "Register with your campus email to get started"
              : "Sign in to your campus account"}
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-error-container/20 border border-error/30 text-error text-body-sm">
              {errorMsg}
            </div>
          )}

          {infoMsg && (
            <div className="mb-4 p-3 rounded-lg bg-primary-container/20 border border-primary/30 text-primary text-body-sm">
              {infoMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {isRegister && (
              <div>
                <label className="block text-label-lg text-on-surface mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
                />
              </div>
            )}

            <div>
              <label className="block text-label-lg text-on-surface mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                required
                className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-label-lg text-on-surface mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full h-10 px-3 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface text-body-md placeholder:text-outline focus:border-primary focus:outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="h-10 bg-primary text-on-primary rounded-lg text-label-lg font-medium hover:bg-primary-container transition-colors mt-2 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading && <div className="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></div>}
              {isRegister ? "Register" : "Sign In"}
            </button>
          </form>

          <p className="text-body-sm text-on-surface-variant text-center mt-5">
            {isRegister ? (
              <>
                Already have an account?{" "}
                <Link to="/login" className="text-primary font-medium hover:underline">
                  Sign In
                </Link>
              </>
            ) : (
              <>
                No account?{" "}
                <Link to="/auth/register" className="text-primary font-medium hover:underline">
                  Register
                </Link>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
