import Image from 'next/image';

export default function About() {
  return (
    <main className="page-shell">
      <section className="hero-surface border-b border-[var(--border-color)] py-12 text-center">
        <h1 className="mb-3 text-4xl font-bold tracking-wide md:text-5xl">
          Perfil profesional
        </h1>
        <div className="mx-auto accent-divider"></div>
        <p className="mt-3 text-sm text-[var(--text-secondary)] md:text-base">
          Trayectoria, experiencia y formación jurídica.
        </p>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="flex justify-center">
            <div className="gold-border w-[260px] transition duration-500 hover:scale-105 md:w-[320px]">
              <Image
                src="/perfil.jpeg"
                alt="Yamil Chacon"
                width={320}
                height={400}
                className="h-full w-full object-cover"
                priority
              />
            </div>
          </div>

          <div className="mx-auto max-w-xl text-center lg:mx-0 lg:text-left">
            <h2 className="mb-2 text-3xl font-bold md:text-4xl">
              Bradly Yamil Chacon Murillo
            </h2>

            <p className="mb-4 text-base font-medium text-[var(--accent)] md:text-lg">
              Abogado y notario público
            </p>

            <p className="mb-6 text-sm leading-relaxed text-[var(--text-secondary)] md:text-base">
              Abogado y notario público con más de 29 años de experiencia en la
              Asamblea Legislativa de Costa Rica. Especialista en derecho
              parlamentario, técnica legislativa, legislación penal, ambiental y
              análisis normativo. Experiencia en redacción de leyes,
              investigaciones jurídicas y apoyo a comisiones legislativas.
            </p>

            <div className="flex flex-wrap justify-center gap-3 lg:justify-start">
              <a
                href="https://wa.me/50687042194"
                target="_blank"
                rel="noopener noreferrer"
                className="primary-button text-sm"
              >
                WhatsApp
              </a>

              <a
                href="mailto:yamil.chaconcr@gmail.com"
                className="secondary-button text-sm"
              >
                Correo
              </a>

              <a
                href="tel:+50687042194"
                className="neutral-button text-sm"
              >
                Llamar
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="section-surface border-y border-[var(--border-color)] py-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h3 className="mb-4 text-2xl font-semibold">
            Experiencia relevante para consultoría
          </h3>

          <div className="mx-auto accent-divider"></div>

          <div className="mt-10 grid gap-10 text-left text-[var(--text-secondary)] md:grid-cols-2">
            <ul className="list-disc space-y-3 pl-5">
              <li>Asesoría en procesos legislativos complejos</li>
              <li>Docencia universitaria en Derecho</li>
              <li>Publicaciones e investigación jurídica</li>
              <li>Elaboración y análisis de proyectos de ley</li>
              <li>Participación en control político</li>
            </ul>

            <ul className="list-disc space-y-3 pl-5">
              <li>Seguridad pública y crimen organizado</li>
              <li>Capacitación a funcionarios públicos</li>
              <li>Impacto del deporte en la sociedad</li>
              <li>Evolución normativa ambiental</li>
            </ul>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16 text-center">
        <h3 className="mb-4 text-2xl font-semibold">Servicios profesionales</h3>

        <div className="mx-auto accent-divider"></div>

        <div className="mt-10 grid gap-10 text-left text-[var(--text-secondary)] md:grid-cols-2">
          <ul className="list-disc space-y-3 pl-5">
            <li>Técnica legislativa y calidad normativa</li>
            <li>Elaboración y revisión de proyectos de ley</li>
            <li>Docencia universitaria especializada</li>
            <li>Capacitación parlamentaria</li>
          </ul>

          <ul className="list-disc space-y-3 pl-5">
            <li>Capacitación en materia agraria y ambiental</li>
            <li>Análisis de políticas públicas en seguridad</li>
            <li>Fortalecimiento institucional</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
