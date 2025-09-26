import { type Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';
import { GitHubIcon, LinkedInIcon } from '@/components/SocialIcons';
import portraitImage from '@/images/portrait.jpg';

function SocialLink({
  className,
  href,
  children,
  icon: Icon,
}: {
  className?: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <li className={clsx(className, 'flex')}>
      <Link
        href={href}
        className='group flex text-sm font-medium text-zinc-800 transition-all duration-300 hover:scale-105 hover:text-teal-500 dark:text-zinc-200 dark:hover:text-teal-500'
      >
        <Icon className='h-6 w-6 flex-none fill-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:fill-teal-500' />
        <span className='ml-4'>{children}</span>
      </Link>
    </li>
  );
}

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox='0 0 24 24' aria-hidden='true' {...props}>
      <path
        fillRule='evenodd'
        d='M6 5a3 3 0 0 0-3 3v8a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3V8a3 3 0 0 0-3-3H6Zm.245 2.187a.75.75 0 0 0-.99 1.126l6.25 5.5a.75.75 0 0 0 .99 0l6.25-5.5a.75.75 0 0 0-.99-1.126L12 12.251 6.245 7.187Z'
      />
    </svg>
  );
}

export const metadata: Metadata = {
  title: 'About',
  description:
    "I'm Shawn Nunoo. I live in New York City, where I design the future.",
};

export default function About() {
  return (
    <>
      <PageBackground />

      {/* Hero Section */}
      <div className='relative overflow-hidden py-32'>
        <Container className='relative z-10'>
          <div className='mx-auto max-w-4xl text-center'>
            <h1 className='mb-6 bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
              About Me
            </h1>
            <p className='text-xl font-light leading-relaxed text-zinc-600 md:text-2xl dark:text-zinc-400'>
              Building the bridge between imagination and reality
            </p>
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className='pb-16'>
        <div className='grid grid-cols-1 gap-y-16 lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-x-16 lg:gap-y-12'>
          {/* Portrait Section */}
          <div className='flex justify-center lg:justify-start lg:pl-20'>
            <div className='group relative'>
              <div className='absolute -inset-4 rounded-3xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 opacity-0 blur transition duration-500 group-hover:opacity-100' />
              <div className='relative max-w-xs px-2.5 lg:max-w-none'>
                <Image
                  src={portraitImage}
                  alt='Shawn Nunoo'
                  sizes='(min-width: 1024px) 32rem, 20rem'
                  className='aspect-square rotate-3 rounded-3xl bg-zinc-100 object-cover shadow-2xl transition-all duration-500 group-hover:rotate-0 group-hover:scale-105 dark:bg-zinc-800'
                />
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className='lg:order-first lg:row-span-2'>
            <div className='max-w-2xl'>
              <h2 className='mb-8 text-3xl font-bold tracking-tight text-zinc-800 sm:text-4xl dark:text-zinc-100'>
                I&apos;m Shawn Nunoo. I live in New York City, where I design
                the future.
              </h2>

              <div className='mt-6 space-y-8 text-base leading-relaxed text-zinc-600 dark:text-zinc-400'>
                <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                  <div className='relative z-10'>
                    <p>
                      I&apos;ve loved making things for as long as I can
                      remember, and wrote my first program when I was 6 years
                      old, just two weeks after my mom brought home the brand
                      new Macintosh LC 550 that I taught myself to type on.
                    </p>
                  </div>
                </div>

                <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                  <div className='relative z-10'>
                    <p>
                      The only thing I loved more than computers as a kid was
                      space. When I was 8, I climbed the 40-foot oak tree at the
                      back of our yard while wearing my older sister&apos;s
                      motorcycle helmet, counted down from three, and jumped —
                      hoping the tree was tall enough that with just a bit of
                      momentum I&apos;d be able to get to orbit.
                    </p>
                  </div>
                </div>

                <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                  <div className='relative z-10'>
                    <p>
                      I spent the next few summers indoors working on a rocket
                      design, while I recovered from the multiple surgeries it
                      took to fix my badly broken legs. It took nine iterations,
                      but when I was 15 I sent my dad&apos;s Blackberry into
                      orbit and was able to transmit a photo back down to our
                      family computer from space.
                    </p>
                  </div>
                </div>

                <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/50 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] dark:border-zinc-700/50 dark:bg-zinc-900/50'>
                  <div className='absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
                  <div className='relative z-10'>
                    <p>
                      Today, I&apos;m the founder of Planetaria, where
                      we&apos;re working on civilian space suits and manned
                      shuttle kits you can assemble at home so that the next
                      generation of kids really <em>can</em> make it to orbit —
                      from the comfort of their own backyards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Social Links Section */}
          <div className='lg:pl-20'>
            <div className='relative overflow-hidden rounded-3xl border border-zinc-200/50 bg-white/70 p-8 backdrop-blur-sm dark:border-zinc-700/50 dark:bg-zinc-900/70'>
              <div className='absolute inset-0 bg-gradient-to-br from-teal-500/5 to-blue-500/5' />
              <div className='relative z-10'>
                <h3 className='mb-6 text-lg font-semibold text-zinc-800 dark:text-zinc-100'>
                  Let&apos;s Connect
                </h3>
                <ul role='list' className='space-y-4'>
                  <SocialLink href='https://github.com/nunoo' icon={GitHubIcon}>
                    Follow on GitHub
                  </SocialLink>
                  <SocialLink
                    href='https://www.linkedin.com/in/shawnnunoo/'
                    icon={LinkedInIcon}
                    className='mt-4'
                  >
                    Follow on LinkedIn
                  </SocialLink>
                  <SocialLink
                    href='mailto:shawn@nunoo.co'
                    icon={MailIcon}
                    className='mt-8 border-t border-zinc-100/50 pt-8 dark:border-zinc-700/40'
                  >
                    shawn@nunoo.co
                  </SocialLink>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </>
  );
}
