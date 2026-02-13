# SNQL – ServiceNow Query Language

SNQL is a lightweight SQL-inspired query language for ServiceNow, designed to make querying tables faster, more readable, and more powerful than traditional encoded queries.

It provides autocomplete, dot-walking support, SQL-like syntax, and extensible output formats..

---

## ✨ Features

### 🔎 SQL-like Query Syntax
Write readable queries like:

```sql
from incident
where caller_id.email like 'test'
and priority = 1
order by sys_created_on desc
