export default function Header() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-surface/90 backdrop-blur-xl shadow-[0_1px_8px_rgba(15,23,42,0.04)] pt-safe">
      <div className="h-16 px-margin-mobile flex items-center justify-between gap-space-sm">
        <div className="flex items-center gap-space-xs min-w-0">
          <button
            aria-label="Go back"
            className="min-w-[44px] min-h-[44px] flex items-center justify-center text-on-surface hover:text-primary transition-colors rounded-xl -ml-2"
            onClick={() => window.history.back()}
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          <img
            alt="Retrivium Wordmark Logo"
            className="h-7 w-auto object-contain flex-shrink-0"
            src="https://lh3.googleusercontent.com/aida/AEtjO1WUYf9HgtGH-X7mAiSdSttv2vd08DUxEbTSQgpXH-vZeTZlAa0BDcdsEKq2Txa3eKwN_3Zqf3CoondLtNFus-Q7usUaooFo7zOlr9yFhHuqWfC3FP8ux8QrfS_I_3MDPOGNnibtY_8Q00PSqWBzewIKS5pvfaoqWMjVKIzboiw5d9HDjulcgJaK8X4ABgEoSW_IeybbFZCegKUnuKeednMjkbGcxwfe5Yl4MRoX-fHwyI_TyIWgY7dHwx4"
          />
          <div className="flex flex-col min-w-0">
            <h1 className="font-headline-sm text-headline-sm text-on-surface truncate leading-tight">
              Campus Map & Feed
            </h1>
            <span className="font-label-sm text-label-sm text-on-surface-variant truncate">
              Live lost & found reports across campus
            </span>
          </div>
        </div>
        <div className="flex items-center gap-space-xs flex-shrink-0">
          <img
            alt="Profile"
            className="w-8 h-8 rounded-full object-cover ring-2 ring-surface-container-high"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCp0Wm33AcRQjtTVgqnyiw9zBgoqhR763Z9DUJV2TRbHaM1GcATpnsALInJ_XamsG_ia3BBCAQASZboEeHNz54hUipfmWJ8wGvDSpVj032Ln2oonQlF269UJsRUJexTyq1wX0rmfwsKQ-fObeRlk7V2AHxCkXiUzFh6jUoJicVGbyojmI1plyCsT5NN7ItD8tG7dLkwYqeSM_e0OYdNfy3OVZrxe4ay9p5R8M1zOQ-OgZUzaR-RYdT02Q"
          />
        </div>
      </div>
    </header>
  );
}
