import { useRef } from 'react';
import { Button } from './button';

interface EmptyStateProps {
  readonly onOpenFile: (file: File) => void;
  readonly onOpenMerge: () => void;
  readonly onOpenCompress: () => void;
  readonly errorMessage: string | null;
  readonly isLoading: boolean;
}

const GITHUB_URL: string = 'https://github.com/thermaldrg/pdf-editor';

export function EmptyState({
  onOpenFile,
  onOpenMerge,
  onOpenCompress,
  errorMessage,
  isLoading,
}: EmptyStateProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleBrowseClick = (): void => {
    inputRef.current?.click();
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ): void => {
    const file: File | undefined = event.target.files?.[0];
    if (file) onOpenFile(file);
    event.target.value = '';
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>): void => {
    event.preventDefault();
    const file: File | undefined = event.dataTransfer.files?.[0];
    if (file && file.type === 'application/pdf') onOpenFile(file);
  };

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden">
      <BackgroundDecor />
      <div className="relative mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-6 py-10 sm:py-14 lg:py-16">
        <OpenSourceBadge />
        <HeroHeading />
        <PrivacyCallout />
        <Dropzone
          isLoading={isLoading}
          onBrowseClick={handleBrowseClick}
          onOpenMerge={onOpenMerge}
          onOpenCompress={onOpenCompress}
          onDrop={handleDrop}
          errorMessage={errorMessage}
        />
        <FeatureGrid />
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleInputChange}
        />
      </div>
    </div>
  );
}

function BackgroundDecor() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-indigo-200/50 via-violet-200/40 to-transparent blur-3xl" />
      <div className="absolute bottom-0 right-0 h-96 w-96 translate-x-1/3 translate-y-1/3 rounded-full bg-gradient-to-tl from-sky-200/40 to-transparent blur-3xl" />
    </div>
  );
}

function OpenSourceBadge() {
  return (
    <a
      href={GITHUB_URL}
      target="_blank"
      rel="noreferrer noopener"
      className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3.5 py-1.5 text-xs font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-indigo-300 hover:bg-white hover:text-indigo-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
    >
      <IconGithub className="h-3.5 w-3.5" />
      <span>Open source on GitHub</span>
      <span className="text-slate-300 group-hover:text-indigo-300">|</span>
      <span className="font-semibold text-indigo-600">MIT</span>
      <IconArrowUpRight className="h-3 w-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-indigo-500" />
    </a>
  );
}

function HeroHeading() {
  return (
    <div className="mt-5 max-w-2xl text-center">
      <h1 className="text-balance text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl">
        Edit PDFs without uploading them.
      </h1>
      <p className="mt-4 text-base text-slate-600 sm:text-lg">
        Sign, annotate, merge, compress, and password-protect your PDFs
        directly in your browser. Nothing ever leaves your device.
      </p>
    </div>
  );
}

function PrivacyCallout() {
  return (
    <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
      <PrivacyPill icon={<IconShield />} label="100% client-side" tone="emerald" />
      <PrivacyPill icon={<IconNoUpload />} label="No uploads, ever" tone="indigo" />
      <PrivacyPill icon={<IconWifiOff />} label="Works offline" tone="slate" />
    </div>
  );
}

type PillTone = 'emerald' | 'indigo' | 'slate';

interface PrivacyPillProps {
  readonly icon: React.ReactNode;
  readonly label: string;
  readonly tone: PillTone;
}

const PILL_TONE_CLASSES: Record<PillTone, string> = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  indigo: 'border-indigo-200 bg-indigo-50 text-indigo-700',
  slate: 'border-slate-200 bg-slate-50 text-slate-700',
};

