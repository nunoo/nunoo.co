import Image, { type ImageProps } from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Container } from '@/components/Container';
import { PageBackground } from '@/components/PageBackground';
import {
  GitHubIcon,
  InstagramIcon,
  LinkedInIcon,
  XIcon,
} from '@/components/SocialIcons';
import avatarImage from '@/images/avatar.jpg';
import logoAirbnb from '@/images/logos/airbnb.svg';
import logoFacebook from '@/images/logos/facebook.svg';
import logoPlanetaria from '@/images/logos/planetaria.svg';
import logoStarbucks from '@/images/logos/starbucks.svg';
import image1 from '@/images/photos/image-1.jpg';
import image2 from '@/images/photos/image-2.jpg';
import image3 from '@/images/photos/image-3.jpg';
import image4 from '@/images/photos/image-4.jpg';
import image5 from '@/images/photos/image-5.jpg';
import { type ArticleWithSlug, getAllArticles } from '@/lib/articles';
import { formatDate } from '@/lib/formatDate';

function MailIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      <path
        d='M2.75 7.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z'
        className='fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500'
      />
      <path
        d='m4 6 6.024 5.479a2.915 2.915 0 0 0 3.952 0L20 6'
        className='stroke-zinc-400 dark:stroke-zinc-500'
      />
    </svg>
  );
}

function BriefcaseIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg
      viewBox='0 0 24 24'
      fill='none'
      strokeWidth='1.5'
      strokeLinecap='round'
      strokeLinejoin='round'
      aria-hidden='true'
      {...props}
    >
      <path
        d='M2.75 9.75a3 3 0 0 1 3-3h12.5a3 3 0 0 1 3 3v8.5a3 3 0 0 1-3 3H5.75a3 3 0 0 1-3-3v-8.5Z'
        className='fill-zinc-100 stroke-zinc-400 dark:fill-zinc-100/10 dark:stroke-zinc-500'
      />
      <path
        d='M3 14.25h6.249c.484 0 .952-.002 1.316.319l.777.682a.996.996 0 0 0 1.316 0l.777-.682c.364-.32.832-.319 1.316-.319H21M8.75 6.5V4.75a2 2 0 0 1 2-2h2.5a2 2 0 0 1 2 2V6.5'
        className='stroke-zinc-400 dark:stroke-zinc-500'
      />
    </svg>
  );
}

function ArrowDownIcon(props: React.ComponentPropsWithoutRef<'svg'>) {
  return (
    <svg viewBox='0 0 16 16' fill='none' aria-hidden='true' {...props}>
      <path
        d='M4.75 8.75 8 12.25m0 0 3.25-3.5M8 12.25v-8.5'
        strokeWidth='1.5'
        strokeLinecap='round'
        strokeLinejoin='round'
      />
    </svg>
  );
}

function Article({ article }: { article: ArticleWithSlug }) {
  return (
    <Card as='article'>
      <Card.Title href={`/articles/${article.slug}`}>
        {article.title}
      </Card.Title>
      <Card.Eyebrow as='time' dateTime={article.date} decorate>
        {formatDate(article.date)}
      </Card.Eyebrow>
      <Card.Description>{article.description}</Card.Description>
      <Card.Cta>Read article</Card.Cta>
    </Card>
  );
}

function SocialLink({
  icon: Icon,
  ...props
}: React.ComponentPropsWithoutRef<typeof Link> & {
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link className='group -m-1 p-1' {...props}>
      <Icon className='h-8 w-8 fill-zinc-500 transition-all duration-300 group-hover:scale-110 group-hover:fill-zinc-600 dark:fill-zinc-400 dark:group-hover:fill-zinc-300' />
    </Link>
  );
}

