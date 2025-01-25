import Link from 'next/link';
import { Github } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HeroHighlight } from '@/components/ui/hero-highlight';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-background/95">
      {/* Hero Section */}
      <HeroHighlight containerClassName="!h-auto py-24">
        <div className="flex flex-col items-center w-full max-w-7xl mx-auto px-4">
          <div className="relative space-y-6">
            <div className="space-y-4 text-center">
              <h1 className="relative text-7xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-yellow-400 via-yellow-500 to-green-500 bg-clip-text text-transparent">
                  Sueno
                </span>
              </h1>
              <p className="text-xl text-muted-foreground">High-Performance Tools for Bun.js</p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-background font-medium px-8"
              >
                <Link href="/docs">Get Started</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="gap-2 border-yellow-500/20 hover:bg-yellow-500/5 px-8"
              >
                <a
                  href="https://github.com/suenojs/tools"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="h-4 w-4" />
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </HeroHighlight>

      {/* Features Section */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-24 mt-24">
        <div className="grid gap-8 md:grid-cols-3">
          {[
            {
              title: 'Logger',
              description:
                'Powerful logging utility with fancy console output, request tracking, and TypeScript support.',
              status: 'Available',
              color: 'bg-yellow-500',
            },
            {
              title: 'Cache',
              description:
                'Fast and flexible caching solution with in-memory and Redis integration.',
              status: 'Coming Soon',
              color: 'bg-green-500',
            },
            {
              title: 'Worker',
              description:
                'Robust worker and queue management system with job priorities and Redis persistence.',
              status: 'Coming Soon',
              color: 'bg-yellow-500',
            },
          ].map((feature) => (
            <div
              key={feature.title}
              className="group relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm p-6 transition-all hover:shadow-lg"
            >
              <div
                className={cn(
                  'absolute right-0 top-0 h-[200px] w-[200px] translate-x-1/2 -translate-y-1/2 transform rounded-full opacity-20 blur-3xl transition-all group-hover:opacity-30',
                  feature.color
                )}
              />
              <div className="relative space-y-2">
                <h3 className="text-xl font-bold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
                <div
                  className={cn(
                    'inline-block rounded-full px-2 py-0.5 text-xs',
                    feature.status === 'Available'
                      ? 'bg-yellow-500/10 text-yellow-600'
                      : 'bg-green-500/10 text-green-600'
                  )}
                >
                  {feature.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Code Examples Section */}
      <section className="w-full max-w-7xl mx-auto px-4 pb-24">
        <h2 className="text-3xl font-bold text-center mb-12">Simple to Use, Powerful to Scale</h2>
        <div className="grid gap-8 md:grid-cols-2">
          <div className="group relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm p-6">
            <div className="absolute right-0 top-0 h-[200px] w-[200px] translate-x-1/2 -translate-y-1/2 transform rounded-full opacity-20 blur-3xl transition-all group-hover:opacity-30 bg-yellow-500" />
            <div className="relative">
              <h3 className="text-xl font-bold mb-4">Logger Example</h3>
              <pre className="bg-black/90 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-yellow-400">{`import { Logger } from '@sueno/logger';

const logger = new Logger({
  name: 'my-app',
  level: 'info'
});

logger.info('Server started! 🚀');
logger.group('Request').info({
  method: 'GET',
  path: '/api/users'
});`}</code>
              </pre>
            </div>
          </div>
          <div className="group relative overflow-hidden rounded-lg border bg-card/50 backdrop-blur-sm p-6">
            <div className="absolute right-0 top-0 h-[200px] w-[200px] translate-x-1/2 -translate-y-1/2 transform rounded-full opacity-20 blur-3xl transition-all group-hover:opacity-30 bg-green-500" />
            <div className="relative">
              <h3 className="text-xl font-bold mb-4">Cache Example (Coming Soon)</h3>
              <pre className="bg-black/90 rounded-lg p-4 overflow-x-auto">
                <code className="text-sm text-green-400">{`import { Cache } from '@sueno/cache';

const cache = new Cache({
  driver: 'redis',
  ttl: '1h'
});

await cache.set('user:1', { name: 'John' });
const user = await cache.get('user:1');`}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="w-full bg-card/30 backdrop-blur-sm py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Why Choose Sueno?</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                title: 'Type-Safe',
                description:
                  'Built with TypeScript for excellent developer experience and code safety.',
              },
              {
                title: 'High Performance',
                description: 'Optimized for Bun.js to deliver maximum speed and efficiency.',
              },
              {
                title: 'Modern APIs',
                description:
                  'Clean, intuitive APIs that follow best practices and modern patterns.',
              },
              {
                title: 'Production Ready',
                description: 'Battle-tested tools you can rely on in production environments.',
              },
            ].map((item) => (
              <div key={item.title} className="text-center space-y-2">
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Community Section */}
      <section className="w-full max-w-7xl mx-auto px-4 py-24">
        <h2 className="text-3xl font-bold text-center mb-12">Join Our Community</h2>
        <div className="flex flex-wrap gap-6 justify-center">
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2 border-yellow-500/20 hover:bg-yellow-500/5"
          >
            <a
              href="https://github.com/suenojs/tools/discussions"
              target="_blank"
              rel="noopener noreferrer"
            >
              Discussions
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2 border-yellow-500/20 hover:bg-yellow-500/5"
          >
            <a
              href="https://github.com/suenojs/tools/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report Issues
            </a>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="gap-2 border-yellow-500/20 hover:bg-yellow-500/5"
          >
            <a
              href="https://github.com/suenojs/tools/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
            >
              Contribute
            </a>
          </Button>
        </div>
      </section>
    </main>
  );
}
