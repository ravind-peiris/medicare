# Medicare Backend API

A comprehensive healthcare management system backend built with Node.js, Express, and MongoDB.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Support for Patients, Doctors, and Managers
- **Patient Management**: Digital health cards, medical records, insurance information
- **Doctor Management**: Specializations, availability, qualifications
- **Appointment System**: Booking, scheduling, and management
- **Billing & Payments**: Comprehensive billing system with multiple payment methods
- **Reports & Analytics**: Dashboard statistics and detailed reports
- **Security**: Rate limiting, input validation, and data sanitization

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JSON Web Tokens (JWT)
- **Security**: Helmet, CORS, Rate Limiting
- **Validation**: Express Validator
- **Environment**: dotenv

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd medicare/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp config.env.example .env
   # Edit .env with your configuration
   ```

4. **Start the server**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb+srv://admin:1234@cluster0.rvqhg55.mongodb.net/medicare?retryWrites=true&w=majority&appName=Cluster0

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/me` - Update current user
- `PUT /api/auth/change-password` - Change password
- `DELETE /api/auth/me` - Deactivate account
- `POST /api/auth/logout` - Logout user

### Patients
- `GET /api/patients` - Get all patients
- `GET /api/patients/:id` - Get patient by ID
- `GET /api/patients/card/:cardNumber` - Get patient by card number
- `POST /api/patients` - Create new patient
- `PUT /api/patients/:id` - Update patient
- `POST /api/patients/:id/medical-history` - Add medical record
- `GET /api/patients/search` - Search patients
- `DELETE /api/patients/:id` - Deactivate patient

### Doctors
- `GET /api/doctors` - Get all doctors
- `GET /api/doctors/:id` - Get doctor by ID
- `POST /api/doctors` - Create new doctor
- `PUT /api/doctors/:id` - Update doctor
- `GET /api/doctors/:id/availability` - Get doctor availability
- `GET /api/doctors/search` - Search doctors
- `GET /api/doctors/specializations` - Get specializations
- `GET /api/doctors/departments` - Get departments
- `DELETE /api/doctors/:id` - Deactivate doctor

### Appointments
- `GET /api/appointments` - Get all appointments
- `GET /api/appointments/:id` - Get appointment by ID
- `POST /api/appointments` - Create new appointment
- `PUT /api/appointments/:id` - Update appointment
- `GET /api/appointments/available-slots` - Get available time slots
- `PUT /api/appointments/:id/cancel` - Cancel appointment
- `DELETE /api/appointments/:id` - Delete appointment

### Bills
- `GET /api/bills` - Get all bills
- `GET /api/bills/:id` - Get bill by ID
- `POST /api/bills` - Create new bill
- `PUT /api/bills/:id` - Update bill
- `GET /api/bills/bill-number/:billNumber` - Get bill by bill number
- `GET /api/bills/overdue` - Get overdue bills
- `PUT /api/bills/:id/mark-paid` - Mark bill as paid
- `DELETE /api/bills/:id` - Delete bill

### Payments
- `GET /api/payments` - Get all payments
- `GET /api/payments/:id` - Get payment by ID
- `POST /api/payments` - Create new payment
- `PUT /api/payments/:id/status` - Update payment status
- `POST /api/payments/:id/refund` - Process refund
- `GET /api/payments/reference/:referenceNumber` - Get payment by reference
- `GET /api/payments/statistics` - Get payment statistics

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics
- `GET /api/reports/patients` - Get patient statistics
- `GET /api/reports/appointments` - Get appointment analytics
- `GET /api/reports/financial` - Get financial reports
- `GET /api/reports/export` - Export data

## User Roles

### Patient
- View own profile and medical records
- Book appointments
- View own bills and make payments
- Update personal information

### Doctor
- View patient information
- Manage appointments
- Add medical records
- Update own profile and availability

### Manager
- Full access to all features
- Manage users, patients, and doctors
- View all reports and analytics
- Manage billing and payments

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access Control**: Different permissions for different user types
- **Input Validation**: Comprehensive validation using express-validator
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers
- **Password Hashing**: bcrypt for secure password storage

## Database Models

### User
- Basic user information and authentication
- Role-based profile data
- Password management

### Patient
- Health card information
- Medical history
- Insurance details
- Emergency contacts

### Doctor
- Professional information
- Specializations and qualifications
- Availability schedule
- Consultation fees

### Appointment
- Patient and doctor references
- Scheduling information
- Status tracking
- Medical notes and prescriptions

### Bill
- Itemized billing
- Tax and discount calculations
- Payment status tracking
- Insurance claims

### Payment
- Multiple payment methods
- Transaction tracking
- Refund management
- Payment statistics

## Error Handling

The API includes comprehensive error handling with:
- Validation errors
- Authentication errors
- Authorization errors
- Database errors
- Custom business logic errors

All errors return consistent JSON responses with appropriate HTTP status codes.

## Development

### Scripts
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Code Structure
```
src/
├── models/          # Database models
├── routes/          # API routes
├── middleware/      # Custom middleware
└── server.js        # Main server file
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

