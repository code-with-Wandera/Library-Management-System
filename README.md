#  Advanced Library Management System API

A production-ready Node.js/Express backend for managing books, members, and academic classes. Features include automated fine calculation, CSV import/export, and academic level categorization.

---

##  Key Features

* **Lending System**: Explicit issue/return logic with automated due-date setting.
* **Fine Management**: Real-time calculation of overdue fines ($1.50/day).
* **Academic Categorization**: Group books and members by level (Primary, Secondary, College, University).
* **Bulk Data**: Support for CSV import (Multer/PapaParse) and export for member records.
* **Security**: Protected by Helmet, CORS, Rate Limiting, and JWT Authentication.
* **Performance**: Optimized MongoDB queries using indexing and `.lean()`.

---

##  Tech Stack

* **Runtime**: Node.js (>=18.0.0)
* **Framework**: Express.js
* **Database**: MongoDB (via Mongoose)
* **Data Parsing**: PapaParse (CSV)
* **Logging/Security**: Morgan, Helmet, Express-Rate-Limit

---

## Project Structure



---

## Setup & Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd library-management-server