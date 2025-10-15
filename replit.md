# Overview

This is an AI4Health Emergency MVP application that simulates a healthcare emergency response system with three distinct user roles: User (patient), Ambulance, and Hospital. The application is built as a single-page React app with tab-based navigation, allowing users to switch between different perspectives within the same browser session. The system demonstrates real-time emergency coordination with cross-tab communication, status tracking, and comprehensive emergency workflow management.

# Recent Changes

**October 15, 2025 - WebSocket Real-Time Emergency Notifications**
- Implemented complete WebSocket infrastructure for real-time emergency notifications across all interfaces
- Created WebSocket server with broadcasting capabilities for emergency_created and emergency_updated events
- Built WebSocket client utility with automatic reconnection logic and event subscription system
- Enhanced Hospital and Ambulance views to receive and respond to real-time emergency updates
- Hospital dashboard now fetches and displays real emergency data from API with automatic refresh on WebSocket events
- End-to-end flow confirmed: Patient emergency → WebSocket broadcast → Hospital/Ambulance instant updates
- System validated as production-ready by architect review

**October 14, 2025 - Replit Environment Setup**
- Successfully imported project from GitHub and configured for Replit environment
- Installed Node.js 20 and all npm dependencies
- Configured workflow to run development server on port 5000 with `npm run dev`
- Server properly configured to bind to 0.0.0.0:5000 with allowedHosts enabled for Replit proxy
- Deployment configuration set up for autoscale with build and production commands
- Application running successfully with in-memory storage (no database required for demo)

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for fast development and building
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: Zustand for lightweight global state management with persistent storage
- **Routing**: Single-page application with tab-based navigation (no React Router)
- **Build System**: Vite with TypeScript compilation and hot module replacement

## Backend Architecture
- **Server Framework**: Express.js with TypeScript running in ESM mode
- **API Design**: RESTful APIs for emergency management operations
- **Data Layer**: In-memory storage implementation with interface for future database integration
- **Development Integration**: Vite middleware integration for seamless full-stack development

## Real-Time Communication Architecture

### WebSocket Infrastructure
- **Server-Side WebSocket**: Dedicated WebSocket server on `/ws` endpoint for bidirectional real-time communication
- **Broadcasting System**: Event-based broadcasting to all connected clients for emergency updates
- **Event Types**: `emergency_created`, `emergency_updated`, and `connected` events
- **Connection Management**: Automatic tracking of connected clients with cleanup on disconnect
- **Client Reconnection**: Automatic reconnection with 3-second retry interval on connection loss
- **Event Subscription**: Type-safe event subscription system for handling specific message types

### Cross-Tab Communication
- **Primary Method**: BroadcastChannel API for real-time state synchronization between browser tabs
- **Fallback Strategy**: LocalStorage events and direct storage access for browsers without BroadcastChannel support
- **State Persistence**: Automatic state saving to localStorage with restoration on application load

### Emergency Notification Flow
1. Patient creates emergency via User interface
2. Server broadcasts `emergency_created` event via WebSocket to all connected clients
3. Hospital and Ambulance interfaces receive the event instantly
4. Views automatically refresh their emergency data from the API
5. Toast notifications inform users of new emergency alerts
6. Real-time updates ensure all dashboards stay synchronized

## Data Storage Solutions
- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions for users and emergencies
- **Development Storage**: In-memory storage implementation for rapid development and testing
- **Production Ready**: Configured for Neon Database (PostgreSQL) with connection pooling
- **Migration System**: Drizzle Kit for database schema migrations and management

## Real-Time Features
- **Web Notifications**: Browser notification API integration with permission handling
- **Visual Feedback**: Toast notifications and status indicators for user interactions
- **Device Integration**: Vibration API support for mobile devices
- **Location Services**: Geolocation API integration for emergency location tracking

## Component Architecture
- **Design System**: Comprehensive UI component library with consistent theming
- **Modular Views**: Role-specific view components (UserView, AmbulanceView, HospitalView)
- **Shared Components**: Reusable components for timeline, status chips, and tab navigation
- **Responsive Design**: Mobile-first approach with Tailwind CSS breakpoints

## Hospital Dashboard Features
- **Multi-Tab Interface**: Hospital view enhanced with three dedicated tabs for different operational aspects
  - **Overview Tab**: Original incoming patient management with preparation checklist and resource status
  - **Emergency Tab**: Advanced emergency management with AI-driven resource planning
  - **Complete Analysis Tab**: Comprehensive analytics dashboard with charts and AI insights

### Emergency Section
- **Patient Selection**: Interactive patient cards with severity indicators and condition details
- **AI Pre-Arrangement System**: Intelligent resource requirement analysis based on patient condition
  - Automatic blood type and quantity calculation
  - Medicine requirements with availability checking
  - Equipment needs assessment with real-time inventory status
- **Availability Indicators**: Visual ✅/❌ badges for quick resource status identification
- **Alternate Hospital Suggestions**: Nearby hospital recommendations with distance and resource availability
- **Action Controls**: Auto-arrange and staff notification buttons for rapid response

### Complete Analysis Section
- **Key Statistics Dashboard**: Real-time metrics display
  - Total patients today
  - Bed occupancy percentage
  - Resource usage tracking
  - Staff availability monitoring
- **Visual Analytics**: Interactive charts powered by Recharts
  - Pie chart for bed occupancy visualization
  - Bar chart for resource usage comparison
- **AI Insights Panel**: Predictive analytics and alerts
  - ICU occupancy predictions
  - Blood inventory alerts
  - Peak hour forecasting
  - Staff requirement recommendations
- **Priority-based Alerts**: Color-coded insights (high/medium/low priority)

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18, React DOM, TypeScript for type safety
- **Build Tools**: Vite for development server and building, esbuild for server compilation
- **State Management**: Zustand for client-side state, TanStack React Query for server state

## UI and Styling
- **Component Library**: Radix UI primitives (@radix-ui/react-*) for accessible components
- **Styling**: Tailwind CSS with PostCSS for utility-first styling
- **UI Components**: Shadcn/ui component system with class-variance-authority for variants
- **Icons**: Lucide React for consistent iconography
- **Data Visualization**: Recharts for interactive charts and analytics dashboards

## Backend Infrastructure  
- **Server**: Express.js with TypeScript support
- **Database**: Drizzle ORM with Neon Database (PostgreSQL) driver
- **Session Management**: Connect-pg-simple for PostgreSQL session storage
- **Development Tools**: tsx for TypeScript execution, Replit-specific plugins

## Utility Libraries
- **Date Handling**: Day.js with timezone support for IST formatting
- **Validation**: Zod with Drizzle-Zod integration for type-safe schemas
- **Utilities**: clsx and tailwind-merge for conditional CSS classes
- **Development**: Various Replit-specific plugins for enhanced development experience

## Development and Deployment
- **Environment**: Node.js with ESM module support
- **Database**: PostgreSQL via Neon serverless driver
- **Hosting**: Configured for Replit deployment with production build optimization
- **Monitoring**: Custom logging middleware for API requests and development insights