function PrivacyPill({ icon, label, tone }: PrivacyPillProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${PILL_TONE_CLASSES[tone]}`}
    >
      {icon}
      {label}
    </span>
  );
}

interface DropzoneProps {
  readonly isLoading: boolean;
  readonly onBrowseClick: () => void;
  readonly onOpenMerge: () => void;
  readonly onOpenCompress: () => void;
  readonly onDrop: (event: React.DragEvent<HTMLDivElement>) => void;
  readonly errorMessage: string | null;
}

function Dropzone({
  isLoading,
  onBrowseClick,
  onOpenMerge,
  onOpenCompress,
  onDrop,
  errorMessage,
}: DropzoneProps) {
  return (
    <div
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="group mt-10 flex w-full max-w-2xl flex-col items-center rounded-3xl border-2 border-dashed border-slate-300 bg-white/80 p-8 text-center shadow-sm backdrop-blur transition-colors hover:border-indigo-400 hover:bg-white sm:p-10"
    >
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-md">
        <IconUpload />
      </div>
      <h2 className="text-xl font-semibold text-slate-900">
        Drop a PDF here to get started
      </h2>
      <p className="mt-1 text-sm text-slate-500">
        Your file stays in this tab. We never send it to a server.
      </p>
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <Button
          variant="primary"
          onClick={onBrowseClick}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : 'Choose PDF'}
        </Button>
        <Button variant="secondary" onClick={onOpenMerge} disabled={isLoading}>
          Merge PDFs
        </Button>
        <Button
          variant="secondary"
          onClick={onOpenCompress}
          disabled={isLoading}
        >
          Compress PDF
        </Button>
      </div>
      {errorMessage && (
        <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>
      )}
    </div>
  );
}

interface FeatureItem {
  readonly title: string;
  readonly description: string;
  readonly icon: React.ReactNode;
}

const FEATURES: ReadonlyArray<FeatureItem> = [
  {
    title: 'Sign & annotate',
    description:
      'Add signatures, text, dates, and shapes. Fill out forms with ease.',
    icon: <IconSignature />,
  },
  {
    title: 'Merge & reorder',
    description:
      'Combine multiple PDFs, rotate pages, and rearrange them in any order.',
    icon: <IconLayers />,
  },
  {
    title: 'Compress & protect',
    description:
      'Shrink large files and add password protection before sharing.',
    icon: <IconLock />,
  },
];

function FeatureGrid() {
  return (
    <div className="mt-12 grid w-full max-w-4xl grid-cols-1 gap-3 sm:grid-cols-3">
      {FEATURES.map((feature) => (
        <FeatureCard key={feature.title} feature={feature} />
      ))}
    </div>
  );
}

interface FeatureCardProps {
  readonly feature: FeatureItem;
}

function FeatureCard({ feature }: FeatureCardProps) {
  return (
    <div className="flex flex-col items-start rounded-2xl border border-slate-200 bg-white/70 p-5 text-left shadow-sm backdrop-blur">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
        {feature.icon}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{feature.title}</h3>
      <p className="mt-1 text-sm text-slate-500">{feature.description}</p>
    </div>
  );
}

interface IconProps {
  readonly className?: string;
}

function IconUpload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-7 w-7"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12 12 7.5m0 0L7.5 12M12 7.5v9"
      />
    </svg>
  );
}

function IconShield() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75 11.25 15 15 9.75M21 12c0 5.25-4.5 9-9 9s-9-3.75-9-9V5.25l9-3 9 3V12z"
      />
    </svg>
  );
}

function IconNoUpload() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 16.5V9.75m0 0 3 3m-3-3-3 3M6.75 19.5a4.5 4.5 0 0 1-1.41-8.775 5.25 5.25 0 0 1 10.233-2.33 3 3 0 0 1 3.758 3.848A3.752 3.752 0 0 1 18 19.5H6.75z"
      />
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 4l16 16"
      />
    </svg>
  );
}

function IconWifiOff() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="h-3.5 w-3.5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0z"
      />
    </svg>
  );
}

function IconSignature() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zM19.5 19.5h-15"
      />
    </svg>
  );
}

function IconLayers() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.429 9.75 2.25 12l4.179 2.25m0-4.5 5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L21.75 12l-4.179 2.25m0 0 4.179 2.25L12 21.75 2.25 16.5l4.179-2.25m11.142 0-5.571 3-5.571-3"
      />
    </svg>
  );
}

function IconLock() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.8}
      stroke="currentColor"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25z"
      />
    </svg>
  );
}

function IconGithub({ className = 'h-4 w-4' }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.485 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.467-1.11-1.467-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.339-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.485 17.523 2 12 2z"
      />
    </svg>
  );
}

function IconArrowUpRight({ className = 'h-3.5 w-3.5' }: IconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 17 17 7M7 7h10v10"
      />
    </svg>
  );
}
