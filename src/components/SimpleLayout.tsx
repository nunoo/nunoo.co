import { Container } from '@/components/Container';

export function SimpleLayout({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children?: React.ReactNode;
}) {
  return (
    <div className='relative min-h-screen overflow-hidden'>
      {/* Background Elements */}
      <div className='absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-purple-50/30 dark:from-blue-950/20 dark:via-transparent dark:to-purple-950/20' />
      <div className='absolute inset-0 animate-pulse-slow bg-cyber-grid bg-grid opacity-10' />

      <div className='relative z-10 pb-16 pt-32'>
        <Container>
          <header className='mx-auto mb-16 max-w-4xl text-center'>
            <h1 className='mb-6 animate-gradient bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
              {title}
            </h1>
            <p className='text-xl font-light leading-relaxed text-zinc-600 md:text-2xl dark:text-zinc-400'>
              {intro}
            </p>
          </header>
          {children && <div className='mx-auto max-w-6xl'>{children}</div>}
        </Container>
      </div>
    </div>
  );
}
