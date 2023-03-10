// This file sets a custom webpack configuration to use your Next.js app
// with Sentry.
// https://nextjs.org/docs/api-reference/next.config.js/introduction
// https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/
const { withSentryConfig } = require('@sentry/nextjs');

/** @type {import('next').NextConfig} */
const {i18n} = require('./next-i18next.config');

const nextConfig = {
  reactStrictMode: true,
  i18n,
}

const SENTRY_DRY_RUN = !(process.env.SENTRY_DRY_RUN === 'false'); // alway dry_run unless explicitly set to false

module.exports = nextConfig

module.exports = withSentryConfig(
  module.exports,
  { silent: true, dryRun: SENTRY_DRY_RUN },
  { hideSourcemaps: false, hideSourceMaps: false },
);
