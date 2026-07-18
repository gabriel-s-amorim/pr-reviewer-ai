import Image from "next/image";

const REPO_URL = "https://github.com/gabriel-s-amorim/pr-reviewer-ai";
const PORTFOLIO_URL = "https://gabrielamorimdev.vercel.app/";

export default function Home() {
  return (
    <div className="relative overflow-x-hidden">
      {/* Full-bleed hero atmosphere */}
      <section className="relative min-h-[100svh] overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 hero-grid opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-[-20%] h-[70vh] w-[70vh] rounded-full bg-[radial-gradient(circle,var(--glow),transparent_65%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute right-[-10%] top-[10%] h-[55vh] w-[55vh] rounded-full bg-[radial-gradient(circle,rgba(200,245,168,0.45),transparent_70%)]"
        />

        {/* Dominant visual plane: edge-to-edge review panel silhouette */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 top-[28%] bg-gradient-to-b from-transparent via-[rgba(20,32,28,0.04)] to-[rgba(20,32,28,0.08)]"
        />
        <pre
          aria-hidden
          className="pointer-events-none absolute bottom-0 right-0 hidden max-h-[58%] w-[min(52vw,640px)] overflow-hidden p-8 font-[family-name:var(--font-mono)] text-[11px] leading-5 text-[rgba(20,32,28,0.28)] sm:block lg:text-xs lg:leading-6"
        >
{`## PR Assistant Review
Assessment: needs_attention

diff --git a/src/api/user.ts
@@ -12,6 +12,14 @@
-  return res.json()
+  if (!res.ok) throw new Error(...)
+  return res.json()

⚠ Missing error handling
💡 Naming: prefer descriptive vars
🔒 Avoid logging secrets`}
        </pre>

        <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-6xl flex-col px-6 pb-16 pt-8 sm:px-10">
          <header className="flex items-center justify-between animate-rise">
            <span className="font-[family-name:var(--font-display)] text-lg font-bold tracking-tight text-[var(--ink)] sm:text-xl">
              PR Assistant
            </span>
            <a
              href={REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-xs text-[var(--ink-soft)] transition hover:text-[var(--accent)] sm:text-sm"
            >
              github ↗
            </a>
          </header>

          <div className="flex flex-1 flex-col justify-center py-16 sm:py-20">
            <p className="animate-rise-delay-1 mb-5 font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.22em] text-[var(--accent)] sm:text-sm">
              GitHub App · Claude · Next.js
            </p>

            <h1 className="animate-rise-delay-1 max-w-3xl font-[family-name:var(--font-display)] text-5xl font-extrabold leading-[0.95] tracking-tight text-[var(--ink)] sm:text-7xl lg:text-8xl">
              PR
              <br />
              Assistant
            </h1>

            <p className="animate-rise-delay-2 mt-6 max-w-md text-base leading-relaxed text-[var(--ink-soft)] sm:text-lg">
              Analisa Pull Requests automaticamente e comenta bugs, segurança e
              melhorias — sem PAT, com GitHub App de verdade.
            </p>

            <div className="animate-rise-delay-3 mt-10 flex flex-wrap items-center gap-4">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[var(--ink)] px-6 py-3 text-sm font-semibold text-[var(--paper)] transition duration-300 hover:-translate-y-0.5 hover:bg-[var(--accent-deep)]"
              >
                Ver no GitHub
              </a>
              <a
                href="#como-funciona"
                className="inline-flex items-center rounded-full border border-[var(--line)] bg-white/50 px-6 py-3 text-sm font-semibold text-[var(--ink)] backdrop-blur transition duration-300 hover:-translate-y-0.5 hover:border-[var(--accent)]"
              >
                Como funciona
              </a>
            </div>
          </div>

          <div
            aria-hidden
            className="scanline mx-auto h-px w-full max-w-xl bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent"
          />
        </div>
      </section>

      <section
        id="como-funciona"
        className="relative border-t border-[var(--line)] bg-[var(--mist)] px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <h2 className="max-w-xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            Do webhook ao comentário no PR
          </h2>
          <p className="mt-4 max-w-lg text-[var(--ink-soft)]">
            Um fluxo enxuto, seguro e com controle de custo — feito para
            produção, não para demo frágil.
          </p>

          <ol className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: "01",
                t: "Webhook",
                d: "GitHub envia o evento. Validamos HMAC antes de qualquer coisa.",
              },
              {
                n: "02",
                t: "Diff",
                d: "Installation token busca as mudanças. Lockfiles e binários saem.",
              },
              {
                n: "03",
                t: "Claude",
                d: "Análise em JSON estruturado: bugs, segurança, naming, erros.",
              },
              {
                n: "04",
                t: "Comentário",
                d: "Markdown no PR. Redis evita reanalisar rebase sem mudança real.",
              },
            ].map((step) => (
              <li key={step.n} className="border-t border-[var(--ink)] pt-5">
                <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--accent)]">
                  {step.n}
                </p>
                <h3 className="mt-3 font-[family-name:var(--font-display)] text-2xl font-bold text-[var(--ink)]">
                  {step.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section
        id="resultado-real"
        className="relative border-t border-[var(--line)] px-6 py-24 sm:px-10"
      >
        <div className="mx-auto max-w-6xl">
          <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.22em] text-[var(--accent)]">
            Evidência
          </p>
          <h2 className="mt-3 max-w-2xl font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            Isso não é conceito — é resultado real
          </h2>
          <p className="mt-4 max-w-lg text-[var(--ink-soft)]">
            Fluxo gravado em produção: abrir o PR e receber o review do bot —
            sem mock de interface.
          </p>

          <div className="mt-14 space-y-16">
            <figure className="mx-auto max-w-3xl">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                  01 · Fluxo
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink-soft)]">
                  abrir PR → bot comenta
                </p>
              </div>
              <div className="overflow-hidden rounded-sm border border-[var(--line)] bg-[var(--ink)] shadow-[0_28px_80px_-48px_rgba(20,32,28,0.55)]">
                <video
                  className="h-auto w-full bg-black"
                  src="/pr-assistant-demo.webm"
                  controls
                  muted
                  playsInline
                  preload="metadata"
                  poster="/pr-review-example.png"
                >
                  Seu navegador não suporta vídeo HTML5.
                </video>
              </div>
              <figcaption className="mt-4 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--ink-soft)] sm:text-sm">
                Gravação real: criar o Pull Request e esperar o comentário do
                PR Assistant aparecer na conversa.
              </figcaption>
            </figure>

            <figure className="mx-auto max-w-md sm:max-w-lg">
              <div className="mb-3 flex items-baseline justify-between gap-4">
                <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--accent)]">
                  02 · Comentário
                </p>
                <p className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink-soft)]">
                  review em português
                </p>
              </div>
              <div className="overflow-hidden rounded-sm border border-[var(--line)] bg-white shadow-[0_20px_60px_-40px_rgba(20,32,28,0.4)]">
                <Image
                  src="/pr-review-example.png"
                  alt="Comentário real do PR Assistant num Pull Request de teste"
                  width={800}
                  height={600}
                  className="h-auto w-full"
                  priority={false}
                />
              </div>
              <figcaption className="mt-4 font-[family-name:var(--font-mono)] text-xs leading-relaxed text-[var(--ink-soft)] sm:text-sm">
                PR de teste com falhas intencionais — não é código de produção
                da loja. Validação da análise do bot (Haiku).
              </figcaption>
            </figure>
          </div>
        </div>
      </section>

      <section className="relative border-t border-[var(--line)] bg-[var(--mist)] px-6 py-24 sm:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl">
            Feito como produto real
          </h2>
          <p className="mt-4 max-w-lg text-[var(--ink-soft)]">
            As mesmas escolhas que bots de produção usam — documentadas no
            README.
          </p>

          <ul className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                t: "GitHub App",
                d: "JWT + installation token. Permissões granulares, sem PAT na conta.",
              },
              {
                t: "Custo sob controle",
                d: "Limite de diff, rate limit por repo e dedup no Redis.",
              },
              {
                t: "Deploy serverless",
                d: "Next.js na Vercel, Upstash Redis, Claude via Anthropic API.",
              },
            ].map((item) => (
              <li key={item.t}>
                <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-[var(--ink)]">
                  {item.t}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--ink-soft)]">
                  {item.d}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <footer className="border-t border-[var(--line)] px-6 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-[family-name:var(--font-display)] text-lg font-bold text-[var(--ink)]">
            PR Assistant
          </p>
          <div className="flex flex-col gap-2 sm:items-end">
            <p className="font-[family-name:var(--font-mono)] text-xs text-[var(--ink-soft)]">
              Portfolio · MIT ·{" "}
              <a
                href={REPO_URL}
                className="underline decoration-[var(--line)] underline-offset-4 transition hover:text-[var(--accent)]"
                target="_blank"
                rel="noopener noreferrer"
              >
                gabriel-s-amorim/pr-reviewer-ai
              </a>
            </p>
            <a
              href={PORTFOLIO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-[family-name:var(--font-mono)] text-[11px] text-[var(--ink-soft)]/80 transition hover:text-[var(--accent)]"
            >
              um projeto de Gabriel Amorim ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
