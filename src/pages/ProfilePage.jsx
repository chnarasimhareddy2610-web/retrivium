import { useAuth } from "../context/AuthContext";
import { useAppData } from "../context/AppDataContext";

export default function ProfilePage() {
  const { user, profile, signOut } = useAuth();
  const { currentUser } = useAppData();

  const name = profile?.full_name || user?.user_metadata?.full_name || currentUser.name || "Student User";
  const email = user?.email || currentUser.email || "";
  const role = profile?.role || "Student";
  const department = profile?.department || currentUser.department || "Computer Science & Engineering";
  const year = profile?.year || currentUser.year || "3rd Year";
  const studentId = profile?.student_id || currentUser.studentId || "STU-2026-0001";
  const phone = profile?.phone || currentUser.phone || "+91 98765 43210";

  // Initials fallback
  const getInitials = (n) => {
    if (!n) return "U";
    const parts = n.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return n.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 md:px-6 py-6 pb-24">
      <h1 className="text-display-lg text-on-surface mb-6">Profile Settings</h1>
      
      <div className="bg-surface-container-lowest border border-outline-variant/20 rounded-xl overflow-hidden shadow-sm">
        {/* Header/Banner */}
        <div className="h-24 bg-primary-container relative">
          <div className="absolute -bottom-10 left-6 w-20 h-20 rounded-full border-4 border-surface-container-lowest overflow-hidden bg-primary text-on-primary flex items-center justify-center font-bold text-2xl">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <span>{getInitials(name)}</span>
            )}
          </div>
        </div>
        
        <div className="pt-12 px-6 pb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-headline-lg text-on-surface">{name}</h2>
              <p className="text-body-md text-on-surface-variant flex items-center gap-1.5 mt-1">
                <span className="material-symbols-outlined text-[16px]">school</span>
                {department}, {year}
              </p>
            </div>
            <span className="px-3 py-1 bg-surface-container-high rounded bg-secondary-container text-on-secondary-fixed font-code-sm text-label-md">
              {studentId}
            </span>
          </div>

          <div className="flex flex-col gap-6">
            {/* Contact Info */}
            <section className="flex flex-col gap-3">
              <h3 className="text-label-lg font-semibold text-on-surface border-b border-outline-variant/20 pb-2">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-label-sm text-outline uppercase mb-1">University Email</p>
                  <p className="text-body-md text-on-surface">{email}</p>
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase mb-1">Phone Number</p>
                  <p className="text-body-md text-on-surface">{phone}</p>
                </div>
                <div>
                  <p className="text-label-sm text-outline uppercase mb-1">Role</p>
                  <p className="text-body-md text-on-surface capitalize">{role}</p>
                </div>
              </div>
            </section>

            {/* Notification Preferences */}
            <section className="flex flex-col gap-3">
              <h3 className="text-label-lg font-semibold text-on-surface border-b border-outline-variant/20 pb-2">Notification Preferences</h3>
              <div className="flex flex-col gap-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-body-md text-on-surface">Email Notifications</span>
                    <span className="text-body-sm text-on-surface-variant">Receive alerts for important updates and matches</span>
                  </div>
                  <div className="w-10 h-6 bg-primary rounded-full relative shadow-inner">
                    <div className="w-4 h-4 rounded-full bg-surface-container-lowest absolute top-1 right-1 shadow-sm"></div>
                  </div>
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex flex-col">
                    <span className="text-body-md text-on-surface">SMS Alerts</span>
                    <span className="text-body-sm text-on-surface-variant">Used only for urgent recovery coordination</span>
                  </div>
                  <div className="w-10 h-6 bg-surface-container-high rounded-full relative shadow-inner">
                    <div className="w-4 h-4 rounded-full bg-surface-container-lowest absolute top-1 left-1 shadow-sm"></div>
                  </div>
                </label>
              </div>
            </section>
          </div>
          
          <div className="mt-8 flex justify-end gap-3">
            <button onClick={signOut} className="px-4 py-2 text-error hover:underline font-medium text-label-lg">Sign Out</button>
          </div>
        </div>
      </div>
    </div>
  );
}
