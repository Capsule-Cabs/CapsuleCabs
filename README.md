# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/d5e77df0-51f7-4c49-aea7-ea86553d1774

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/d5e77df0-51f7-4c49-aea7-ea86553d1774) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/d5e77df0-51f7-4c49-aea7-ea86553d1774) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

```
CapsuleCabs
├─ backend
│  ├─ package-lock.json
│  ├─ package.json
│  └─ src
│     ├─ config
│     │  ├─ database.js
│     │  └─ redis.js
│     ├─ jobs
│     │  └─ scheduledJobs.js
│     ├─ middleware
│     │  ├─ auth.middleware.js
│     │  └─ errorMiddleware.js
│     ├─ models
│     │  ├─ booking.model.js
│     │  ├─ circuit.model.js
│     │  ├─ seat.model.js
│     │  └─ user.model.js
│     ├─ routes
│     │  ├─ auth.route.js
│     │  ├─ bookingRoutes.js
│     │  ├─ circuit.route.js
│     │  ├─ driverBookingsRoute.js
│     │  ├─ notificationRoutes.js
│     │  ├─ paymentRoutes.js
│     │  ├─ routeOptimizationRoute.js
│     │  ├─ routeRoutes.js
│     │  └─ userRoutes.js
│     ├─ server.js
│     ├─ services
│     │  ├─ notificationService.js
│     │  ├─ routeOptimization.service.js
│     │  └─ seat-locking.service.js
│     ├─ sockets
│     │  └─ socketHandler.js
│     └─ utils
│        ├─ apiResponse.js
│        └─ logger.js
├─ components.json
├─ eslint.config.js
├─ index.html
├─ package-lock.json
├─ package.json
├─ postcss.config.js
├─ public
│  ├─ favicon.ico
│  ├─ placeholder.svg
│  └─ robots.txt
├─ README.md
├─ src
│  ├─ App.css
│  ├─ App.tsx
│  ├─ assets
│  │  └─ hero-cab.jpg
│  ├─ components
│  │  ├─ booking
│  │  │  └─ booking-steps.tsx
│  │  ├─ protected
│  │  │  ├─ AuthRoute.tsx
│  │  │  └─ ProtectedRoute.tsx
│  │  └─ ui
│  │     ├─ accordion.tsx
│  │     ├─ alert-dialog.tsx
│  │     ├─ alert.tsx
│  │     ├─ aspect-ratio.tsx
│  │     ├─ avatar.tsx
│  │     ├─ badge.tsx
│  │     ├─ breadcrumb.tsx
│  │     ├─ button.tsx
│  │     ├─ calendar.tsx
│  │     ├─ card.tsx
│  │     ├─ carousel.tsx
│  │     ├─ chart.tsx
│  │     ├─ checkbox.tsx
│  │     ├─ collapsible.tsx
│  │     ├─ command.tsx
│  │     ├─ context-menu.tsx
│  │     ├─ dialog.tsx
│  │     ├─ drawer.tsx
│  │     ├─ dropdown-menu.tsx
│  │     ├─ form.tsx
│  │     ├─ hover-card.tsx
│  │     ├─ input-otp.tsx
│  │     ├─ input.tsx
│  │     ├─ label.tsx
│  │     ├─ menubar.tsx
│  │     ├─ navigation-menu.tsx
│  │     ├─ navigation.tsx
│  │     ├─ pagination.tsx
│  │     ├─ popover.tsx
│  │     ├─ progress.tsx
│  │     ├─ radio-group.tsx
│  │     ├─ resizable.tsx
│  │     ├─ scroll-area.tsx
│  │     ├─ select.tsx
│  │     ├─ separator.tsx
│  │     ├─ sheet.tsx
│  │     ├─ sidebar.tsx
│  │     ├─ skeleton.tsx
│  │     ├─ slider.tsx
│  │     ├─ sonner.tsx
│  │     ├─ switch.tsx
│  │     ├─ table.tsx
│  │     ├─ tabs.tsx
│  │     ├─ textarea.tsx
│  │     ├─ toast.tsx
│  │     ├─ toaster.tsx
│  │     ├─ toggle-group.tsx
│  │     ├─ toggle.tsx
│  │     ├─ tooltip.tsx
│  │     └─ use-toast.ts
│  ├─ contexts
│  │  └─ AuthContext.tsx
│  ├─ hooks
│  │  ├─ use-mobile.tsx
│  │  └─ use-toast.ts
│  ├─ index.css
│  ├─ lib
│  │  └─ utils.ts
│  ├─ main.tsx
│  ├─ pages
│  │  ├─ Booking.tsx
│  │  ├─ Dashboard.tsx
│  │  ├─ DriverDashboard.tsx
│  │  ├─ Index.tsx
│  │  ├─ Login.tsx
│  │  ├─ NotFound.tsx
│  │  └─ Signup.tsx
│  ├─ services
│  │  ├─ api.ts
│  │  └─ authTokens.ts
│  └─ vite-env.d.ts
├─ tailwind.config.ts
├─ tsconfig.app.json
├─ tsconfig.json
├─ tsconfig.node.json
└─ vite.config.ts

```