import ItemOverlaySheet from "./ItemOverlaySheet";

export default function CampusSVGMap({ activeMarkerId, setActiveMarkerId }) {
  const handleMarkerClick = (id) => {
    setActiveMarkerId(id);
    // Usually triggers a map zoom or scrollTo here
  };

  return (
    <div className="relative w-full h-[470px] bg-[#E9EDF5] overflow-hidden select-none">
      {/* SVG Vector Campus Cartography Layout */}
      <svg className="w-full h-full object-cover transition-transform duration-300 ease-out" id="campusCartography" preserveAspectRatio="xMidYMid slice" viewBox="0 0 1000 800" xmlns="http://www.w3.org/2000/svg">
        <rect fill="#E8EDF5" height="800" width="1000"></rect>
        <defs>
          <pattern height="40" id="campusGrid" patternUnits="userSpaceOnUse" width="40">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#DCE2EC" strokeDasharray="2,2" strokeWidth="0.75"></path>
          </pattern>
        </defs>
        <rect fill="url(#campusGrid)" height="800" opacity="0.6" width="1000"></rect>
        <path d="M 120,90 C 240,80 340,110 330,230 C 320,310 180,330 110,270 Z" fill="#D7EAD9" opacity="0.8"></path>
        <path d="M 520,320 C 660,300 760,340 780,480 C 790,560 640,620 540,570 Z" fill="#D7EAD9" opacity="0.8"></path>
        <rect fill="#D7EAD9" height="180" opacity="0.7" rx="16" width="220" x="140" y="490"></rect>
        <path d="M -10,380 L 1020,390" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="26"></path>
        <path d="M -10,380 L 1020,390" stroke="#CBD5E1" strokeDasharray="6,6" strokeWidth="2"></path>
        <path d="M 440,-10 L 460,820" stroke="#FFFFFF" strokeLinecap="round" strokeWidth="28"></path>
        <path d="M 440,-10 L 460,820" stroke="#CBD5E1" strokeDasharray="6,6" strokeWidth="2"></path>
        <path d="M 160,110 L 450,380 L 760,390 L 880,180" fill="none" stroke="#F1F5F9" strokeLinejoin="round" strokeWidth="12"></path>
        <path d="M 230,680 L 450,560 L 680,680" fill="none" stroke="#F1F5F9" strokeLinejoin="round" strokeWidth="12"></path>
        <path d="M 450,380 L 260,540" fill="none" stroke="#F1F5F9" strokeWidth="10"></path>

        <g className="cursor-pointer" id="polyLibrary" onClick={() => handleMarkerClick('cluster-library')}>
          <rect fill="#FFFFFF" height="130" rx="4" stroke="#94A3B8" strokeWidth="1.5" width="170" x="150" y="140"></rect>
          <rect fill="#E2E8F0" height="45" rx="2" width="60" x="165" y="155"></rect>
          <rect fill="#E2E8F0" height="45" rx="2" width="65" x="240" y="155"></rect>
          <text fill="#0F172A" fontFamily="Inter" fontSize="13" fontWeight="600" letterSpacing="-0.2px" textAnchor="middle" x="235" y="245">Central Library</text>
          <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="235" y="259">Library Walk</text>
        </g>
        <g id="polyCS">
          <polygon fill="#FFFFFF" points="560,90 780,90 780,240 680,240 680,210 560,210" stroke="#94A3B8" strokeWidth="1.5"></polygon>
          <rect fill="#EEF2F6" height="70" rx="2" width="70" x="580" y="110"></rect>
          <text fill="#0F172A" fontFamily="Inter" fontSize="12" fontWeight="600" textAnchor="middle" x="670" y="145">Computer Science Block</text>
          <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="670" y="160">North Quad Path</text>
        </g>
        <g className="cursor-pointer" id="polyAuditorium" onClick={() => handleMarkerClick('item-ipad')}>
          <rect fill="#F8FAFC" height="140" rx="6" stroke="#64748B" strokeWidth="2" width="190" x="510" y="380"></rect>
          <path d="M 525,485 L 685,485" stroke="#CBD5E1" strokeLinecap="round" strokeWidth="2"></path>
          <path d="M 545,465 L 665,465" stroke="#CBD5E1" strokeLinecap="round" strokeWidth="2"></path>
          <path d="M 565,445 L 645,445" stroke="#CBD5E1" strokeLinecap="round" strokeWidth="2"></path>
          <text fill="#0F172A" fontFamily="Inter" fontSize="13" fontWeight="600" textAnchor="middle" x="605" y="415">Auditorium</text>
          <text fill="#1D4ED8" fontFamily="Inter" fontSize="9" fontWeight="500" textAnchor="middle" x="605" y="430">University Walkway</text>
        </g>
        <g id="polyCanteen">
          <rect fill="#FFFFFF" height="105" rx="4" stroke="#94A3B8" strokeWidth="1.5" width="160" x="130" y="470"></rect>
          <circle cx="165" cy="510" fill="#F1F5F9" r="14"></circle>
          <circle cx="205" cy="510" fill="#F1F5F9" r="14"></circle>
          <circle cx="245" cy="510" fill="#F1F5F9" r="14"></circle>
          <text fill="#0F172A" fontFamily="Inter" fontSize="12" fontWeight="600" textAnchor="middle" x="210" y="550">Main Canteen</text>
        </g>
        <g id="polySecurity">
          <rect fill="#0B1C30" height="70" rx="3" stroke="#0037B0" strokeWidth="1.5" width="90" x="420" y="330"></rect>
          <text fill="#FFFFFF" fontFamily="Inter" fontSize="10" fontWeight="600" textAnchor="middle" x="465" y="362">Security Desk</text>
          <text fill="#68DBA9" fontFamily="Inter" fontSize="8" textAnchor="middle" x="465" y="376">Rm 104</text>
        </g>
        <g id="polyUnion">
          <rect fill="#FFFFFF" height="120" rx="4" stroke="#94A3B8" strokeWidth="1.5" width="180" x="740" y="520"></rect>
          <text fill="#0F172A" fontFamily="Inter" fontSize="12" fontWeight="600" textAnchor="middle" x="830" y="575">Student Union</text>
          <text fill="#64748B" fontFamily="Inter" fontSize="9" textAnchor="middle" x="830" y="590">Bookstore &amp; Hub</text>
        </g>
        <g id="polyHostels">
          <rect fill="#FFFFFF" height="70" rx="3" stroke="#94A3B8" strokeWidth="1" width="90" x="80" y="650"></rect>
          <rect fill="#FFFFFF" height="70" rx="3" stroke="#94A3B8" strokeWidth="1" width="90" x="190" y="650"></rect>
          <text fill="#475569" fontFamily="Inter" fontSize="11" fontWeight="500" textAnchor="middle" x="180" y="740">Hostels (Blocks A-D)</text>
        </g>
        <g id="userGeolocNode" transform="translate(380, 260)">
          <circle cx="0" cy="0" fill="#2151DA" opacity="0.12" r="32"></circle>
          <circle cx="0" cy="0" fill="#2151DA" opacity="0.25" r="14"></circle>
          <circle cx="0" cy="0" fill="#1D4ED8" r="7" stroke="#FFFFFF" strokeWidth="2.5"></circle>
        </g>
      </svg>

      {/* Map Cartographic Controls */}
      <div className="absolute top-3 right-3 flex flex-col gap-1 z-20">
        <div className="flex flex-col bg-surface-container-lowest rounded-xl shadow-md overflow-hidden">
          <button aria-label="Zoom In" className="w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[19px]">add</span>
          </button>
          <div className="h-px bg-surface-container"></div>
          <button aria-label="Zoom Out" className="w-9 h-9 flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined text-[19px]">remove</span>
          </button>
        </div>
        <button aria-label="Locate Me" className="w-9 h-9 bg-surface-container-lowest rounded-xl shadow-md flex items-center justify-center text-on-surface hover:text-primary hover:bg-surface-container transition-colors" onClick={() => alert('Map centered to your current position: North Quad Walkway (Accuracy +/- 3m)')}>
          <span className="material-symbols-outlined text-[19px] text-primary">my_location</span>
        </button>
        <button aria-label="Reset North" className="w-9 h-9 bg-surface-container-lowest rounded-xl shadow-md flex items-center justify-center text-on-surface hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[19px] text-outline">explore</span>
        </button>
      </div>

      {/* Map Status Overlay Badge */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5 max-w-[240px]">
        <div className="bg-surface-container-lowest/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0"></span>
          <span className="font-label-sm text-label-sm text-on-surface font-semibold truncate leading-tight">Central Campus Grounds</span>
        </div>
        <button className="bg-surface-container-lowest/95 backdrop-blur-sm text-on-surface-variant hover:text-primary px-2.5 py-1 rounded-full shadow-xs flex items-center gap-1.5 hover:bg-surface-container transition-all" onClick={() => alert('Navigating cartography viewport to CS & Tech Tower sector.')}>
          <span className="material-symbols-outlined text-[14px] text-primary">my_location</span>
          <span className="font-label-sm text-[11px]">Centering on your location (near CS Block)</span>
        </button>
      </div>

      {/* Markers */}
      <div 
        className={`absolute cursor-pointer z-10 transition-transform active:scale-95 ${activeMarkerId === 'cluster-library' ? 'scale-110 z-20' : ''}`}
        onClick={() => handleMarkerClick('cluster-library')}
        style={{ left: '23%', top: '22%' }}
      >
        <div className="relative flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center animate-ping absolute"></div>
          <div className="w-9 h-9 rounded-full bg-primary text-on-primary font-headline-sm text-headline-sm font-bold flex items-center justify-center shadow-lg ring-2 ring-surface-container-lowest">
            <span className="text-[13px] font-code-sm tracking-tighter">12</span>
          </div>
          <div className="absolute -bottom-4 bg-surface-container-lowest text-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap">
            Central Library
          </div>
        </div>
      </div>

      <div 
        className={`absolute cursor-pointer z-10 transition-transform hover:scale-110 active:scale-95 ${activeMarkerId === 'item-keys' ? 'scale-110 z-20' : ''}`}
        onClick={() => handleMarkerClick('item-keys')}
        style={{ left: '20%', top: '62%' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-tertiary-container text-on-tertiary flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest">
            <span className="material-symbols-outlined text-[16px]">vpn_key</span>
          </div>
          <div className="w-1.5 h-1.5 bg-tertiary-container rotate-45 -mt-1 shadow-sm"></div>
          <div className="bg-surface-container-lowest text-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded shadow-sm mt-0.5 whitespace-nowrap">
            Keys • Found
          </div>
        </div>
      </div>

      <div 
        className={`absolute cursor-pointer z-10 transition-transform hover:scale-110 active:scale-95 ${activeMarkerId === 'item-hydro' ? 'scale-110 z-20' : ''}`}
        onClick={() => handleMarkerClick('item-hydro')}
        style={{ left: '67%', top: '16%' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-error text-on-error flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest">
            <span className="material-symbols-outlined text-[16px]">help</span>
          </div>
          <div className="w-1.5 h-1.5 bg-error rotate-45 -mt-1 shadow-sm"></div>
          <div className="bg-surface-container-lowest text-on-surface font-label-sm text-[10px] px-1.5 py-0.5 rounded shadow-sm mt-0.5 whitespace-nowrap">
            Lost • Hydro Flask
          </div>
        </div>
      </div>

      <div 
        className={`absolute cursor-pointer z-10 transition-transform hover:scale-110 active:scale-95 ${activeMarkerId === 'item-custody-post' ? 'scale-110 z-20' : ''}`}
        onClick={() => handleMarkerClick('item-custody-post')}
        style={{ left: '45%', top: '41%' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-7 h-7 rounded-full bg-on-background text-tertiary-fixed flex items-center justify-center shadow-md ring-2 ring-surface-container-lowest">
            <span className="material-symbols-outlined text-[16px]">verified_user</span>
          </div>
          <div className="w-1.5 h-1.5 bg-on-background rotate-45 -mt-1 shadow-sm"></div>
        </div>
      </div>

      <div 
        className={`absolute cursor-pointer z-10 transition-transform hover:scale-110 active:scale-95 ${activeMarkerId === 'item-ipad' ? 'scale-110 z-20' : ''}`}
        onClick={() => handleMarkerClick('item-ipad')}
        style={{ left: '59%', top: '49%' }}
      >
        <div className="relative flex flex-col items-center">
          <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-xl ring-2 ring-surface-container-lowest relative z-10">
            <span className="material-symbols-outlined text-[18px]">laptop_mac</span>
          </div>
          <div className="w-2 h-2 bg-primary rotate-45 -mt-1 shadow-sm z-10"></div>
          <div className="bg-primary text-on-primary font-label-sm text-[10px] font-semibold px-2 py-0.5 rounded-full shadow-md mt-0.5 whitespace-nowrap flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary-fixed"></span>
            <span>Silver iPad Air (Auditorium)</span>
          </div>
        </div>
      </div>

      {activeMarkerId && (
        <ItemOverlaySheet activeMarkerId={activeMarkerId} onClose={() => setActiveMarkerId(null)} />
      )}
    </div>
  );
}
