# CRM & Facturation API

> A modular backend for customer relationship and invoicing workflows, built with NestJS, TypeScript, TypeORM and MySQL.

[![NestJS](https://img.shields.io/badge/NestJS-11-E0234E?style=flat-square&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Database-4479A1?style=flat-square&logo=mysql&logoColor=white)](https://www.mysql.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-ORM-FE0803?style=flat-square)](https://typeorm.io/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI-85EA2D?style=flat-square&logo=swagger&logoColor=black)](https://swagger.io/)

## Overview

CRM & Facturation API is a modular NestJS backend organized around business domains instead of a single monolithic feature folder.

The source tree includes dedicated areas for authentication, identity, catalog, contracting, finance, execution, calendar, teams, notifications, messaging and marketplace concerns. The application uses TypeORM with MySQL for persistence and includes JWT-based authentication, request validation, Swagger/OpenAPI documentation and file-upload support.

## Architecture

```text
                         HTTP / REST
                              │
                              ▼
                    ┌──────────────────┐
                    │    NestJS API    │
                    └────────┬─────────┘
                             │
          ┌──────────────────┼──────────────────┐
          ▼                  ▼                  ▼
     Authentication       Domains          Shared Layer
     JWT / Passport    ┌─────────────┐     Validation
                       │ Identity    │     Common utilities
                       │ Catalog     │
                       │ Contracting │
                       │ Finance     │
                       │ Execution   │
                       │ Calendar    │
                       │ Teams       │
                       │ Messaging   │
                       │ Notification│
                       │ Marketplace │
                       └──────┬──────┘
                              │
                              ▼
                       ┌────────────┐
                       │ TypeORM    │
                       └─────┬──────┘
                             ▼
                         ┌───────┐
                         │ MySQL │
                         └───────┘
```

## Domain Modules

| Module | Responsibility |
|---|---|
| `auth` | Authentication and JWT access control |
| `identity` | Identity-related domain functionality |
| `catalog` | Catalog data and management |
| `contracting` | Contract-related workflows |
| `finance` | Financial and invoicing concerns |
| `execution` | Execution/workflow domain |
| `calendar` | Calendar-related operations |
| `teams` | Team management |
| `message` | Messaging capabilities |
| `notification` | Notification handling |
| `marketplace` | Marketplace-related domain functionality |
| `domain-services` | Shared business-domain services |
| `common` | Cross-cutting utilities and shared code |

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | NestJS 11 |
| Language | TypeScript 5 |
| Persistence | TypeORM 0.3 + MySQL 2 |
| Authentication | Passport + JWT + bcrypt |
| API documentation | Swagger / OpenAPI |
| Validation | class-validator + class-transformer |
| File handling | Multer |
| Testing | Jest + Supertest |
| Tooling | ESLint + Prettier |

## Project Structure

```text
src/
├── auth/
├── identity/
├── catalog/
├── contracting/
├── finance/
├── execution/
├── calendar/
├── teams/
├── message/
├── notification/
├── marketplace/
├── domain-services/
├── common/
├── app.module.ts
└── main.ts
```

## Getting Started

### Requirements

- Node.js
- npm
- MySQL

### Install

```bash
npm install
```

### Configure the database

Create the required environment configuration for your MySQL connection and authentication settings before starting the application.

Do not commit production credentials or JWT secrets to the repository.

### Development

```bash
npm run start:dev
```

### Production build

```bash
npm run build
npm run start:prod
```

## API Documentation

The application includes Swagger/OpenAPI support. Once the API is running, open the Swagger endpoint configured by `src/main.ts` to explore the available HTTP operations.

## Testing

```bash
# Unit tests
npm run test

# End-to-end tests
npm run test:e2e

# Coverage
npm run test:cov
```

## Engineering Focus

This project is useful as a backend architecture example because the code is organized around business domains rather than a collection of unrelated controllers. It also demonstrates common production backend concerns: authentication, authorization boundaries, validation, persistence, API documentation, testing and separation of domain responsibilities.

## Status

Active development / learning project. The repository is intentionally kept modular so additional CRM and financial workflows can be added without turning the API into one large feature module.
