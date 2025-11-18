# Medicare Frontend

A modern, responsive healthcare management system frontend built with React, TypeScript, and Tailwind CSS.

## Features

- **Landing Page**: Professional homepage with features showcase and call-to-action
- **Authentication**: Secure login and registration with role-based access
- **Dashboard**: Comprehensive healthcare management interface
- **Patient Management**: Digital health cards and medical records
- **Doctor Management**: Professional profiles and availability
- **Appointment System**: Booking and scheduling interface
- **Billing & Payments**: Financial management tools
- **Reports & Analytics**: Data visualization and insights
- **Responsive Design**: Mobile-first approach with modern UI

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **UI Components**: Radix UI primitives with shadcn/ui
- **Routing**: React Router DOM
- **State Management**: React Context API
- **HTTP Client**: Fetch API with custom service layer
- **Build Tool**: Vite
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Backend API running on http://localhost:5000

### Installation

1. **Install dependencies**
   ```bash
   pnpm install
   ```

2. **Start development server**
   ```bash
   pnpm dev
   ```

3. **Open in browser**
   Navigate to http://localhost:5173

### Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build
- `pnpm lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Dashboard.tsx   # Main dashboard component
│   ├── UserAuth.tsx    # Authentication components
│   └── ...             # Feature-specific components
├── pages/              # Page components
│   ├── LandingPage.tsx # Homepage
│   ├── LoginPage.tsx   # Login page
│   ├── RegisterPage.tsx # Registration page
│   ├── Index.tsx       # Dashboard page
│   └── NotFound.tsx    # 404 page
├── lib/                # Utility functions and services
│   ├── api.ts          # API service functions
│   ├── utils.ts        # Helper utilities
│   └── mockData.ts     # Mock data (deprecated)
├── hooks/              # Custom React hooks
├── App.tsx             # Main app component
└── main.tsx            # App entry point
```

## User Roles

### Patient
- View personal health information
- Book appointments with doctors
- Access medical records and prescriptions
- Manage billing and payments
- Update personal information

### Doctor
- View patient information and medical history
- Manage appointments and availability
- Add medical records and prescriptions
- Update professional profile
- Access patient analytics

### Manager
- Full system access
- Manage users, patients, and doctors
- View comprehensive reports and analytics
- Manage billing and financial operations
- System administration

## API Integration

The frontend communicates with the backend through a comprehensive API service layer:

- **Authentication**: Login, registration, profile management
- **Patients**: CRUD operations, medical records, search
- **Doctors**: Profile management, availability, specializations
- **Appointments**: Booking, scheduling, management
- **Billing**: Invoice generation, payment processing
- **Reports**: Analytics, statistics, data export

## Component Architecture

### UI Components
Built with Radix UI primitives and styled with Tailwind CSS:
- Accessible and keyboard navigable
- Consistent design system
- Dark/light mode support
- Mobile responsive

### Feature Components
- **Dashboard**: Role-based dashboard with widgets
- **PatientRecords**: Medical history and health card
- **AppointmentBooking**: Scheduling interface
- **PaymentProcessing**: Billing and payment forms
- **ReportsAnalytics**: Data visualization

## State Management

- **Authentication**: React Context for user state
- **API State**: React Query for server state
- **Local State**: useState and useReducer hooks
- **Persistence**: localStorage for user sessions

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Custom Components**: shadcn/ui component library
- **Responsive Design**: Mobile-first approach
- **Theme System**: Consistent color palette and typography
- **Animations**: Framer Motion for smooth transitions

## Development

### Code Style
- TypeScript for type safety
- ESLint for code quality
- Prettier for code formatting
- Component-based architecture

### Testing
- Unit tests with Jest
- Component tests with React Testing Library
- E2E tests with Playwright (planned)

### Performance
- Code splitting with React.lazy
- Image optimization
- Bundle analysis
- Lazy loading for better UX

## Deployment

### Build Process
```bash
pnpm build
```

### Environment Variables
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Medicare
```

### Production Checklist
- [ ] Update API endpoints
- [ ] Configure CORS settings
- [ ] Set up error monitoring
- [ ] Enable compression
- [ ] Configure CDN

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## License

This project is licensed under the MIT License.