function Newsletter() {
  return (
    <form
      action='/thank-you'
      className='rounded-3xl border border-zinc-100/50 bg-white/50 p-8 backdrop-blur-sm dark:border-zinc-700/40 dark:bg-zinc-900/50'
    >
      <h2 className='flex text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
        <MailIcon className='h-6 w-6 flex-none' />
        <span className='ml-3'>Stay up to date</span>
      </h2>
      <p className='mt-2 text-sm text-zinc-600 dark:text-zinc-400'>
        Get notified when I publish something new, and unsubscribe at any time.
      </p>
      <div className='mt-6 flex'>
        <input
          type='email'
          placeholder='Email address'
          aria-label='Email address'
          required
          className='min-w-0 flex-auto appearance-none rounded-xl border border-zinc-900/10 bg-white/80 px-4 py-3 shadow-lg shadow-zinc-800/5 backdrop-blur-sm placeholder:text-zinc-400 focus:border-teal-500 focus:outline-none focus:ring-4 focus:ring-teal-500/10 sm:text-sm dark:border-zinc-700 dark:bg-zinc-700/50 dark:text-zinc-200 dark:placeholder:text-zinc-500 dark:focus:border-teal-400 dark:focus:ring-teal-400/10'
        />
        <Button type='submit' className='ml-4 flex-none rounded-xl'>
          Join
        </Button>
      </div>
    </form>
  );
}

interface Role {
  company: string;
  title: string;
  logo: ImageProps['src'];
  start: string | { label: string; dateTime: string };
  end: string | { label: string; dateTime: string };
}

function Role({ role }: { role: Role }) {
  let startLabel =
    typeof role.start === 'string' ? role.start : role.start.label;
  let startDate =
    typeof role.start === 'string' ? role.start : role.start.dateTime;

  let endLabel = typeof role.end === 'string' ? role.end : role.end.label;
  let endDate = typeof role.end === 'string' ? role.end : role.end.dateTime;

  return (
    <li className='flex gap-4'>
      <div className='relative mt-1 flex h-12 w-12 flex-none items-center justify-center rounded-full shadow-lg shadow-zinc-800/5 ring-1 ring-zinc-900/5 dark:border dark:border-zinc-700/50 dark:bg-zinc-800 dark:ring-0'>
        <Image src={role.logo} alt='' className='h-7 w-7' unoptimized />
      </div>
      <dl className='flex flex-auto flex-wrap gap-x-2'>
        <dt className='sr-only'>Company</dt>
        <dd className='w-full flex-none text-sm font-medium text-zinc-900 dark:text-zinc-100'>
          {role.company}
        </dd>
        <dt className='sr-only'>Role</dt>
        <dd className='text-xs text-zinc-500 dark:text-zinc-400'>
          {role.title}
        </dd>
        <dt className='sr-only'>Date</dt>
        <dd
          className='ml-auto text-xs text-zinc-400 dark:text-zinc-500'
          aria-label={`${startLabel} until ${endLabel}`}
        >
          <time dateTime={startDate}>{startLabel}</time>{' '}
          <span aria-hidden='true'>—</span>{' '}
          <time dateTime={endDate}>{endLabel}</time>
        </dd>
      </dl>
    </li>
  );
}

function Resume() {
  let resume: Array<Role> = [
    {
      company: 'Planetaria',
      title: 'CEO',
      logo: logoPlanetaria,
      start: '2019',
      end: {
        label: 'Present',
        dateTime: new Date().getFullYear().toString(),
      },
    },
    {
      company: 'Airbnb',
      title: 'Product Designer',
      logo: logoAirbnb,
      start: '2014',
      end: '2019',
    },
    {
      company: 'Facebook',
      title: 'iOS Software Engineer',
      logo: logoFacebook,
      start: '2011',
      end: '2014',
    },
    {
      company: 'Starbucks',
      title: 'Shift Supervisor',
      logo: logoStarbucks,
      start: '2008',
      end: '2011',
    },
  ];

  return (
    <div className='rounded-3xl border border-zinc-100/50 bg-white/50 p-8 backdrop-blur-sm dark:border-zinc-700/40 dark:bg-zinc-900/50'>
      <h2 className='flex text-sm font-semibold text-zinc-900 dark:text-zinc-100'>
        <BriefcaseIcon className='h-6 w-6 flex-none' />
        <span className='ml-3'>Work</span>
      </h2>
      <ol className='mt-6 space-y-4'>
        {resume.map((role, roleIndex) => (
          <Role key={roleIndex} role={role} />
        ))}
      </ol>
    </div>
  );
}

