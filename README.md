# Jeseb | Professional Financial Engineering Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen)](https://nodejs.org/)

## 🚀 Overview

**Jeseb** is a robust personal finance management system built for developers and power users. Designed with **Hexagonal Architecture (Ports & Adapters)** and **Domain-Driven Design (DDD)**, it provides a highly decoupled environment where business logic is independent of the database, UI, or external services.

## 🏗️ Architectural Design

The project is structured to enforce a strict separation of concerns:
- **Domain Layer:** Pure business entities and domain services (Accounting logic, Balance validation).
- **Application Layer:** Orchestrates use cases and defines input/output ports.
- **Infrastructure Layer:** Implements adapters for Express.js, Prisma ORM (Postgres), and Mailpit.

## 🛠️ Tech Stack

- **Backend:** Node.js, TypeScript, Express.js.
- **Database:** PostgreSQL with Prisma ORM.
- **Frontend:** Astro (SSR/Static), React (Interactive Dashboards), Bulma CSS.
- **DevOps:** Docker & Docker Compose (Full containerized local workflow).
- **Security:** JWT-based Auth, 2FA (Email-based), and Secure Session Management.

## 📂 Project Structure

The repository is organized as a **Monorepo** to maintain a tight coupling between the API contracts and the client implementation, orchestrated by Docker for seamless environment replication.

### 🏗️ Global Overview
```text
.
├── backend/            # Node.js + TypeScript API (Hexagonal Architecture)
├── frontend/           # Astro + React Dashboard (Islands Architecture)
├── docker-compose.yml  # Infrastructure orchestration (Postgres, Mailpit, Apps)
└── .env.example        # Centralized environment configuration
```

## 🧪 Testing Strategy

To ensure reliability, the project includes:
- **Unit Tests:** Business logic validation using Vitest.
- **Integration Tests:** Verification of Database Adapters and Repository patterns.

##
Developed with engineering excellence by [SYSMA](https://sysma1997.github.io/).