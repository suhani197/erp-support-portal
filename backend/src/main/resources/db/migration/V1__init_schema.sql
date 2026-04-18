-- =====================================================
-- V1__init_schema.sql
-- ERP Support Portal - Initial Schema
-- =====================================================

CREATE TYPE user_role AS ENUM ('REQUESTER', 'AGENT', 'ADMIN');
CREATE TYPE ticket_status AS ENUM ('NEW', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'RESOLVED', 'CLOSED');
CREATE TYPE ticket_priority AS ENUM ('P1', 'P2', 'P3');
CREATE TYPE ticket_module AS ENUM ('FINANCE', 'INVENTORY', 'SALES', 'TECHNICAL', 'HR', 'PROCUREMENT');
CREATE TYPE kb_status AS ENUM ('DRAFT', 'PUBLISHED');
CREATE TYPE kb_link_type AS ENUM ('SUGGESTED', 'USED');
CREATE TYPE comment_type AS ENUM ('PUBLIC', 'INTERNAL');

-- Users
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) NOT NULL UNIQUE,
    password    VARCHAR(255) NOT NULL,
    full_name   VARCHAR(255) NOT NULL,
    role        user_role NOT NULL DEFAULT 'REQUESTER',
    active      BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role  ON users(role);

-- Tickets
CREATE TABLE tickets (
    id                    BIGSERIAL PRIMARY KEY,
    title                 VARCHAR(500) NOT NULL,
    description           TEXT NOT NULL,
    status                ticket_status NOT NULL DEFAULT 'NEW',
    priority              ticket_priority NOT NULL DEFAULT 'P3',
    module                ticket_module NOT NULL,
    app_module            VARCHAR(255),
    created_by_id         BIGINT NOT NULL REFERENCES users(id),
    assigned_to_id        BIGINT REFERENCES users(id),
    first_agent_action_at TIMESTAMP,
    resolved_at           TIMESTAMP,
    closed_at             TIMESTAMP,
    created_at            TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tickets_status       ON tickets(status);
CREATE INDEX idx_tickets_priority     ON tickets(priority);
CREATE INDEX idx_tickets_module       ON tickets(module);
CREATE INDEX idx_tickets_created_by   ON tickets(created_by_id);
CREATE INDEX idx_tickets_assigned_to  ON tickets(assigned_to_id);
CREATE INDEX idx_tickets_created_at   ON tickets(created_at DESC);

-- Ticket Comments
CREATE TABLE ticket_comments (
    id           BIGSERIAL PRIMARY KEY,
    ticket_id    BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    author_id    BIGINT NOT NULL REFERENCES users(id),
    body         TEXT NOT NULL,
    comment_type comment_type NOT NULL DEFAULT 'PUBLIC',
    created_at   TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);

-- KB Tags
CREATE TABLE tags (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- KB Articles
CREATE TABLE kb_articles (
    id               BIGSERIAL PRIMARY KEY,
    title            VARCHAR(500) NOT NULL,
    module           ticket_module NOT NULL,
    app_module       VARCHAR(255),
    symptoms         TEXT,
    root_cause       TEXT,
    resolution_steps TEXT NOT NULL,
    status           kb_status NOT NULL DEFAULT 'DRAFT',
    created_by_id    BIGINT NOT NULL REFERENCES users(id),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_kb_status ON kb_articles(status);
CREATE INDEX idx_kb_module ON kb_articles(module);

-- KB Article Tags (many-to-many)
CREATE TABLE kb_article_tags (
    article_id BIGINT NOT NULL REFERENCES kb_articles(id) ON DELETE CASCADE,
    tag_id     BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- Ticket <-> KB Links
CREATE TABLE ticket_kb_links (
    id         BIGSERIAL PRIMARY KEY,
    ticket_id  BIGINT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    article_id BIGINT NOT NULL REFERENCES kb_articles(id),
    link_type  kb_link_type NOT NULL DEFAULT 'SUGGESTED',
    linked_by  BIGINT REFERENCES users(id),
    linked_at  TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (ticket_id, article_id)
);

-- SLA Policies
CREATE TABLE sla_policies (
    id                        BIGSERIAL PRIMARY KEY,
    priority                  ticket_priority NOT NULL UNIQUE,
    first_response_minutes    INT NOT NULL,
    resolution_minutes        INT NOT NULL,
    updated_at                TIMESTAMP NOT NULL DEFAULT NOW()
);

-- SLA Metrics (one per ticket, recomputed on events)
CREATE TABLE sla_metrics (
    id                        BIGSERIAL PRIMARY KEY,
    ticket_id                 BIGINT NOT NULL UNIQUE REFERENCES tickets(id) ON DELETE CASCADE,
    first_response_minutes    INT,
    resolution_minutes        INT,
    first_response_breached   BOOLEAN NOT NULL DEFAULT FALSE,
    resolution_breached       BOOLEAN NOT NULL DEFAULT FALSE,
    computed_at               TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sla_metrics_ticket ON sla_metrics(ticket_id);
