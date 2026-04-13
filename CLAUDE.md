# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This repository contains two sub-projects for the **YOFrezco** multi-vendor marketplace platform:

- `yofrezco-6ammart-laravel-admin/` — Laravel 12 backend + admin panel (PHP 8.2+)
- `yofrezco-6ammart-react-user/` — Next.js 14 customer-facing web app (React 18, TypeScript)

Both connect to the same backend API at `https://portal.yofrezco.com`.

---

## Laravel Admin Backend (`yofrezco-6ammart-laravel-admin/`)

### Common Commands

```bash
# Run tests (all)
php artisan test

# Run a single test file
php artisan test tests/Feature/ExampleTest.php

# Run database migrations
php artisan migrate

# Seed the database
php artisan db:seed

# Clear caches (after config/route changes)
php artisan optimize:clear

# Generate application key
php artisan key:generate

# Queue worker
php artisan queue:work

# Laravel Pint (code style fixer)
./vendor/bin/pint

# PHPUnit directly
./vendor/bin/phpunit --filter TestName
```

> The backend runs in Docker with nodemon/supervisord — no need to restart the server manually after code changes.

### Architecture

**Request flow:** Route → Controller → Service → Repository → Model

- `app/Http/Controllers/Admin/` — Admin panel web controllers (blade views)
- `app/Http/Controllers/Api/V1/` and `V2/` — REST API controllers consumed by the Flutter app and React frontend
- `app/Http/Controllers/RestAPI/` — Additional REST controllers
- `app/Services/` — Business logic layer (e.g., `ZoneService`, `OrderService`)
- `app/Repositories/` — Database query layer (e.g., `ZoneRepository`, `StoreRepository`)
- `app/Models/` — Eloquent models
- `app/CentralLogics/` — Legacy helper files (auto-loaded globally via `composer.json`): `helpers.php`, `OrderLogic.php`, `StoreLogic.php`, etc.
- `app/Utils/` — Utility helpers: `settings.php` (provides `getWebConfig()`), `language.php`, `constant.php`

**Modules:** `Modules/` uses `nwidart/laravel-modules`. Currently active:
- `Modules/AI/` — AI-powered features
- `Modules/TaxModule/` — Tax calculation add-on

**Routes:**
- `routes/web.php` — Public web pages
- `routes/admin.php` — Admin panel routes (auth-protected)
- `routes/vendor.php` — Vendor panel routes
- `routes/api/V1/api.php` — V1 REST API
- `routes/api/V2/` — V2 REST API

**Key patterns:**
- `BusinessSetting` model is the central key-value store for all app configuration; use `getWebConfig($key)` helper to read it (caches in session).
- Payment gateways each have their own controller at root level (e.g., `StripePaymentController`, `RazorPayController`).
- The `Processor` trait (used in many controllers) provides common request handling utilities.
- CSS customizations are tracked at the bottom of `README.md` — theme overrides live in `theme.minc619.css` and `vendor.min.css`.

---

## Next.js React Web App (`yofrezco-6ammart-react-user/`)

### Common Commands

```bash
# Development server
yarn dev   # or npm run dev

# Build for production
yarn build

# Start production server
yarn start

# Type check
yarn type-check

# Lint
yarn lint
```

### Architecture

- `pages/` — Next.js file-based routing; `_app.js` wraps the app with Redux Provider and i18n
- `src/components/` — Feature-scoped React components
- `src/api-manage/ApiRoutes.js` — All API endpoint path constants
- `src/api-manage/MainApi.js` — Axios instance configured with base URL
- `src/api-manage/hooks/` — React Query hooks for data fetching
- `src/redux/slices/` — Redux Toolkit slices (cart, configData, wishList, profileInfo, etc.)
- `src/redux/store/` — Redux store configuration with redux-persist
- `src/contexts/` — React context providers
- `src/theme/` — MUI theme configuration

**Key patterns:**
- All API calls go through `MainApi.js` (Axios) using route constants from `ApiRoutes.js`.
- Server-side config (currency, modules, etc.) is fetched via `/api/v1/config` and stored in the `configData` Redux slice, which persists across sessions.
- MUI v5 is the UI library; custom theme overrides are in `src/theme/`.
- Images are served from `portal.yofrezco.com`; domain is whitelisted in `next.config.js`.
- i18n uses `i18next` + `react-i18next`; translation files live in `src/language/`.
