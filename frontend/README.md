# 🎨 OpenLedger Hub | Client Dashboard
This is the official frontend for OpenLedger Hub, a modern, high-performance financial dashboard. Built with a focus on speed, user experience, and efficient data rendering.

## 🚀 Performance-First Approach
The client is built using Astro, leveraging its "Islands Architecture" to deliver a lightning-fast experience.

* Islands Architecture: Most of the dashboard is static for maximum speed, while only the high-interaction financial modules (like real-time charts and transaction forms) are hydrated with React.
* Zero-JS by Default: Pages load instantly, and JavaScript is only fetched for the specific components that need it.
* Modern Styling: Designed with Bulma CSS for a clean, responsive, and mobile-friendly interface.

## 🛠️ Tech Stack

* Framework: Astro (SSR Enabled).
* UI Library: React (For complex state management and interactive UI).
* Styling: Bulma CSS & Sass.
* State Management: React Hooks & Context API.
* API Communication: Type-safe fetch calls to the Core API.

## 💎 Key Features
* Real-time Balance Overview: Instant feedback on your financial health across multiple accounts.
* Intuitive Transaction Entry: Quickly log income and expenses with category tagging.
* Asset Hub: Manage your banks, cash, and digital assets in one centralized location.
* Responsive Design: Optimized for both desktop bookkeeping and quick mobile entries.

## 📂 Project Structure

``` Plaintext
frontend/src/
 ├── components/        # UI Building blocks (including __tests__ directory)
 │    ├── [module]/     # Domain-specific React components (List.tsx)
 │    └── shared/       # Reusable layout elements (Pagination, Forms)
 ├── pages/             # File-based routing (Astro Server-Side Rendering)
 ├── scripts/           # Decoupled Business Logic (Client-side TS scripts)
 ├── layouts/           # Global templates and navigation menus
 └── styles/            # Global CSS and modular styling
```

## 🚦 Getting Started
The frontend is fully containerized. To run it standalone (assuming the API is running):

``` Bash
npm install
npm run dev
Developed with ❤️ by Sebastian Moreno
```
##
Developed with engineering excellence by [SYSMA](https://sysma1997.github.io/).