# ⚙️ Jeseb | Core API

This is the central engine of the **Jeseb**, a high-performance RESTful API built with Node.js and TypeScript. It handles business logic, secure persistence, and financial orchestrations for the entire ecosystem.

## 🧠 Business Logic & Domain

The API is architected to manage personal wealth through three core domain entities:

* **Accounts (Financial Assets):** Represents any liquidity source (e.g., Bank accounts, Cash, Crypto wallets, or Physical assets). Each account tracks its own real-time balance.
* **Categories:** Flexible, user-defined labels used to classify financial movements (e.g., Food, Rent, Salary, Freelance Income).
* **Transactions:** The fundamental unit of activity. Each transaction is linked to an **Account**, triggering an automatic balance update. It supports income/expense types, category tagging, and optional descriptive notes.



## 🛠️ Technical Architecture

This backend follows **Hexagonal Architecture (Ports & Adapters)** to ensure the business core remains agnostic of external technologies:

* **Language:** TypeScript (Strict Type Checking).
* **Framework:** Express.js (as the primary Input Adapter).
* **ORM:** Prisma with SQLite (as the Persistence Adapter).
* **Security:** JWT (JSON Web Tokens) for stateless sessions + 2FA (Email-based) for high-risk actions.
* **Testing:** Jest & Supertest for quality assurance.

## 🧪 Testing Strategy

As a senior-grade project, reliability is enforced through a multi-layered testing suite:

1.  **Unit Tests (Jest):** Validates domain entities and business rules in total isolation. 
    * *Example:* Ensuring an account cannot process a transaction that results in an invalid state.
2.  **Integration Tests (Jest + Prisma):** Verifies the correct communication between the application layer and the SQLite database.
    * *Example:* Testing the complete flow of creating a transaction and verifying the balance reflection in the database.

```bash
# Execute all tests
npm run test
```


## 🔌 API Endpoints (Quick Look)

**🔐 Identity & Access**:

- `POST /user/register` - User onboarding.
- `POST /user/validate/:token` - Validate the user by means of a token sent to the email.
- `POST /user/login` - Initial authentication & 2FA trigger.

**💰 Finance Engine**:

- `/account` - Retrieve all financial assets and current balances.
- `/category` - Manage classification labels.
- `/transaction` - Fetch history with advanced filtering support.


## 📂 Project Structure

```Plaintext
backend/
 ├── src/
 |    ├── [Module] (Name-Entity)          # Name Entity the buiness logic (account, category, transaction, user...)
 │    |     ├── domain/          # Pure Business Logic (Entities & Repository Interfaces)
 │    |     ├── application/     # Use Cases & Services (Application Orchestration)
 │    |     └── infrastructure/  # External Adapters (Prisma, Express, Email Services)
 │    └── shared/                # Cross-cutting concerns (Logger, Constants, Errors)
 ├── prisma/                     # Database Schema & Migrations
 └── __tests__/                  # Unit and Integration test suites
```
##
Developed with engineering excellence by [SYSMA](https://sysma1997.github.io/).