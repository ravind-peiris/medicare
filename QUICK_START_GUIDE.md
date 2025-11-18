# MediPulse - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Git (optional)

---

## Step 1: Backend Setup

### 1.1 Navigate to Backend Directory
```bash
cd backend
```

### 1.2 Install Dependencies
```bash
npm install
```

### 1.3 Configure Environment Variables
The `config.env` file already exists with MongoDB connection. Verify it contains:
```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://admin:1234@cluster0.rvqhg55.mongodb.net/medicare?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d
FRONTEND_URL=http://localhost:5173
```

### 1.4 Seed the Database (Important!)
This creates initial hospitals in the database:
```bash
node src/seedDatabase.js
```

You should see:
```
✅ Created 4 hospitals
✨ Database seeding completed successfully!
```

### 1.5 Start the Backend Server
```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
🚀 Server running on port 5000
```

**Keep this terminal open!**

---

## Step 2: Frontend Setup

### 2.1 Open New Terminal and Navigate to Frontend
```bash
cd frontend
```

### 2.2 Install Dependencies
```bash
npm install
```

### 2.3 Start the Frontend Development Server
```bash
npm run dev
```

You should see:
```
VITE ready in XXX ms
➜  Local:   http://localhost:5173/
```

**Keep this terminal open too!**

---

## Step 3: Access the Application

### Open Your Browser
Navigate to: **http://localhost:5173**

You should see the **MediPulse Landing Page** with:
- Modern healthcare-themed design
- "Sign In" and "Get Started" buttons
- Features section
- Testimonials
- Footer

---

## Step 4: Create Your First User

### 4.1 Register as a Patient
1. Click **"Get Started"** or **"Sign In"** → **"Sign Up"**
2. Fill in the registration form:
   - **Username**: johndoe
   - **Email**: john@example.com
   - **Password**: password123
   - **Role**: Select **"Patient"**
   - Fill in personal details (name, phone, DOB, gender, address, emergency contact)
   - Fill in patient-specific details (blood type, allergies if any)
3. Click **"Register"**

### 4.2 Register as a Doctor
1. Click **"Sign In"** → **"Sign Up"**
2. Fill in the registration form:
   - **Username**: drsarah
   - **Email**: sarah@example.com
   - **Password**: password123
   - **Role**: Select **"Doctor"**
   - Fill in personal details
   - Fill in doctor-specific details:
     - **Specialization**: Cardiologist
     - **Department**: Cardiology
     - **License Number**: DR123456 (format: 2 letters + 6 digits)
     - **Experience**: 10 (years)
     - **Consultation Fee**: 5000
4. Click **"Register"**

---

## Step 5: Test the System

### As a Patient:
1. **Login** with patient credentials
2. **View Profile** - See your demographic information
3. **Book Appointment**:
   - Click "New Appointment"
   - Select a doctor
   - Choose date and time
   - Select hospital (notice Government hospitals are FREE!)
   - Choose payment method
   - Confirm booking
4. **View Health Records** - See your medical history
5. **Check Bills** - View pending payments

### As a Doctor:
1. **Login** with doctor credentials
2. **View Patients** - See all patients in the system
3. **Filter Patients** - Use search and filters (gender, blood type)
4. **Click on a Patient** - View their profile
5. **Add New Record**:
   - Click "New Record" button
   - Notice date and doctor name are auto-filled!
   - Enter diagnosis, treatment, prescription, notes
   - Submit
6. **View Health Records** - See all records for that patient

---

## 🎯 Key Features to Test

### ✅ Implemented and Working:
1. **User Registration** - All roles (Patient, Doctor, Manager, Receptionist)
2. **User Login** - JWT authentication
3. **Doctor Portal**:
   - Patient list with filters
   - Patient profiles
   - Add health records (auto-fill date & doctor)
   - View health records
4. **Patient Portal**:
   - Profile view
   - Appointment booking with calendar
   - Hospital selection (Government = FREE)
   - Payment options (Insurance, Card, Pay Later, Cash)
   - View health records
   - View appointments
   - View bills
5. **Hospital Management**:
   - Government vs Private distinction
   - No payment for government hospitals
6. **Appointment Booking**:
   - Multi-step process
   - Doctor selection with filters
   - Date/time selection
   - Hospital selection
   - Payment processing

---

## 🔍 Troubleshooting

### Backend Won't Start
**Error**: `MongoDB connection error`
- Check if MongoDB URI is correct in `config.env`
- Ensure MongoDB Atlas allows connections from your IP
- Try the alternative connection in the code

### Frontend Won't Start
**Error**: `Cannot find module`
- Run `npm install` again
- Delete `node_modules` and `package-lock.json`, then `npm install`

### Can't Register Users
**Error**: `User already exists`
- Use different email/username
- Check MongoDB to see if user already exists

### Appointments Not Creating
**Error**: `Patient profile not found`
- Ensure you're logged in as a patient
- Patient profile is created automatically during registration

### No Doctors/Hospitals Showing
**Error**: Empty lists
- Run the seed script: `node src/seedDatabase.js`
- Register at least one doctor
- Check backend console for errors

---

## 📊 Database Collections

After setup, your MongoDB should have:
- **users** - All registered users
- **patients** - Patient profiles
- **doctors** - Doctor profiles
- **hospitals** - 4 seeded hospitals
- **healthrecords** - Medical records (created when doctors add records)
- **appointments** - Booked appointments
- **bills** - Billing information
- **payments** - Payment transactions

---

## 🎨 Default Test Credentials

After following the guide above, you'll have:

**Patient Account:**
- Email: john@example.com
- Password: password123

**Doctor Account:**
- Email: sarah@example.com
- Password: password123

---

## 📝 Next Steps

1. **Explore the System** - Try all features
2. **Add More Data** - Register more users, create appointments
3. **Test Workflows** - Complete patient journey from booking to consultation
4. **Check Database** - Use MongoDB Compass to view data
5. **Review Code** - Check implementation details

---

## 🆘 Need Help?

1. Check `IMPLEMENTATION_SUMMARY.md` for detailed feature list
2. Check backend logs in terminal
3. Check browser console for frontend errors
4. Review API documentation in backend README
5. Check MongoDB Atlas for data

---

## 🎉 You're All Set!

The MediPulse Healthcare System is now running locally. Explore all the features and test the complete patient and doctor workflows!

**Happy Testing! 🏥**