function Photos() {
  let rotations = [
    'rotate-2',
    '-rotate-2',
    'rotate-2',
    'rotate-2',
    '-rotate-2',
  ];

  return (
    <div className='mt-16 sm:mt-20'>
      <div className='-my-4 flex justify-center gap-5 overflow-hidden py-4 sm:gap-8'>
        {[image1, image2, image3, image4, image5].map((image, imageIndex) => (
          <div
            key={image.src}
            className={clsx(
              'relative aspect-[9/10] w-44 flex-none overflow-hidden rounded-3xl bg-zinc-100 transition-transform duration-300 hover:scale-105 sm:w-72 dark:bg-zinc-800',
              rotations[imageIndex % rotations.length]
            )}
          >
            <Image
              src={image}
              alt=''
              sizes='(min-width: 640px) 18rem, 11rem'
              className='absolute inset-0 h-full w-full object-cover'
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function Home() {
  let articles = (await getAllArticles()).slice(0, 4);

  return (
    <>
      <PageBackground />

      {/* Hero Section with Modern Background */}
      <div className='relative flex min-h-[90vh] items-center justify-center overflow-hidden py-16 sm:py-24'>
        <Container className='relative z-10 w-full'>
          <div className='mx-auto w-full max-w-7xl text-center'>
            {/* Integrated Profile Picture with Glowing Area */}
            <div className='mb-12 flex justify-center'>
              <div className='group relative'>
                {/* Large Glow Effect - Main Background */}
                <div className='absolute -inset-12 animate-pulse-slow rounded-full bg-gradient-to-r from-blue-500/40 via-purple-500/40 to-pink-500/40 blur-3xl transition-all duration-500 group-hover:blur-[2rem]' />

                {/* Secondary Glow Layer */}
                <div className='absolute -inset-8 animate-pulse-slow rounded-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 blur-2xl transition-all duration-500 group-hover:blur-3xl' />

                {/* Profile Image Container - Centered within the glow */}
                <div className='relative z-20 flex items-center justify-center'>
                  <div className='relative rounded-full bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 p-2 backdrop-blur-sm transition-all duration-500 group-hover:from-blue-500/40 group-hover:via-purple-500/40 group-hover:to-pink-500/40'>
                    <div className='relative overflow-hidden rounded-full'>
                      <Image
                        src={avatarImage}
                        alt='Shawn Nunoo'
                        width={200}
                        height={200}
                        className='relative z-10 h-32 w-32 rounded-full object-cover transition-all duration-500 group-hover:scale-105 sm:h-40 sm:w-40 lg:h-48 lg:w-48'
                        priority
                        unoptimized
                        style={{ position: 'relative', zIndex: 10 }}
                      />

                      {/* Animated Border */}
                      <div className='absolute inset-0 animate-gradient rounded-full border-2 border-transparent bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-border' />
                    </div>
                  </div>
                </div>

                {/* Floating Elements - Positioned around the glow area */}
                <div
                  className='absolute -right-6 -top-6 h-6 w-6 animate-float rounded-full bg-blue-500/60 transition-colors duration-300 group-hover:bg-blue-400'
                  style={{ animationDelay: '0.5s' }}
                />
                <div
                  className='absolute -bottom-6 -left-6 h-5 w-5 animate-float rounded-full bg-purple-500/60 transition-colors duration-300 group-hover:bg-purple-400'
                  style={{ animationDelay: '1s' }}
                />
                <div
                  className='absolute -right-8 top-1/2 h-4 w-4 animate-float rounded-full bg-pink-500/60 transition-colors duration-300 group-hover:bg-pink-400'
                  style={{ animationDelay: '1.5s' }}
                />
                <div
                  className='absolute -left-8 top-1/3 h-3 w-3 animate-float rounded-full bg-cyan-500/60 transition-colors duration-300 group-hover:bg-cyan-400'
                  style={{ animationDelay: '2s' }}
                />
              </div>
            </div>

            {/* Main Heading with Gradient Text */}
            <h1 className='mb-8 animate-gradient bg-gradient-to-r from-zinc-800 via-zinc-600 to-zinc-800 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-6xl lg:text-8xl xl:text-9xl dark:from-zinc-100 dark:via-zinc-300 dark:to-zinc-100'>
              Shawn Nunoo
            </h1>

            {/* Subtitle with Modern Typography */}
            <p className='mx-auto mb-10 max-w-5xl text-xl font-light leading-relaxed text-zinc-600 sm:text-2xl lg:text-3xl xl:text-4xl dark:text-zinc-400'>
              Crafting digital experiences that bridge creativity and technology
            </p>

            {/* Enhanced Social Links */}
            <div className='mb-12 flex justify-center gap-8 sm:gap-10'>
              <SocialLink
                href='https://github.com/nunoo'
                aria-label='Follow on GitHub'
                icon={GitHubIcon}
              />
              <SocialLink
                href='https://www.linkedin.com/in/shawnnunoo/'
                aria-label='Follow on LinkedIn'
                icon={LinkedInIcon}
              />
            </div>

            {/* Floating Call-to-Action */}
            <div className='animate-float'>
              <Button
                href='/about'
                className='rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-4 text-lg font-medium text-white shadow-2xl transition-all duration-300 hover:scale-105 hover:from-blue-700 hover:to-purple-700 hover:shadow-blue-500/25 sm:px-10 sm:py-5 sm:text-xl'
              >
                Discover My Work
              </Button>
            </div>
          </div>
        </Container>

        {/* Scroll Indicator */}
        <div className='absolute bottom-8 left-1/2 -translate-x-1/2 transform animate-bounce'>
          <ArrowDownIcon className='h-6 w-6 text-zinc-400 sm:h-8 sm:w-8 dark:text-zinc-500' />
        </div>
      </div>

      {/* Content Sections */}
      <Container className='py-16 sm:py-24'>
        <div className='mx-auto max-w-6xl'>
          <div className='mb-16 grid grid-cols-1 gap-6 sm:mb-24 sm:gap-8 lg:grid-cols-3'>
            {/* Feature Cards */}
            <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/10 sm:rounded-3xl sm:p-8 dark:border-zinc-700/50 dark:bg-zinc-900/70'>
              <div className='absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              <div className='relative z-10'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-800 sm:mb-4 sm:text-xl dark:text-zinc-100'>
                  Innovation
                </h3>
                <p className='leading-relaxed text-zinc-600 dark:text-zinc-400'>
                  Pushing boundaries with cutting-edge technology and creative
                  solutions.
                </p>
              </div>
            </div>

            <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10 sm:rounded-3xl sm:p-8 dark:border-zinc-700/50 dark:bg-zinc-900/70'>
              <div className='absolute inset-0 bg-gradient-to-br from-purple-500/5 to-pink-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              <div className='relative z-10'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-800 sm:mb-4 sm:text-xl dark:text-zinc-100'>
                  Excellence
                </h3>
                <p className='leading-relaxed text-zinc-600 dark:text-zinc-400'>
                  Delivering high-quality solutions with attention to every
                  detail.
                </p>
              </div>
            </div>

            <div className='group relative overflow-hidden rounded-2xl border border-zinc-200/50 bg-white/70 p-6 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/10 sm:rounded-3xl sm:p-8 dark:border-zinc-700/50 dark:bg-zinc-900/70'>
              <div className='absolute inset-0 bg-gradient-to-br from-green-500/5 to-teal-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100' />
              <div className='relative z-10'>
                <h3 className='mb-3 text-lg font-semibold text-zinc-800 sm:mb-4 sm:text-xl dark:text-zinc-100'>
                  Impact
                </h3>
                <p className='leading-relaxed text-zinc-600 dark:text-zinc-400'>
                  Creating meaningful solutions that make a difference in
                  people&apos;s lives.
                </p>
              </div>
            </div>
          </div>

          {/* Optional: Featured Articles Section */}
          {articles.length > 0 && (
            <div className='text-center'>
              <h2 className='mb-8 text-2xl font-bold text-zinc-800 sm:mb-12 sm:text-3xl dark:text-zinc-100'>
                Latest Thoughts
              </h2>
              <div className='grid grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2'>
                {articles.slice(0, 2).map((article) => (
                  <div
                    key={article.slug}
                    className='group relative overflow-hidden rounded-xl border border-zinc-200/50 bg-white/50 p-4 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] sm:rounded-2xl sm:p-6 dark:border-zinc-700/50 dark:bg-zinc-900/50'
                  >
                    <Article article={article} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Container>
    </>
  );
}
