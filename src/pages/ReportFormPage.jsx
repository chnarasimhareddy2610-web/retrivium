import { useNavigate } from "react-router-dom";
import ReportForm from "../components/ReportForm";
import { useAppData } from "../context/AppDataContext";
import { useAuth } from "../context/AuthContext";
import { createReport, normalizeDbItem } from "../lib/itemService";

export default function ReportFormPage({ mode = "Lost" }) {
  const { addDbItem } = useAppData();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async ({ name, location, description, status, category, imageFile, latitude, longitude, zone }) => {
    const row = await createReport({
      userId: user.id,
      name,
      location,
      description,
      status,
      category,
      imageFile: imageFile || null,
      // Optional GPS position (null when the reporter skipped it / denied it).
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      // Manual fallback zone for map placement when GPS is absent.
      zone: zone || null,
    });

    // Immediately update local state so Browse/Reports reflect the new item
    addDbItem(normalizeDbItem(row));

    // Navigate after a short delay so the success message shows
    setTimeout(() => {
      navigate("/browse");
    }, 1200);
  };

  return (
    <div className="w-full max-w-2xl mx-auto px-4 md:px-6 py-6 pb-24">
      <ReportForm onSubmit={handleSubmit} defaultStatus={mode} />
    </div>
  );
}
