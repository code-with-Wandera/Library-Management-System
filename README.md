

# Library Management System

A full-stack Library Management System designed to streamline library operations, including managing books, members, and user authentication. This system is built with modern web technologies, featuring a responsive frontend and secure backend with JWT-based authentication.

---

## Table of Contents

- [Features](#features)  
- [Technologies Used](#technologies-used)  
- [Setup & Installation](#setup--installation)  
- [Usage](#usage)  
- [Folder Structure](#folder-structure)  
- [License](#license)  

---

## Features

- **User Authentication & Authorization**
  - Secure registration and login using **JWT** (JSON Web Tokens)
  - Password hashing with **bcrypt**
  - Role-based access (Admin, Librarian, Member)

- **Book Management**
  - Add, update, delete, and view books
  - Search books by title, author, or category
  - Pagination for book listings

- **Member Management**
  - Add, update, and remove members
  - View member profiles and borrowing history

- **Borrowing & Returning**
  - Issue books to members and track due dates
  - Automatic tracking of overdue books

- **Responsive UI**
  - Built with **React.js**, **Tailwind CSS**, and **DaisyUI**
  - Mobile-first and fully responsive design

- **Secure Backend**
  - RESTful API with **Node.js** and **Express.js**
  - MongoDB database for storing books, members, and user data
  - Cross-Origin Resource Sharing (**CORS**) enabled for API communication

- **Additional Features**
  - Activity logging for auditing purposes
  - Real-time notifications for overdue books (planned for future updates)

---

## Technologies Used

**Frontend:**
- React.js
- Tailwind CSS
- DaisyUI
- Axios for API requests
- React Router v6 for client-side routing

**Backend:**
- Node.js
- Express.js
- MongoDB (via Mongoose)
- JWT for authentication
- bcrypt for password hashing
- CORS middleware

**Development Tools:**
- Vite (frontend build tool)
- Nodemon (backend auto-reloading)
- Postman (API testing)

---

## Setup & Installation

### Prerequisites
- Node.js >= 22.x
- npm >= 9.x
- MongoDB (local or cloud instance)
- Git

### Backend Setup

1. Navigate to the server folder:

```bash
cd Server
 2. Install dependancies 
 npm install
start server 
npm run dev
