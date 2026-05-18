import { routing } from "@/i18n/routing";

export default function RootLocaleRedirect() {
  const base = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
  const target = `${base}/${routing.defaultLocale}/`;
  return (
    <>
      <meta httpEquiv="refresh" content={`0;url=${target}`} />
      <div className="bg-background text-foreground flex min-h-[40vh] flex-col items-center justify-center gap-3 p-8 text-center">
        <p className="text-muted-foreground text-sm">
          <a href={target} className="text-primary font-medium underline">
            {routing.defaultLocale.toUpperCase()}
          </a>
        </p>
        <script
          dangerouslySetInnerHTML={{
            __html: `location.replace(${JSON.stringify(target)});`,
          }}
        />
      </div>
    </>
  );
}
