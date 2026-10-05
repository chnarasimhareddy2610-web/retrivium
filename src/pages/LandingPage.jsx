import { Link } from "react-router-dom";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="h-16 px-6 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-on-primary font-semibold text-[14px]">R</span>
          </div>
          <span className="font-headline-sm text-headline-sm text-on-surface">Retrivium</span>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/auth/login" className="px-4 py-2 text-body-md text-primary hover:underline font-medium">Log in</Link>
          <Link to="/auth/register" className="px-4 py-2 bg-primary text-on-primary rounded-lg text-body-md font-medium hover:bg-primary-container transition-colors">Register</Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center px-6">
        <div className="max-w-2xl text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-fixed rounded-full mb-6">
            <span className="w-2 h-2 rounded-full bg-primary"></span>
            <span className="font-label-sm text-label-sm text-on-primary-fixed">Campus Recovery Network</span>
          </div>
          <h1 className="text-display-lg text-on-surface mb-4">
            Intelligent Lost & Found for Your Campus
          </h1>
          <p className="text-body-lg text-on-surface-variant max-w-lg mx-auto mb-8">
            Report, track, and recover lost items with smart match detection. Retrivium connects students, staff, and campus security in one unified platform.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/auth/register" className="px-6 py-3 bg-primary text-on-primary rounded-lg text-label-lg font-medium hover:bg-primary-container transition-colors">
              Get Started
            </Link>
            <Link to="/auth/login" className="px-6 py-3 border border-outline-variant text-on-surface rounded-lg text-label-lg font-medium hover:bg-surface-container transition-colors">
              Sign In
            </Link>
          </div>
          <div className="mt-12 grid grid-cols-3 gap-6 text-center">
            <div>
              <p className="text-headline-lg text-primary">1,240+</p>
              <p className="text-body-sm text-on-surface-variant">Students registered</p>
            </div>
            <div>
              <p className="text-headline-lg text-tertiary">142</p>
              <p className="text-body-sm text-on-surface-variant">Items reported</p>
            </div>
            <div>
              <p className="text-headline-lg text-on-surface">34%</p>
              <p className="text-body-sm text-on-surface-variant">Recovery rate</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="h-14 px-6 flex items-center justify-center border-t border-outline-variant/20 text-body-sm text-on-surface-variant">
        2025 Retrivium. Campus Recovery Network.
      </footer>
    </div>
  );
}
