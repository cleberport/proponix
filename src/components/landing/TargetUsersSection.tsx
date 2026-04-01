import { motion } from 'framer-motion';
import { Music, Camera, Video, Palette, Share2, Code, Building2, Briefcase, PartyPopper } from 'lucide-react';

const fade = {
  hidden: { opacity: 0, y: 20 },
  show: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const professions = [
  { icon: Music, name: 'DJs' },
  { icon: PartyPopper, name: 'Produtores de eventos' },
  { icon: Camera, name: 'Fotógrafos' },
  { icon: Video, name: 'Videomakers' },
  { icon: Palette, name: 'Designers' },
  { icon: Share2, name: 'Social media' },
  { icon: Code, name: 'Desenvolvedores' },
  { icon: Building2, name: 'Arquitetos' },
  
];

const TargetUsersSection = () => (
  <section className="py-16 md:py-24 border-t border-white/[0.06]">
    <div className="mx-auto max-w-4xl px-5">
      <motion.div className="text-center mb-12" initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}>
        <h2 className="text-2xl md:text-4xl font-bold tracking-tight">
          Se você cobra por projeto, o Freelox é pra você.
        </h2>
        <p className="mt-4 text-white/50 text-base md:text-lg">
          Feito para freelancers e profissionais que precisam enviar propostas com rapidez.
        </p>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4"
        initial="hidden" whileInView="show" viewport={{ once: true }}
      >
        {professions.map((p, i) => (
          <motion.div
            key={p.name}
            variants={fade}
            custom={i}
            className="flex flex-col items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 backdrop-blur transition-colors hover:border-primary/30 hover:bg-primary/[0.04]"
          >
            <p.icon className="h-6 w-6 text-primary" />
            <span className="text-sm font-medium text-white/70 text-center">{p.name}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="mt-10 text-center text-sm md:text-base text-white/40"
        initial="hidden" whileInView="show" viewport={{ once: true }} variants={fade}
      >
        E qualquer profissional que precise enviar propostas com rapidez e profissionalismo.
      </motion.p>
    </div>
  </section>
);

export default TargetUsersSection;
