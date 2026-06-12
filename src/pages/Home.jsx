import { Link } from 'react-router-dom';
import {
  BookOpenIcon,
  UsersIcon,
  MicIcon,
  HeartCheckIcon,
} from '../lib/icons.jsx';
import './Home.css';

const PILLARS = [
  {
    Icon: BookOpenIcon,
    title: 'Deep Teaching',
    desc: 'Weekly sessions grounded in Scripture, equipping workers with sound doctrine and practical ministry skills.',
  },
  {
    Icon: UsersIcon,
    title: 'Community',
    desc: 'A tightly-knit cohort of students who grow together, sharpen one another, and carry each other through.',
  },
  {
    Icon: MicIcon,
    title: 'Recorded Classes',
    desc: 'Every session recorded and available on-demand. Revisit, review, and go deeper — anytime.',
  },
  {
    Icon: HeartCheckIcon,
    title: 'Servant Heart',
    desc: "We train workers who don't just know the Word but live it — in service, prayer, and everyday witness.",
  },
];

export default function Home() {
  return (
    <main className='home'>
      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className='hero grid-bg'>
        <div className='hero__inner container'>
          <div className='hero__text'>
            <div className='eyebrow'>RCF FUTA · Workers in Training</div>
            <h1 className='hero__headline heading-xl'>
              Raised
              <br />
              <span className='hero__headline-green'>to Serve.</span>
              <br />
              Trained
              <br />
              to Last.
            </h1>
            <p className='hero__body'>
              The Workers in Training (WIT) program equips committed students of
              the Redeemed Christian Fellowship, FUTA spiritually, practically,
              and relationally for a lifetime of fruitful ministry.
            </p>
            <div className='hero__actions'>
              <Link to='/playlist' className='btn btn--primary btn--lg'>
                Listen to Classes →
              </Link>
              <Link to='/gallery' className='btn btn--outline btn--lg'>
                Meet the Cohort
              </Link>
            </div>
          </div>

          <div className='hero__card-col'>
            <div className='hero__card'>
              <div className='hero__card-header'>
                <span className='hero__card-dot' />
                <span className='hero__card-label'>WIT 2025/2026</span>
              </div>
              <blockquote className='hero__quote'>
                "Whoever wants to become great among you must be your servant."
              </blockquote>
              <cite className='hero__cite'>— Matthew 20:26</cite>
              <div className='hero__card-divider' />
              <div className='hero__card-stats'>
                <div className='hero__card-stat'>
                  <span className='hero__card-stat-val'>3+</span>
                  <span>Years</span>
                </div>
                <div className='hero__card-stat'>
                  <span className='hero__card-stat-val'>8</span>
                  <span>Units</span>
                </div>
                <div className='hero__card-stat'>
                  <span className='hero__card-stat-val'>200+</span>
                  <span>Sessions</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Ticker band ──────────────────────────────────────────────── */}
      <div className='ticker-band'>
        <div className='ticker'>
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} className='ticker__items'>
              <span>Workers in Training</span>
              <span className='ticker__dot'>✦</span>
              <span>RCF FUTA</span>
              <span className='ticker__dot'>✦</span>
              <span>Class Recordings</span>
              <span className='ticker__dot'>✦</span>
              <span>Student Gallery</span>
              <span className='ticker__dot'>✦</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── About ────────────────────────────────────────────────────── */}
      <section className='about'>
        <div className='about__left'>
          <div className='eyebrow'>About the Program</div>
          <h2 className='heading-lg'>
            More than
            <br />a training.
          </h2>
        </div>
        <div className='about__right'>
          <p>
            The WIT program at RCF FUTA is a structured, intentional journey for
            students who feel called to serve in the church. Over the academic
            year, trainees attend weekly teaching sessions, engage in supervised
            ministry practice, and are mentored by experienced workers and
            senior students.
          </p>
          <p>
            The goal is clear: workers who know who they are in Christ, know how
            to handle the Word, and know how to love and serve people well.
          </p>
          <Link to='/gallery' className='about__link btn btn--outline'>
            See this year's cohort →
          </Link>
        </div>
      </section>

      {/* ── Pillars ──────────────────────────────────────────────────── */}
      <section className='pillars grid-bg'>
        <div className='container'>
          <div className='pillars__header'>
            <div className='eyebrow'>What We Do</div>
            <h2 className='heading-lg'>Four pillars.</h2>
          </div>
          <div className='pillars__grid'>
            {PILLARS.map((p, i) => (
              <div key={p.title} className='pillar-card'>
                <div className='pillar-card__num'>
                  {String(i + 1).padStart(2, '0')}
                </div>
                <div className='pillar-card__icon'>
                  <p.Icon size={22} />
                </div>
                <h3 className='pillar-card__title'>{p.title}</h3>
                <p className='pillar-card__desc'>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className='home-cta'>
        <div className='container'>
          <div className='home-cta__block'>
            <div className='home-cta__text'>
              <h2 className='heading-lg'>
                Start listening
                <br />
                to the classes.
              </h2>
              <p>All recordings from the WIT program — free, always.</p>
            </div>
            <Link to='/playlist' className='btn btn--primary btn--lg'>
              Go to Playlist →
            </Link>
          </div>
        </div>
      </section>

      {/* Footer section */}
      <div className='home-footer grid-bg'>
        <p className='heading-md'>© {new Date().getFullYear()} RCF FUTA. All rights reserved.</p>
        <p>
          Built with ❤️ by{' '}
          <a
            href='https://linkedin.com/in/fasakin-henry'
            target='_blank'
            rel='noopener noreferrer'
          >
            Fasakin Henry
          </a>{' '}
          WIT 2026 cohort.{' '}
        </p>
      </div>
    </main>
  );
}
