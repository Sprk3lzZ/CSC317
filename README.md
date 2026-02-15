# Expense Management System

## Project Overview

This CSC 317 course project is an expense management system designed for employees and HR departments. The application will allow employees to easily submit and track their expense claims, while HR or managers can review and approve them efficiently.

The system will handle different types of expenses: mileage reimbursement, meal expenses, travel costs, accommodation, parking and toll fees, office supplies, remote work allowances, training fees, and client-related expenses. It will automate calculations, store receipts, and generate reports to simplify reimbursement and accounting processes.

**Goal:** Create a practical tool that saves time, reduces errors, and improves transparency in expense management within a company.

---

## Data: What Does the Application Need?

### Main Types of Information

Without structured data, there is no real interaction or meaningful behavior. Here are the main types of information the application will need to work with:

| Type of Information | Role | What the app creates, views, or modifies |
|--------------------|------|------------------------------------------|
| **Users** | Employees, managers, HR | User account, profile, role (employee vs. approver) |
| **Expense Reports** | Overall reimbursement request | Created by employee, consultation, status (draft, submitted, under review, approved, rejected, reimbursed) |
| **Expense Lines** | Individual expense within a report | Date, category, amount, description, receipt attachment |
| **Expense Categories** | Predefined types | Mileage, meals, travel, accommodation, parking, supplies, remote work, training, client |
| **Approvals** | Validation by manager/HR | Who approved, when, optional comment |
| **Settings** | Business rules | Mileage rate ($/km), per-category limits, company policies |

---

## Realistic Example Data

Here are three concrete examples of what the application might handle. The format is flexible; the focus is on plausible data that illustrates user interactions.

---

### Example 1: Expense Report – Client Trip (Marie Dupont)

**User**
- Name: Marie Dupont  
- Email: marie.dupont@company.com  
- Department: Sales  
- Manager: Jean Martin  
- Role: Employee  

**Expense Report #REF-2025-001**
- Created: February 12, 2025  
- Period: February 3–7, 2025  
- Status: Under review  
- Purpose: Client visit in Lyon  

**Expense Lines**

| Date   | Category   | Description            | Amount   | Receipt          |
|--------|------------|------------------------|----------|------------------|
| 02/03  | Travel     | Train Paris–Lyon      | $89.00   | receipt_tgv.jpg  |
| 02/04  | Accommodation | Hotel 1 night      | $145.00  | invoice_hotel.pdf |
| 02/05  | Meals      | Lunch with client     | $78.50   | receipt_resto.jpg |
| 02/06  | Mileage    | 42 km × $0.35/km      | $14.70   | (auto-calculated) |
| **Total** |           |                        | **$327.20** |                |

**Context:** Marie submits her report after her trip. Jean Martin (her manager) must approve it before HR processes the reimbursement.

---

### Example 2: Expense Report – Remote Work Week (Thomas Bernard)

**User**
- Name: Thomas Bernard  
- Email: thomas.bernard@company.com  
- Department: IT  
- Manager: Sophie Lemoine  
- Role: Employee  

**Expense Report #REF-2025-002**
- Created: February 14, 2025  
- Period: February 10–14, 2025  
- Status: Draft  
- Purpose: Remote work allowance + supplies  

**Expense Lines**

| Date   | Category    | Description                 | Amount  | Receipt           |
|--------|-------------|-----------------------------|---------|-------------------|
| 02/10  | Remote Work | Weekly allowance (5 days)   | $25.00  | (fixed per policy) |
| 02/12  | Supplies    | HDMI cable, USB drive       | $34.90  | invoice_amazon.pdf |
| **Total** |             |                             | **$59.90** |                 |

**Context:** Thomas has filled in his report but has not submitted it yet. Remote work amounts are calculated automatically based on company policy.

---

### Example 3: Expense Report – Training (Léa Petit)

**User**
- Name: Léa Petit  
- Email: lea.petit@company.com  
- Department: Marketing  
- Manager: Marc Durand  
- Role: Employee  

**Expense Report #REF-2025-003**
- Created: February 8, 2025  
- Submitted: February 9, 2025  
- Status: Approved  
- Purpose: Google Analytics certification  
- Approved by: Marc Durand, February 11, 2025  

**Expense Lines**

| Date   | Category     | Description                  | Amount   | Receipt             |
|--------|--------------|------------------------------|----------|---------------------|
| 02/05  | Training     | Certification registration   | $199.00  | invoice_course.pdf  |
| 02/06  | Parking      | 4h parking at training center| $12.00   | parking_ticket.jpg  |
| **Total** |              |                              | **$211.00** |                  |

**Context:** Report already approved by the manager, pending HR processing for reimbursement.

---

## Reflection

### What Was Easier Than Expected
- Identifying the main expense categories: they map well to common workplace situations.
- Visualizing the overall flow: employee submits → manager approves → HR reimburses.
- Understanding that each expense report is a **container** and the lines are the **detailed items**.

### What Was Harder
- **Business rules:** Limits (e.g., max $25 for meals), mileage rates, and reimbursement conditions vary by company. Should they be configurable?
- **Attachments:** Storing and linking receipts/photos to expense lines adds complexity (size, formats, security).
- **Roles and permissions:** Who can see what? An employee sees their reports; a manager sees their team’s; HR sees all. The exact rules need to be defined.

### Did the Idea Get Simpler or More Complicated?
It became **more nuanced**. The core remains simple (submit, approve, reimburse), but edge cases (auto-calculated mileage, fixed allowances, mandatory vs. optional receipts) show that clear design choices will be needed.

---

*CSC 317 Project – Week 2 – Data Exploration*
